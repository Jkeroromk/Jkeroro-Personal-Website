"use client";

import React, { useEffect, useRef, memo } from "react";
import { useControlPanel } from "@/contexts/ControlPanelContext";

/**
 * 3D 粒子保时捷 911
 *
 * 数据来自 /static/porsche-911.bin（由 Blender 从 3D 模型表面采样生成）：
 *   - 粒子：位置 + 法线 + 材质亮度（黑车漆 / 白轮毂 / JKERORO 车牌…）
 *   - 遮挡网格：减面后的车身，只写深度，用来挡住车背面的粒子
 *
 * 模型："(FREE) Porsche 911 Carrera 4S" by Lionsharp Studios，CC BY-SA 4.0（已修改）
 */

const MODEL_URL = "/static/porsche-911.bin";
const MODEL_SCALE = 2.6; // 模型单位 → 场景单位
const CAMERA_HEIGHT_RATIO = 0.2; // 相机高度 = cameraZ * ratio
const CAMERA_TARGET_Y = -1.5; // 看向点略低于车中心，让车在画面里偏上，避开下方头像
const START_YAW = 0.75; // 初始角度：右前 3/4，和原来的照片一样
const AUTO_ROTATE_SPEED = 0.22; // rad/s
const AUTO_ROTATE_DELAY = 1500; // 拖拽结束后多久恢复自转（ms）
const DRAG_SPEED = 0.008; // rad / px
const MOBILE_POINT_LIMIT = 70000;

const vertexShader = `
uniform vec2 uResolution;
uniform sampler2D uDisplacementTexture;
uniform float uBasePointSize;
uniform float uBrightness;
uniform float uDisplacementStrength;
uniform vec3 uLightDir;
uniform vec3 uLight2Dir;

attribute vec3 aNormal;
attribute float aBase;
attribute float aIntensity;
attribute float aAngle;

varying vec3 vColor;
varying float vAlpha;

void main()
{
    vec3 worldNormal = normalize(mat3(modelMatrix) * aNormal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec3 viewDir = normalize(cameraPosition - worldPosition.xyz);

    // 简单打光：顶光 + 左后方轮廓光 + 菲涅尔边缘光
    float diffuse = max(dot(worldNormal, uLightDir), 0.0);
    float spec = pow(max(dot(worldNormal, normalize(uLightDir + viewDir)), 0.0), 48.0);
    float spec2 = pow(max(dot(worldNormal, normalize(uLight2Dir + viewDir)), 0.0), 24.0);
    float facing = dot(worldNormal, viewDir);
    float fresnel = pow(1.0 - clamp(facing, 0.0, 1.0), 3.0);
    float skyFactor = 0.3 + 0.7 * clamp(worldNormal.y * 0.5 + 0.5, 0.0, 1.0);

    float intensity = aBase * (0.3 + 0.7 * diffuse) + spec * 0.9 + spec2 * 0.5 + fresnel * 0.28 * skyFactor;
    intensity = clamp(intensity, 0.0, 1.5);

    // 粒子沿法线微微抬起，避免和遮挡网格打架
    vec3 lifted = worldPosition.xyz + worldNormal * 0.03;
    vec4 viewPosition = viewMatrix * vec4(lifted, 1.0);

    // 屏幕空间位移：鼠标划过的位置粒子往镜头方向飞散
    vec4 clipPosition = projectionMatrix * viewPosition;
    vec2 screenUv = clipPosition.xy / clipPosition.w * 0.5 + 0.5;
    float displacementIntensity = texture2D(uDisplacementTexture, screenUv).r;
    displacementIntensity = smoothstep(0.1, 0.3, displacementIntensity);

    vec3 displacement = normalize(vec3(cos(aAngle) * 0.2, sin(aAngle) * 0.2, 1.0));
    displacement *= displacementIntensity * uDisplacementStrength * aIntensity;
    viewPosition.xyz += displacement;

    gl_Position = projectionMatrix * viewPosition;

    gl_PointSize = uBasePointSize * (0.2 + 0.8 * min(intensity, 1.0)) * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);
    gl_PointSize = max(1.0, gl_PointSize);

    vColor = vec3(pow(intensity, 1.4) * uBrightness);

    // 背对镜头的面淡出
    vAlpha = smoothstep(-0.05, 0.25, facing);
}
`;

