/**
 * 首页头像上方的 3D 保时捷 911（写实渲染）
 *
 * 移植自 pmndrs 的 "Building Live Env Maps" 示例（Paul Henschel / 0xca0a，codesandbox.io/s/lwo219）：
 *   - 实时环境贴图：一排灯带不停从车顶扫过 + 两侧灯条 + 漂浮的红色点缀光，车漆/车窗反射一直在流动
 *   - 带阴影的顶部聚光灯 + 环境光，车身自阴影
 *   - 原示例的 clearcoat 外壳（coat）、内饰、轮胎法线贴图等都保留，这是写实感的主要来源
 *
 * 在原示例基础上的修改：黑色车漆、白色轮毂、JKERORO 车牌；
 * 车自己缓慢左右转动，鼠标只有在画布里按住才能拖动（有角度限制），不跟随全页鼠标。
 *
 * 模型："(FREE) Porsche 911 Carrera 4S"（Sketchfab），CC BY-SA 4.0，见 scripts/porsche-911/README.md
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { HorizontalBlurShader } from "three/addons/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "three/addons/shaders/VerticalBlurShader.js";

const MODEL_URL = "/static/porsche-911.glb";
const PLATE_URL = "/static/porsche-plate.png";
const PLATE_NORMAL_URL = "/static/porsche-plate-normal.png";
const DRACO_PATH = "/draco/";

// 构图（原示例：car scale 1.6, position [-0.5, -0.18, 0], rotation π/5）
const CAR_SCALE = 1.6;
const CAR_POSITION = new THREE.Vector3(-0.5, -0.18, 0);
const CAR_BASE_YAW = Math.PI / 5;
const GROUND_Y = -1.16;
const CAMERA_FOV = 30;
const CAMERA_DISTANCE = 9.2; // 原示例 12，画布是 2:1 的小卡片，所以拉近一些
const CAMERA_TARGET = new THREE.Vector3(-0.35, -0.12, 0);

// 动作
const AUTO_YAW_AMPLITUDE = 0.32; // 自己左右转动的幅度（rad）
const AUTO_YAW_SPEED = 0.22; // 相位速度，约 28 秒一个来回
const DRAG_SPEED = 0.006; // rad / px
const DRAG_LIMIT = 0.6; // 拖拽最多偏离 ±0.6 rad（约 35°）
const DRAG_RETURN_DELAY = 1.8; // 松手后多久开始回到自动转动（秒）

function tuneMaterials(root, plateMap, plateNormal) {
  const rimMaterials = new Map();

  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;

    // 轮毂：两组轮子的第一个 primitive 是 silver，单独复制一份改成白色，车身其它 silver 饰条不受影响
    if (/^Cylinder\.?00[01]_0$/.test(node.name) && node.material?.name === "silver") {
      if (!rimMaterials.has(node.material)) {
        const rim = node.material.clone();
        rim.name = "rim_white";
        rim.color.set("#f2f2f2");
        rim.metalness = 0.35;
        rim.roughness = 0.22;
        rimMaterials.set(node.material, rim);
      }
      node.material = rimMaterials.get(node.material);
    }
  });

  const materials = new Map();
  root.traverse((node) => {
    if (node.isMesh) materials.set(node.material.name, node.material);
  });
  const set = (name, props) => {
    const m = materials.get(name);
    if (!m) return;
    for (const [key, value] of Object.entries(props)) {
      if (key === "color") m.color.set(value);
      else if (key === "normalScale") m.normalScale.set(value, value);
      else m[key] = value;
    }
    m.needsUpdate = true;
  };

  // 以下数值与原示例一致，只把车漆（paint）和外层清漆（coat）的颜色调成黑色
  set("rubber", { color: "#222", roughness: 0.6, roughnessMap: null, normalScale: 4 });
  set("window", { color: "black", roughness: 0, clearcoat: 0.1 });
  set("coat", { envMapIntensity: 4, roughness: 0.5, metalness: 1, color: "#121212" });
  set("paint", { envMapIntensity: 2, roughness: 0.45, metalness: 0.8, color: "#0c0c0c" });

  // 车牌：换成 JKERORO（贴图和原贴图同样的 UV 布局 / 上下翻转方式）
  const license = materials.get("license");
  if (license) {
    license.map = plateMap;
    license.normalMap = plateNormal;
    license.needsUpdate = true;
  }
}

/** 只存在于环境贴图里的"灯"（对应原示例的 <Lightformers />） */
function createLightformers() {
  const envScene = new THREE.Scene();
  const geometries = {
    rect: new THREE.PlaneGeometry(1, 1),
    circle: new THREE.CircleGeometry(0.5, 64),
    ring: new THREE.RingGeometry(0.25, 0.5, 64),
  };

  const lightformer = ({ form = "rect", color = "white", intensity = 1, position, rotation = [0, 0, 0], scale = 1 }) => {
    const mesh = new THREE.Mesh(
      geometries[form],
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity),
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    );
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    if (Array.isArray(scale)) mesh.scale.set(...scale);
    else mesh.scale.setScalar(scale);
    return mesh;
  };

  // 顶棚
  envScene.add(lightformer({ intensity: 0.75, rotation: [Math.PI / 2, 0, 0], position: [0, 5, -9], scale: [10, 10, 1] }));

  // 移动的灯带
  const stripsHolder = new THREE.Group();
  stripsHolder.rotation.y = 0.5;
  const strips = new THREE.Group();
  [2, 0, 2, 0, 2, 0, 2, 0].forEach((x, i) => {
    strips.add(lightformer({ form: "circle", intensity: 2, rotation: [Math.PI / 2, 0, 0], position: [x, 4, i * 4], scale: [3, 1, 1] }));
  });
  stripsHolder.add(strips);
  envScene.add(stripsHolder);

  // 两侧
  envScene.add(lightformer({ intensity: 4, rotation: [0, Math.PI / 2, 0], position: [-5, 1, -1], scale: [20, 0.1, 1] }));
  envScene.add(lightformer({ rotation: [0, Math.PI / 2, 0], position: [-5, -1, -1], scale: [20, 0.5, 1] }));
  envScene.add(lightformer({ rotation: [0, -Math.PI / 2, 0], position: [10, 1, 0], scale: [20, 1, 1] }));

  // 红色点缀光（对应 <Float speed={5} floatIntensity={2} rotationIntensity={2}>）
  const floatGroup = new THREE.Group();
  const red = lightformer({ form: "ring", color: "red", intensity: 1, scale: 10, position: [-15, 4, -18] });
  red.lookAt(0, 0, 0);
  floatGroup.add(red);
  envScene.add(floatGroup);

  // 背景球：#444 底色 + 从 (100,100,100) 方向的蓝→黑深度渐变（对应 lamina 的 LayerMaterial）
  const background = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uBase: { value: new THREE.Color("#444") },
        uColorA: { value: new THREE.Color("blue") },
        uColorB: { value: new THREE.Color("black") },
        uOrigin: { value: new THREE.Vector3(100, 100, 100) },
        uFar: { value: 300 },
      },
      vertexShader: `
        varying vec3 vWorld;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorld = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: `
        uniform vec3 uBase; uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uOrigin; uniform float uFar;
        varying vec3 vWorld;
        void main() {
          float d = clamp(distance(vWorld, uOrigin) / uFar, 0.0, 1.0);
          vec3 depth = mix(uColorA, uColorB, d);
          gl_FragColor = vec4(mix(uBase, depth, 0.5), 1.0);
        }
      `,
    })
  );
  background.scale.setScalar(100);
  envScene.add(background);

  const update = (delta, elapsed) => {
    strips.position.z += delta * 10;
    if (strips.position.z > 20) strips.position.z = -60;

    // drei <Float> 的同款公式
    const t = elapsed * 5;
    floatGroup.rotation.x = (Math.cos(t / 4) / 8) * 2;
    floatGroup.rotation.y = (Math.sin(t / 4) / 8) * 2;
    floatGroup.rotation.z = (Math.sin(t / 4) / 20) * 2;
    floatGroup.position.y = (Math.sin(t / 4) / 10) * 2;
  };

  const dispose = () => {
    Object.values(geometries).forEach((g) => g.dispose());
    background.geometry.dispose();
    envScene.traverse((o) => {
      if (o.isMesh) o.material.dispose();
    });
  };

  return { envScene, update, dispose };
}

/** 软地面阴影：从下往上渲染一次深度，模糊后贴在地面（挂在车的转动节点上，跟着车一起转） */
function createGroundShadow(renderer, target, { size, far, darkness = 1.6, blur = 3.5, opacity = 0.9 }) {
  const group = new THREE.Group();
  const renderTarget = new THREE.WebGLRenderTarget(512, 512);
  renderTarget.texture.generateMipmaps = false;
  const renderTargetBlur = new THREE.WebGLRenderTarget(512, 512);
  renderTargetBlur.texture.generateMipmaps = false;

  const planeGeometry = new THREE.PlaneGeometry(size, size).rotateX(Math.PI / 2);
  const plane = new THREE.Mesh(
    planeGeometry,
    new THREE.MeshBasicMaterial({ map: renderTarget.texture, opacity, transparent: true, depthWrite: false })
  );
  plane.renderOrder = 1;
  plane.scale.y = -1;
  group.add(plane);

  const blurPlane = new THREE.Mesh(planeGeometry);
  blurPlane.visible = false;
  group.add(blurPlane);

  const shadowCamera = new THREE.OrthographicCamera(-size / 2, size / 2, size / 2, -size / 2, 0, far);
  shadowCamera.rotation.x = Math.PI / 2;
  group.add(shadowCamera);

  const depthMaterial = new THREE.MeshDepthMaterial();
  depthMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.darkness = { value: darkness };
    shader.fragmentShader = `uniform float darkness;\n${shader.fragmentShader.replace(
      "gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );",
      "gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );"
    )}`;
  };
  depthMaterial.depthTest = false;
  depthMaterial.depthWrite = false;

  const hBlur = new THREE.ShaderMaterial(HorizontalBlurShader);
  hBlur.depthTest = false;
  const vBlur = new THREE.ShaderMaterial(VerticalBlurShader);
  vBlur.depthTest = false;

  const blurPass = (amount) => {
    blurPlane.visible = true;
    blurPlane.material = hBlur;
    hBlur.uniforms.tDiffuse.value = renderTarget.texture;
    hBlur.uniforms.h.value = amount / 256;
    renderer.setRenderTarget(renderTargetBlur);
    renderer.render(blurPlane, shadowCamera);

    blurPlane.material = vBlur;
    vBlur.uniforms.tDiffuse.value = renderTargetBlur.texture;
    vBlur.uniforms.v.value = amount / 256;
    renderer.setRenderTarget(renderTarget);
    renderer.render(blurPlane, shadowCamera);
    blurPlane.visible = false;
  };

  // 在车的本地坐标系里烘焙一次（target 是车模型，group 的位置也是相对车的转动节点）
  const bake = () => {
    const tempScene = new THREE.Scene();
    const parent = target.parent;
    const groupParent = group.parent;
    tempScene.add(target);
    tempScene.add(group);
    tempScene.overrideMaterial = depthMaterial;
    tempScene.updateMatrixWorld(true);

    const clearAlpha = renderer.getClearAlpha();
    renderer.setClearAlpha(0);
    renderer.setRenderTarget(renderTarget);
    renderer.clear();
    renderer.render(tempScene, shadowCamera);
    blurPass(blur);
    blurPass(blur * 0.4);
    renderer.setRenderTarget(null);
    renderer.setClearAlpha(clearAlpha);

    if (parent) parent.add(target);
    if (groupParent) groupParent.add(group);
  };

  const dispose = () => {
    renderTarget.dispose();
    renderTargetBlur.dispose();
    planeGeometry.dispose();
    plane.material.dispose();
    depthMaterial.dispose();
    hBlur.dispose();
    vBlur.dispose();
  };

  return { group, bake, dispose };
}

function loadTexture(loader, url, { srgb }) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        texture.flipY = false; // 与 glTF 贴图一致
        if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ onReady?: () => void, onError?: (e: unknown) => void }} options
 * @returns {() => void} cleanup
 */
export function createCarScene(canvas, { onReady, onError } = {}) {
  let disposed = false;
  const container = canvas.parentElement;

  const getSizes = () => {
    const rect = container.getBoundingClientRect();
    return { width: rect.width, height: rect.height, pixelRatio: Math.min(window.devicePixelRatio, 2) };
  };
  let sizes = getSizes();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(sizes.pixelRatio);
  renderer.setSize(sizes.width, sizes.height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, sizes.width / sizes.height, 0.1, 300);

  // ---- 灯光（与原示例一致） ----
  const spot = new THREE.SpotLight(0xffffff, 2 * Math.PI, 0, 0.3, 1, 0);
  spot.position.set(0, 15, 0);
  spot.castShadow = true;
  spot.shadow.bias = -0.0001;
  spot.shadow.mapSize.set(1024, 1024);
  scene.add(spot, spot.target);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5 * Math.PI));

  // ---- 实时环境贴图（同时作为模糊背景） ----
  const lightformers = createLightformers();
  const cubeTarget = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cubeCamera = new THREE.CubeCamera(1, 1000, cubeTarget);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envTarget = null;
  const refreshEnvironment = () => {
    cubeCamera.update(renderer, lightformers.envScene);
    envTarget = pmrem.fromCubemap(cubeTarget.texture, envTarget);
    scene.environment = envTarget.texture;
    scene.background = envTarget.texture;
  };
  scene.backgroundBlurriness = 1;
  refreshEnvironment();

  // ---- 车 ----
  const pivot = new THREE.Group(); // 负责转动（自动 + 拖拽）
  pivot.position.copy(CAR_POSITION);
  pivot.rotation.y = CAR_BASE_YAW;
  scene.add(pivot);

  const draco = new DRACOLoader().setDecoderPath(DRACO_PATH).setDecoderConfig({ type: "wasm" });
  const gltfLoader = new GLTFLoader().setDRACOLoader(draco);
  const textureLoader = new THREE.TextureLoader();
  let car = null;
  let groundShadow = null;
  const textures = [];

  Promise.all([
    gltfLoader.loadAsync(MODEL_URL),
    loadTexture(textureLoader, PLATE_URL, { srgb: true }),
    loadTexture(textureLoader, PLATE_NORMAL_URL, { srgb: false }),
  ])
    .then(([gltf, plateMap, plateNormal]) => {
      if (disposed) {
        plateMap.dispose();
        plateNormal.dispose();
        return;
      }
      textures.push(plateMap, plateNormal);
      car = gltf.scene;
      car.scale.setScalar(CAR_SCALE);
      tuneMaterials(car, plateMap, plateNormal);
      pivot.add(car);

      groundShadow = createGroundShadow(renderer, car, { size: 10, far: 1.4 });
      groundShadow.group.position.y = GROUND_Y - CAR_POSITION.y + 0.002;
      pivot.add(groundShadow.group);
      groundShadow.bake();

      onReady?.();
    })
    .catch((error) => onError?.(error));

  // ---- 交互：只在画布里按住拖拽，有角度限制 ----
  let dragging = false;
  let lastX = 0;
  let dragYaw = 0;
  let sinceRelease = Infinity;

  const handlePointerDown = (event) => {
    dragging = true;
    lastX = event.clientX;
    canvas.setPointerCapture?.(event.pointerId);
    canvas.style.cursor = "grabbing";
  };
  const handlePointerMove = (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    dragYaw = THREE.MathUtils.clamp(dragYaw + dx * DRAG_SPEED, -DRAG_LIMIT, DRAG_LIMIT);
  };
  const handlePointerUp = (event) => {
    if (!dragging) return;
    dragging = false;
    sinceRelease = 0;
    canvas.releasePointerCapture?.(event.pointerId);
    canvas.style.cursor = "grab";
  };
  canvas.style.cursor = "grab";
  canvas.style.touchAction = "pan-y"; // 手机上竖向滑动仍然滚动页面
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);

  // ---- 渲染循环（不在视口内时暂停） ----
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const clock = new THREE.Clock();
  let elapsed = 0; // 灯光 / 镜头动画时间
  let autoPhase = 0; // 自动转动相位（拖拽时暂停）
  let frame = 0;
  let rafId = null;
  let visible = true;
  const cameraGoal = new THREE.Vector3();
  const cameraPositionAt = (t, out) =>
    out.set(Math.sin(t / 5), 0, 12 + Math.cos(t / 5) / 2).multiplyScalar(CAMERA_DISTANCE / 12).add(new THREE.Vector3(0, 0.35, 0));
  cameraPositionAt(0, camera.position);
  camera.lookAt(CAMERA_TARGET);

  const tick = () => {
    rafId = null;
    if (!visible || disposed) return;
    const delta = Math.min(clock.getDelta(), 0.1);
    frame += 1;

    if (!reduceMotion) {
      elapsed += delta;
      lightformers.update(delta, elapsed);
      if (frame % 2 === 0) refreshEnvironment();
      if (!dragging) autoPhase += delta * AUTO_YAW_SPEED;
    }

    if (!dragging) {
      sinceRelease += delta;
      if (sinceRelease > DRAG_RETURN_DELAY) dragYaw *= Math.pow(0.35, delta); // 慢慢回到自动转动
    }
    pivot.rotation.y = CAR_BASE_YAW + Math.sin(autoPhase) * AUTO_YAW_AMPLITUDE + dragYaw;

    // 镜头缓慢漂移（原示例的 CameraRig），不跟随鼠标
    camera.position.lerp(cameraPositionAt(elapsed, cameraGoal), 0.05);
    camera.lookAt(CAMERA_TARGET);

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (rafId === null && !disposed) {
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
  const resizeObserver = new ResizeObserver(() => {
    sizes = getSizes();
    if (!sizes.width || !sizes.height) return;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(sizes.pixelRatio);
    renderer.setSize(sizes.width, sizes.height, false);
  });
  resizeObserver.observe(container);

  return () => {
    disposed = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    observer.disconnect();
    resizeObserver.disconnect();
    canvas.removeEventListener("pointerdown", handlePointerDown);
    canvas.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerup", handlePointerUp);
    canvas.removeEventListener("pointercancel", handlePointerUp);
    draco.dispose();
    groundShadow?.dispose();
    lightformers.dispose();
    cubeTarget.dispose();
    envTarget?.dispose();
    pmrem.dispose();
    textures.forEach((t) => t.dispose());
    car?.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      materials.forEach((m) => {
        Object.values(m).forEach((v) => v?.isTexture && v.dispose());
        m.dispose();
      });
    });
    renderer.dispose();
  };
}
