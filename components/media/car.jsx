"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import ModernControlPanel from '../interactive/ModernControlPanel';
import { useControlPanel } from '@/contexts/ControlPanelContext';

const vertexShader = `
uniform vec2 uResolution;
uniform sampler2D uPictureTexture;
uniform sampler2D uDisplacementTexture;
uniform float uBasePointSize;
uniform float uBrightness;
uniform float uDisplacementStrength;

attribute float aIntensity;
attribute float aAngle;

varying vec3 vColor;

void main()
{
    // Displacement
    vec3 newPosition = position;
    float displacementIntensity = texture2D(uDisplacementTexture, uv).r;
    displacementIntensity = smoothstep(0.1, 0.3, displacementIntensity);

    vec3 displacement = vec3(
        cos(aAngle) * 0.2,
        sin(aAngle) * 0.2,
        1.0
    );
    displacement = normalize(displacement);
    displacement *= displacementIntensity;
    displacement *= uDisplacementStrength;
    displacement *= aIntensity;

    newPosition += displacement;

    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Picture
    float pictureIntensity = texture2D(uPictureTexture, uv).r;

    // Point size (with control uniform)
    gl_PointSize = uBasePointSize * pictureIntensity * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);
    gl_PointSize = max(1.0, gl_PointSize); // Prevent tiny particles

    // Varyings with brightness control
    vColor = vec3(pow(pictureIntensity, 2.0) * uBrightness);
    pictureIntensity = max(pictureIntensity, 0.2);
}
`;

const fragmentShader = `
varying vec3 vColor;

void main()
{
    vec2 uv = gl_PointCoord;
    float distanceToCenter = length(uv - vec2(0.5));
    float alpha = smoothstep(0.5, 0.1, distanceToCenter); // Softer fade

    // 简单的颜色处理
    vec3 color = vColor;
    color = pow(color, vec3(1.0 / 2.2)); // 简单的 gamma 校正
    
    gl_FragColor = vec4(color, alpha);
}
`;