const fragmentShader = `
varying vec3 vColor;
varying float vAlpha;

void main()
{
    vec2 uv = gl_PointCoord;
    float distanceToCenter = length(uv - vec2(0.5));
    float alpha = smoothstep(0.5, 0.1, distanceToCenter) * vAlpha;
    if (alpha < 0.01) discard;

    vec3 color = pow(vColor, vec3(1.0 / 2.2));
    gl_FragColor = vec4(color, alpha);
}
`;

// 解析 porsche-911.bin（格式见 scripts/porsche-911/README.md）
function parseModel(buffer, pointLimit) {
  const view = new DataView(buffer);
  const magic = String.fromCharCode(
    view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)
  );
  if (magic !== "JKCR") throw new Error("Invalid car model file");

  const pointCount = view.getUint32(8, true);
  const occVertCount = view.getUint32(12, true);
  const occTriCount = view.getUint32(16, true);
  const lo = [0, 1, 2].map((i) => view.getFloat32(20 + i * 4, true));
  const hi = [0, 1, 2].map((i) => view.getFloat32(32 + i * 4, true));

  let offset = 44;
  const take = (ArrayType, length) => {
    const array = new ArrayType(buffer, offset, length);
    const bytes = array.byteLength;
    offset += bytes + ((4 - (bytes % 4)) % 4);
    return array;
  };

  const qPositions = take(Int16Array, pointCount * 3);
  const qNormals = take(Int8Array, pointCount * 3);
  const qBase = take(Uint8Array, pointCount);
  const qOccPositions = take(Int16Array, occVertCount * 3);
  const occIndices = take(Uint16Array, occTriCount * 3);

  const dequantize = (q) => {
    const out = new Float32Array(q.length);
    for (let i = 0; i < q.length; i++) {
      const axis = i % 3;
      out[i] = lo[axis] + ((q[i] + 32768) / 65535) * (hi[axis] - lo[axis]);
    }
    return out;
  };

  const count = Math.min(pointCount, pointLimit);
  return {
    count,
    positions: dequantize(qPositions.subarray(0, count * 3)),
    normals: qNormals.slice(0, count * 3),
    base: qBase.slice(0, count),
    occPositions: dequantize(qOccPositions),
    occIndices: new Uint16Array(occIndices),
  };
}

async function getThree() {
  if (typeof window !== "undefined" && window.THREE) return window.THREE;
  return import("three");
}

const Car = memo(function Car() {
  const canvasRef = useRef(null);
  const { guiParams } = useControlPanel();
  const guiParamsRef = useRef(guiParams);

  useEffect(() => {
    guiParamsRef.current = guiParams;
  }, [guiParams]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      let THREE, model;
      try {
        const isMobile = window.innerWidth <= 768;
        const [threeModule, buffer] = await Promise.all([
          getThree(),
          fetch(MODEL_URL).then((res) => {
            if (!res.ok) throw new Error(`Failed to load ${MODEL_URL}`);
            return res.arrayBuffer();
          }),
        ]);
        THREE = threeModule;
        model = parseModel(buffer, isMobile ? MOBILE_POINT_LIMIT : Infinity);
      } catch {
        return; // 加载失败时保持黑色画布
      }
      if (disposed) return;
      cleanup = initScene(THREE, canvas, model, guiParamsRef);
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div className="relative w-full max-w-[600px] aspect-[2/1]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full bg-black rounded-lg cursor-grab active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
        aria-label="3D Porsche 911 — drag to rotate"
      />
      <a
        href="https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf"
        target="_blank"
        rel="noopener noreferrer"
        title='3D model: "(FREE) Porsche 911 Carrera 4S" by Lionsharp Studios, licensed under CC BY-SA 4.0. Modified: restyled and converted to particles.'
        className="absolute bottom-1.5 right-2 text-[9px] leading-none text-white/25 hover:text-white/60 transition-colors"
      >
        Model © Lionsharp Studios · CC BY-SA
      </a>
    </div>
  );
});

function initScene(THREE, canvas, model, guiParamsRef) {
  const scene = new THREE.Scene();

  const getSizes = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.width / 2,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    };
  };
  let sizes = getSizes();

  const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);
  scene.add(camera);
  const placeCamera = (cameraZ) => {
    camera.position.set(0, cameraZ * CAMERA_HEIGHT_RATIO, cameraZ);
    camera.lookAt(0, CAMERA_TARGET_Y, 0);
  };
  placeCamera(guiParamsRef.current.cameraZ);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: false,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(sizes.width, sizes.height, false);
  renderer.setPixelRatio(sizes.pixelRatio);

  // ---- 屏幕空间位移贴图（鼠标拖尾） ----
  const displacement = {};
  displacement.canvas = document.createElement("canvas");
  displacement.canvas.width = 1024;
  displacement.canvas.height = 512;
  displacement.context = displacement.canvas.getContext("2d");
  displacement.context.fillStyle = "black";
  displacement.context.fillRect(0, 0, 1024, 512);
  displacement.glowImage = new Image();
  displacement.glowImage.src = "/static/glow.png";
  displacement.texture = new THREE.CanvasTexture(displacement.canvas);
  displacement.cursor = new THREE.Vector2(9999, 9999);
  displacement.cursorPrevious = new THREE.Vector2(9999, 9999);

  // ---- 车 ----
  const car = new THREE.Group();
  car.scale.setScalar(MODEL_SCALE);
  car.rotation.y = START_YAW;
  scene.add(car);

  // 遮挡网格：只写深度，不画颜色
  const occluderGeometry = new THREE.BufferGeometry();
  occluderGeometry.setAttribute("position", new THREE.BufferAttribute(model.occPositions, 3));
  occluderGeometry.setIndex(new THREE.BufferAttribute(model.occIndices, 1));
  const occluderMaterial = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
  const occluder = new THREE.Mesh(occluderGeometry, occluderMaterial);
  occluder.renderOrder = 0;
  car.add(occluder);

  // 粒子
  const intensities = new Float32Array(model.count);
  const angles = new Float32Array(model.count);
  for (let i = 0; i < model.count; i++) {
    intensities[i] = Math.random();
    angles[i] = Math.random() * Math.PI * 2;
  }
  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(model.positions, 3));
  particlesGeometry.setAttribute("aNormal", new THREE.BufferAttribute(model.normals, 3, true));
  particlesGeometry.setAttribute("aBase", new THREE.BufferAttribute(model.base, 1, true));
  particlesGeometry.setAttribute("aIntensity", new THREE.BufferAttribute(intensities, 1));
  particlesGeometry.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));

  const params = guiParamsRef.current;
  const particlesMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uResolution: new THREE.Uniform(
        new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)
      ),
      uDisplacementTexture: new THREE.Uniform(displacement.texture),
      uBasePointSize: new THREE.Uniform(params.basePointSize),
      uBrightness: new THREE.Uniform(params.brightness),
      uDisplacementStrength: new THREE.Uniform(params.displacementStrength),
      uLightDir: new THREE.Uniform(new THREE.Vector3(0.25, 1.0, 0.35).normalize()),
      uLight2Dir: new THREE.Uniform(new THREE.Vector3(-0.8, 0.35, -0.5).normalize()),
    },
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    transparent: true,
  });
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  particles.frustumCulled = false;
  particles.renderOrder = 1;
  car.add(particles);

  // ---- 交互：横向拖拽旋转 + 惯性 + 自动旋转 ----
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let dragging = false;
  let lastX = 0;
  let velocity = 0; // rad per frame
  let lastInteraction = -Infinity;

  const updateCursor = (event) => {
    const rect = canvas.getBoundingClientRect();
    const u = (event.clientX - rect.left) / rect.width;
    const v = (event.clientY - rect.top) / rect.height;
    displacement.cursor.set(u * displacement.canvas.width, v * displacement.canvas.height);
  };

  let pendingMove = null;
  let moveRaf = null;
  const handlePointerMove = (event) => {
    if (dragging) {
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      car.rotation.y += dx * DRAG_SPEED;
      velocity = dx * DRAG_SPEED;
      lastInteraction = performance.now();
    }
    pendingMove = event;
    if (moveRaf) return;
    moveRaf = requestAnimationFrame(() => {
      if (pendingMove) updateCursor(pendingMove);
      moveRaf = null;
    });
  };
  const handlePointerDown = (event) => {
    dragging = true;
    lastX = event.clientX;
    velocity = 0;
    lastInteraction = performance.now();
    canvas.setPointerCapture?.(event.pointerId);
  };
  const handlePointerUp = (event) => {
    if (!dragging) return;
    dragging = false;
    lastInteraction = performance.now();
    canvas.releasePointerCapture?.(event.pointerId);
  };

  window.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);

  // ---- 渲染循环（不在视口内时暂停） ----
  const clock = new THREE.Clock();
  let rafId = null;
  let visible = true;

  const tick = () => {
    rafId = null;
    if (!visible) return;
    const delta = Math.min(clock.getDelta(), 0.1);
    const current = guiParamsRef.current;

    particlesMaterial.uniforms.uBasePointSize.value = current.basePointSize;
    particlesMaterial.uniforms.uBrightness.value = current.brightness;
    particlesMaterial.uniforms.uDisplacementStrength.value = current.displacementStrength;
    if (camera.position.z !== current.cameraZ) placeCamera(current.cameraZ);

    if (!dragging) {
      if (Math.abs(velocity) > 0.00005) {
        car.rotation.y += velocity;
        velocity *= 0.93;
      } else if (!reduceMotion) {
        const idle = performance.now() - lastInteraction;
        const ramp = Math.min(Math.max((idle - AUTO_ROTATE_DELAY) / 1000, 0), 1);
        car.rotation.y += AUTO_ROTATE_SPEED * delta * ramp;
      }
    }

    // 位移贴图：先整体变暗（拖尾衰减），再在光标处画光斑
    const ctx = displacement.context;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = current.decayRate;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height);

    const cursorDistance = displacement.cursorPrevious.distanceTo(displacement.cursor);
    displacement.cursorPrevious.copy(displacement.cursor);
    const alpha = Math.min(cursorDistance * current.glowAlpha, 1);
    const glowSize = displacement.canvas.width * current.glowSize;
    if (displacement.glowImage.complete) {
      ctx.globalCompositeOperation = "lighten";
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        displacement.glowImage,
        displacement.cursor.x - glowSize * 0.5,
        displacement.cursor.y - glowSize * 0.5,
        glowSize,
        glowSize
      );
    }
    displacement.texture.needsUpdate = true;

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (rafId === null) {
      clock.getDelta();
      rafId = requestAnimationFrame(tick);
    }
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
  });
  observer.observe(canvas);
  start();

  // ---- 尺寸变化 ----
  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      sizes = getSizes();
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(sizes.pixelRatio);
      renderer.setSize(sizes.width, sizes.height, false);
      particlesMaterial.uniforms.uResolution.value.set(
        sizes.width * sizes.pixelRatio,
        sizes.height * sizes.pixelRatio
      );
    }, 100);
  };
  window.addEventListener("resize", handleResize);

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (moveRaf) cancelAnimationFrame(moveRaf);
    clearTimeout(resizeTimeout);
    observer.disconnect();
    window.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerdown", handlePointerDown);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
    window.removeEventListener("resize", handleResize);
    particlesGeometry.dispose();
    particlesMaterial.dispose();
    occluderGeometry.dispose();
    occluderMaterial.dispose();
    displacement.texture.dispose();
    renderer.dispose();
  };
}

export default Car;