const Car = memo(function Car() {
  const canvasRef = useRef(null);
  const { guiParams } = useControlPanel();
  
  // 使用 useMemo 缓存 shaders，避免重复创建
  const shaders = useMemo(() => ({
    vertexShader,
    fragmentShader,
  }), []);

  const guiParamsRef = useRef(guiParams);

  // Update ref whenever guiParams changes
  useEffect(() => {
    guiParamsRef.current = guiParams;
  }, [guiParams]);

  // 使用全局 Three.js 实例
  const initThreeJS = useCallback(async () => {
    if (!shaders.vertexShader || !shaders.fragmentShader) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 等待全局 Three.js 可用
    const waitForThree = () => {
      return new Promise((resolve) => {
        const checkThree = () => {
          if (window.THREE) {
            resolve(window.THREE);
          } else {
            setTimeout(checkThree, 100);
          }
        };
        checkThree();
      });
    };

    try {
      const THREE = await waitForThree();
      
      // 使用全局 Three.js 实例，避免重复导入
      // OrbitControls 需要从全局 THREE 中获取
      const OrbitControls = THREE.OrbitControls || (await import('three/addons/controls/OrbitControls.js')).OrbitControls;
      
      initScene(THREE, OrbitControls, canvas);
    } catch (error) {
      console.error('Failed to load Three.js:', error);
    }
  }, [shaders]);

  const initScene = useCallback((THREE, OrbitControls, canvas) => {

    const scene = new THREE.Scene();

    const getSizes = () => {
      // 使用 requestAnimationFrame 来避免强制重排
      const rect = canvas.parentElement.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.width / 2,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
      };
    };

    let sizes = getSizes();

    const camera = new THREE.PerspectiveCamera(
      35,
      sizes.width / sizes.height,
      0.1,
      100
    );
    camera.position.set(0, 0, 18);
    scene.add(camera);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enableRotate = false;
    controls.enablePan = false;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(sizes.pixelRatio);
    renderer.setViewport(0, 0, sizes.width, sizes.height);

    // 保存three.js对象引用到canvas上，供参数更新使用
    canvas.__renderer = renderer;
    canvas.__scene = scene;
    canvas.__camera = camera;

    const displacement = {};
    displacement.canvas = document.createElement("canvas");
    displacement.canvas.style.display = "none";
    displacement.context = displacement.canvas.getContext("2d");
    displacement.glowImage = new Image();
    displacement.glowImage.src = "/static/glow.png";

    displacement.interactivePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: "red", side: THREE.DoubleSide })
    );
    displacement.interactivePlane.visible = false;
    scene.add(displacement.interactivePlane);

    displacement.raycaster = new THREE.Raycaster();
    displacement.screenCursor = new THREE.Vector2(9999, 9999);
    displacement.canvasCursor = new THREE.Vector2(9999, 9999);
    displacement.canvasCursorPrevious = new THREE.Vector2(9999, 9999);

    // 使用 requestAnimationFrame 来批处理鼠标移动更新
    let rafId;
    const handlePointerMove = (event) => {
      if (rafId) return; // 如果已经有待处理的更新，跳过
      
      rafId = requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect();
        displacement.screenCursor.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        displacement.screenCursor.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        rafId = null;
      });
    };
    window.addEventListener("pointermove", handlePointerMove);

    displacement.texture = new THREE.CanvasTexture(displacement.canvas);

    let particles, particlesMaterial;

    // Initialize camera position
    camera.position.z = guiParamsRef.current.cameraZ;

    function createParticles(aspectRatio, imageTexture) {
      const baseResolution = 512;
      displacement.canvas.width = baseResolution * aspectRatio;
      displacement.canvas.height = baseResolution;
      displacement.context.fillStyle = "black";
      displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height);
      displacement.texture.needsUpdate = true;

      const planeWidth = 30;
      const planeHeight = planeWidth / aspectRatio;

      displacement.interactivePlane.scale.set(planeWidth, planeHeight, 1);
      displacement.interactivePlane.position.z = 0;

      const isMobile = window.innerWidth <= 768;
      const subdivisions = isMobile ? 256 : 512;

      const particlesGeometry = new THREE.PlaneGeometry(
        planeWidth,
        planeHeight,
        subdivisions,
        subdivisions
      );
      particlesGeometry.setIndex(null);
      particlesGeometry.deleteAttribute("normal");

      const intensitiesArray = new Float32Array(particlesGeometry.attributes.position.count);
      const anglesArray = new Float32Array(particlesGeometry.attributes.position.count);

      for (let i = 0; i < particlesGeometry.attributes.position.count; i++) {
        intensitiesArray[i] = Math.random();
        anglesArray[i] = Math.random() * Math.PI * 2;
      }

      particlesGeometry.setAttribute("aIntensity", new THREE.BufferAttribute(intensitiesArray, 1));
      particlesGeometry.setAttribute("aAngle", new THREE.BufferAttribute(anglesArray, 1));

      particlesMaterial = new THREE.ShaderMaterial({
        vertexShader: shaders.vertexShader,
        fragmentShader: shaders.fragmentShader,
        uniforms: {
          uResolution: new THREE.Uniform(
            new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)
          ),
          uPictureTexture: new THREE.Uniform(imageTexture),
          uDisplacementTexture: new THREE.Uniform(displacement.texture),
          uBasePointSize: { value: guiParams.basePointSize },
          uBrightness: { value: guiParams.brightness },
          uDisplacementStrength: { value: guiParams.displacementStrength },
        },
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
      });

      particles = new THREE.Points(particlesGeometry, particlesMaterial);
      particles.position.z = 0;
      scene.add(particles);
    }

    const image = new Image();
    image.src = "/static/car.png";
    image.onload = () => {
      const aspectRatio = image.width / image.height;
      const imageTexture = new THREE.Texture(image);
      imageTexture.needsUpdate = true;
      createParticles(aspectRatio, imageTexture);
    };

    const tick = () => {
      controls.update();

      // Get current parameters from ref
      const currentParams = guiParamsRef.current;

      // Update parameters in real-time
      if (particlesMaterial) {
        particlesMaterial.uniforms.uBasePointSize.value = currentParams.basePointSize;
        particlesMaterial.uniforms.uBrightness.value = currentParams.brightness;
        particlesMaterial.uniforms.uDisplacementStrength.value = currentParams.displacementStrength;
      }
      camera.position.z = currentParams.cameraZ;

      displacement.raycaster.setFromCamera(displacement.screenCursor, camera);
      const intersections = displacement.raycaster.intersectObject(displacement.interactivePlane);

      if (intersections.length) {
        const uv = intersections[0].uv;
        displacement.canvasCursor.x = uv.x * displacement.canvas.width;
        displacement.canvasCursor.y = (1 - uv.y) * displacement.canvas.height;
      }

      displacement.context.globalCompositeOperation = "source-over";
      displacement.context.globalAlpha = currentParams.decayRate;
      displacement.context.fillStyle = "black";
      displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height);

      const cursorDistance = displacement.canvasCursorPrevious.distanceTo(displacement.canvasCursor);
      displacement.canvasCursorPrevious.copy(displacement.canvasCursor);
      const alpha = Math.min(cursorDistance * currentParams.glowAlpha, 1);

      const glowSize = displacement.canvas.width * currentParams.glowSize;
      displacement.context.globalCompositeOperation = "lighten";
      displacement.context.globalAlpha = alpha;
      displacement.context.drawImage(
        displacement.glowImage,
        displacement.canvasCursor.x - glowSize * 0.5,
        displacement.canvasCursor.y - glowSize * 0.5,
        glowSize,
        glowSize
      );

      displacement.texture.needsUpdate = true;

      renderer.render(scene, camera);
      window.requestAnimationFrame(tick);
    };

    tick();

    // 防抖函数来避免频繁的重新计算
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        sizes = getSizes();

        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();

        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(sizes.pixelRatio);

        if (particlesMaterial) {
          particlesMaterial.uniforms.uResolution.value.set(
            sizes.width * sizes.pixelRatio,
            sizes.height * sizes.pixelRatio
          );
        }

        // Recreate particles on significant resize to avoid artifacts
        if (particles) {
          const isMobile = window.innerWidth <= 768;
          const newSubdivisions = isMobile ? 256 : 128;
          const aspectRatio = image.width / image.height;
          scene.remove(particles);
          particles.geometry.dispose();
          particles.material.dispose();
          createParticles(aspectRatio, particlesMaterial.uniforms.uPictureTexture.value);
        }
      }, 16); // 约60fps的更新频率
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (particles) {
        particles.geometry.dispose();
        particles.material.dispose();
      }
      renderer.dispose();
    };
  }, []);

  // 启动 Three.js 初始化的 useEffect
  useEffect(() => {
    initThreeJS();
  }, [initThreeJS]);

  // 单独处理参数更新，只更新材质uniforms，不重新创建场景
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // 获取canvas上的three.js对象
    const canvas = canvasRef.current;
    const renderer = canvas.__renderer;
    const scene = canvas.__scene;
    const camera = canvas.__camera;
    
    if (!renderer || !scene || !camera) return;
    
    // 更新相机位置
    camera.position.z = guiParams.cameraZ;
    
    // 查找粒子材质并更新uniforms
    scene.traverse((child) => {
      if (child.isPoints && child.material && child.material.uniforms) {
        const uniforms = child.material.uniforms;
        
        // 更新所有相关的uniforms
        if (uniforms.uBasePointSize) uniforms.uBasePointSize.value = guiParams.basePointSize;
        if (uniforms.uBrightness) uniforms.uBrightness.value = guiParams.brightness;
        if (uniforms.uDisplacementStrength) uniforms.uDisplacementStrength.value = guiParams.displacementStrength;
        if (uniforms.uGlowSize) uniforms.uGlowSize.value = guiParams.glowSize;
        if (uniforms.uGlowAlpha) uniforms.uGlowAlpha.value = guiParams.glowAlpha;
        if (uniforms.uDecayRate) uniforms.uDecayRate.value = guiParams.decayRate;
      }
    });
  }, [guiParams]);

  return (
    <>
    <div className="relative w-full max-w-[600px] aspect-[2/1]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full bg-black rounded-lg" />
    </div>
    </>
  );
});

export default Car;