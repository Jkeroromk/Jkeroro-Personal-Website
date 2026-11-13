/**
 * 3D 保时捷 911（写实渲染）—— 首页卡片和全屏 Showroom 共用
 *
 * 移植自 pmndrs 的 "Building Live Env Maps" 示例（Paul Henschel / 0xca0a，codesandbox.io/s/lwo219）：
 *   - 实时环境贴图：一排灯带不停从车顶扫过 + 两侧灯条 + 漂浮的红色点缀光，车漆/车窗反射一直在流动
 *   - 带阴影的顶部聚光灯 + 环境光，车身自阴影
 *   - 原示例的 clearcoat 外壳（coat）、内饰、轮胎法线贴图等都保留，这是写实感的主要来源
 *
 * mode = "card"：首页卡片。车自己缓慢左右转动，只能在画布里按住拖拽（有角度限制）
 * mode = "showroom"：全屏展厅。OrbitControls 自由环绕、镜头预设、换车漆/轮毂、开车灯、白天/夜晚
 *
 * 模型："(FREE) Porsche 911 Carrera 4S"（Sketchfab），CC BY-SA 4.0，见 scripts/porsche-911/README.md
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
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

// 卡片模式
const CARD_CAMERA_DISTANCE = 9.2; // 原示例 12，卡片是 2:1 的小画布，所以拉近一些
const CARD_CAMERA_TARGET = new THREE.Vector3(-0.35, -0.12, 0);
const AUTO_YAW_AMPLITUDE = 0.32; // 自己左右转动的幅度（rad）
const AUTO_YAW_SPEED = 0.22; // 相位速度，约 28 秒一个来回
const DRAG_SPEED = 0.006; // rad / px
const DRAG_LIMIT = 0.6; // 拖拽最多偏离 ±0.6 rad（约 35°）
const DRAG_RETURN_DELAY = 1.8; // 松手后多久开始回到自动转动（秒）

export const PAINTS = {
  black: { label: "Jet Black", swatch: "#0b0b0c", paint: "#0c0c0c", coat: "#121212", metalness: 0.8, roughness: 0.45 },
  white: { label: "Carrara White", swatch: "#eceae4", paint: "#d9d7d0", coat: "#8f8e8a", metalness: 0.25, roughness: 0.4 },
  red: { label: "Guards Red", swatch: "#b3121b", paint: "#8f0a10", coat: "#3d0306", metalness: 0.45, roughness: 0.42 },
  silver: { label: "GT Silver", swatch: "#a9acaf", paint: "#7d8084", coat: "#4d4f52", metalness: 0.85, roughness: 0.4 },
  blue: { label: "Sapphire Blue", swatch: "#14306e", paint: "#0b2156", coat: "#061232", metalness: 0.8, roughness: 0.42 },
};

export const RIMS = {
  white: { label: "White", swatch: "#f2f2f2", color: "#f2f2f2", metalness: 0.35, roughness: 0.22 },
  black: { label: "Satin Black", swatch: "#1a1a1a", color: "#161616", metalness: 0.5, roughness: 0.38 },
  silver: { label: "Silver", swatch: "#c9ccd0", color: "#c8cbcf", metalness: 1, roughness: 0.18 },
};

export const VIEWS = ["overview", "specs", "wheels", "lights", "rear"];

// ---------------------------------------------------------------------------
// 资源：模型 + 车牌贴图只加载一次，卡片和 Showroom 共用（各自克隆材质）
// ---------------------------------------------------------------------------
let assetsPromise = null;
function loadCarAssets(onProgress) {
  if (assetsPromise) return assetsPromise;

  const draco = new DRACOLoader().setDecoderPath(DRACO_PATH).setDecoderConfig({ type: "wasm" });
  const gltfLoader = new GLTFLoader().setDRACOLoader(draco);
  const textureLoader = new THREE.TextureLoader();
  const loadTexture = (url, srgb) =>
    textureLoader.loadAsync(url).then((texture) => {
      texture.flipY = false; // 与 glTF 贴图一致（车牌贴图是上下翻转存储的）
      if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      return texture;
    });

  assetsPromise = Promise.all([
    gltfLoader.loadAsync(MODEL_URL, (event) => {
      if (event.total) onProgress?.(event.loaded / event.total);
    }),
    loadTexture(PLATE_URL, true),
    loadTexture(PLATE_NORMAL_URL, false),
  ])
    .then(([gltf, plateMap, plateNormal]) => {
      draco.dispose();
      return { gltf, plateMap, plateNormal };
    })
    .catch((error) => {
      assetsPromise = null; // 允许重试
      draco.dispose();
      throw error;
    });
  return assetsPromise;
}

/** 克隆模型并调材质（数值来自原示例，车漆改成黑色、轮毂改成白色、换 JKERORO 车牌） */
function buildCar({ gltf, plateMap, plateNormal }) {
  const car = gltf.scene.clone(true);
  const cloned = new Map();
  const materials = new Map();
  let rim = null;

  car.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;

    if (!cloned.has(node.material)) cloned.set(node.material, node.material.clone());
    node.material = cloned.get(node.material);

    // 轮毂：两组轮子的第一个 primitive 是 silver，单独复制一份，车身其它 silver 饰条不受影响
    if (/^Cylinder\.?00[01]_0$/.test(node.name) && node.material.name === "silver") {
      if (!rim) {
        rim = node.material.clone();
        rim.name = "rim";
      }
      node.material = rim;
    }
    materials.set(node.material.name, node.material);
  });

  const set = (name, props) => {
    const m = materials.get(name);
    if (!m) return;
    for (const [key, value] of Object.entries(props)) {
      if (key === "color" || key === "emissive") m[key].set(value);
      else if (key === "normalScale") m.normalScale.set(value, value);
      else m[key] = value;
    }
    m.needsUpdate = true;
  };

  set("rubber", { color: "#222", roughness: 0.6, roughnessMap: null, normalScale: 4 });
  set("window", { color: "black", roughness: 0, clearcoat: 0.1 });
  set("coat", { envMapIntensity: 4, roughness: 0.5, metalness: 1 });
  set("paint", { envMapIntensity: 2 });

  const license = materials.get("license");
  if (license) {
    license.map = plateMap;
    license.normalMap = plateNormal;
    license.needsUpdate = true;
  }

  return {
    car,
    setPaint(key) {
      const p = PAINTS[key] ?? PAINTS.black;
      set("paint", { color: p.paint, metalness: p.metalness, roughness: p.roughness });
      set("coat", { color: p.coat });
    },
    setRim(key) {
      const r = RIMS[key] ?? RIMS.white;
      set("rim", { color: r.color, metalness: r.metalness, roughness: r.roughness });
    },
    setLights(on) {
      set("lights", { emissive: on ? "#ffffff" : "#000000", emissiveIntensity: on ? 4 : 1, opacity: on ? 0.9 : 0.25 });
      set("tex_shiny", { emissiveIntensity: on ? 3 : 1 });
    },
    dispose() {
      // 几何体和贴图是共享缓存，不在这里释放；只释放克隆出来的材质
      new Set([...cloned.values(), rim].filter(Boolean)).forEach((m) => m.dispose());
    },
  };
}

// ---------------------------------------------------------------------------
// 实时环境贴图里的"灯"（对应原示例的 <Lightformers />）
// ---------------------------------------------------------------------------
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
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide, toneMapped: false })
    );
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    if (Array.isArray(scale)) mesh.scale.set(...scale);
    else mesh.scale.setScalar(scale);
    return mesh;
  };

  envScene.add(lightformer({ intensity: 0.75, rotation: [Math.PI / 2, 0, 0], position: [0, 5, -9], scale: [10, 10, 1] }));

  const stripsHolder = new THREE.Group();
  stripsHolder.rotation.y = 0.5;
  const strips = new THREE.Group();
  [2, 0, 2, 0, 2, 0, 2, 0].forEach((x, i) => {
    strips.add(lightformer({ form: "circle", intensity: 2, rotation: [Math.PI / 2, 0, 0], position: [x, 4, i * 4], scale: [3, 1, 1] }));
  });
  stripsHolder.add(strips);
  envScene.add(stripsHolder);

  envScene.add(lightformer({ intensity: 4, rotation: [0, Math.PI / 2, 0], position: [-5, 1, -1], scale: [20, 0.1, 1] }));
  envScene.add(lightformer({ rotation: [0, Math.PI / 2, 0], position: [-5, -1, -1], scale: [20, 0.5, 1] }));
  envScene.add(lightformer({ rotation: [0, -Math.PI / 2, 0], position: [10, 1, 0], scale: [20, 1, 1] }));

  const floatGroup = new THREE.Group();
  const red = lightformer({ form: "ring", color: "red", intensity: 1, scale: 10, position: [-15, 4, -18] });
  red.lookAt(0, 0, 0);
  floatGroup.add(red);
  envScene.add(floatGroup);

  // 背景球：底色 + 从 (100,100,100) 方向的深度渐变（对应 lamina 的 LayerMaterial）
  const backgroundUniforms = {
    uBase: { value: new THREE.Color("#444") },
    uColorA: { value: new THREE.Color("blue") },
    uColorB: { value: new THREE.Color("black") },
    uOrigin: { value: new THREE.Vector3(100, 100, 100) },
    uFar: { value: 300 },
  };
  const background = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: backgroundUniforms,
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
          gl_FragColor = vec4(mix(uBase, mix(uColorA, uColorB, d), 0.5), 1.0);
        }
      `,
    })
  );
  background.scale.setScalar(100);
  envScene.add(background);

  const update = (delta, elapsed) => {
    strips.position.z += delta * 10;
    if (strips.position.z > 20) strips.position.z = -60;
    const t = elapsed * 5; // drei <Float speed={5} floatIntensity={2} rotationIntensity={2}>
    floatGroup.rotation.set((Math.cos(t / 4) / 8) * 2, (Math.sin(t / 4) / 8) * 2, (Math.sin(t / 4) / 20) * 2);
    floatGroup.position.y = (Math.sin(t / 4) / 10) * 2;
  };

  const setDay = (day) => {
    backgroundUniforms.uBase.value.set(day ? "#dcdcdc" : "#444");
    backgroundUniforms.uColorA.value.set(day ? "#ffffff" : "blue");
    backgroundUniforms.uColorB.value.set(day ? "#9a9a9a" : "black");
  };

  const dispose = () => {
    Object.values(geometries).forEach((g) => g.dispose());
    background.geometry.dispose();
    envScene.traverse((o) => o.isMesh && o.material.dispose());
  };

  return { envScene, update, setDay, dispose };
}

// ---------------------------------------------------------------------------
// 软接触阴影：从下往上渲染一次深度，模糊后贴在地面
// ---------------------------------------------------------------------------
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

  // 在车的本地坐标系里烘焙一次（group 和车挂在同一个父节点上）
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

/** Showroom 地面：大圆盘，边缘淡出到背景里，接收聚光灯阴影 */
function createFloor() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "#fff");
  gradient.addColorStop(0.45, "#fff");
  gradient.addColorStop(1, "#000");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const alphaMap = new THREE.CanvasTexture(canvas);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(16, 96).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: "#1c1b22", roughness: 0.42, metalness: 0.25, transparent: true, alphaMap, depthWrite: false })
  );
  floor.receiveShadow = true;
  floor.position.y = GROUND_Y - 0.002;
  floor.renderOrder = 0;

  return {
    floor,
    setDay(day) {
      floor.material.color.set(day ? "#d6d6d6" : "#1c1b22");
      floor.material.roughness = day ? 0.6 : 0.42;
      floor.material.metalness = day ? 0.05 : 0.25;
    },
    dispose() {
      floor.geometry.dispose();
      floor.material.dispose();
      alphaMap.dispose();
    },
  };
}

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *   mode?: "card" | "showroom",
 *   onReady?: () => void,
 *   onProgress?: (p: number) => void,
 *   onError?: (e: unknown) => void,
 *   onUserInteract?: () => void,
 * }} options
 */
export function createCarScene(canvas, { mode = "card", onReady, onProgress, onError, onUserInteract } = {}) {
  const showroom = mode === "showroom";
  let disposed = false;
  let paused = false;
  let autoRotate = true;
  const container = canvas.parentElement;

  const getSizes = () => {
    const rect = container.getBoundingClientRect();
    return { width: rect.width, height: rect.height, pixelRatio: Math.min(window.devicePixelRatio, 2) };
  };
  let sizes = getSizes();

  // Showroom 用透明画布：背景色和水印标题由页面（CSS）负责，车压在水印上面
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: showroom, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(sizes.pixelRatio);
  renderer.setSize(sizes.width, sizes.height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, sizes.width / sizes.height, 0.05, 300);

  // ---- 灯光（与原示例一致） ----
  const spot = new THREE.SpotLight(0xffffff, 2 * Math.PI, 0, 0.3, 1, 0);
  spot.position.set(0, 15, 0);
  spot.castShadow = true;
  spot.shadow.bias = -0.0001;
  spot.shadow.mapSize.set(1024, 1024);
  scene.add(spot, spot.target);
  const ambient = new THREE.AmbientLight(0xffffff, 0.5 * Math.PI);
  scene.add(ambient);

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
    if (!showroom) scene.background = envTarget.texture;
  };
  scene.backgroundBlurriness = 1;
  refreshEnvironment();

  const floor = showroom ? createFloor() : null;
  if (floor) scene.add(floor.floor);

  // ---- 车 ----
  const pivot = new THREE.Group();
  pivot.position.copy(CAR_POSITION);
  pivot.rotation.y = CAR_BASE_YAW;
  scene.add(pivot);

  let carHandle = null;
  let groundShadow = null;
  let views = null; // showroom 镜头预设（加载后根据车的尺寸计算）
  let pendingView = "overview";
  const pending = { paint: "black", rim: "white", lights: false };

  // =========================================================================
  // Showroom 模式：OrbitControls + 镜头飞行
  // =========================================================================
  let controls = null;
  let flight = null;
  // Specs 分区：用 viewOffset 把车挪到画面一侧，给参数面板留位置（桌面往左，手机往上）
  let shift = 0;
  let shiftGoal = 0;
  const applyShift = () => {
    if (shift < 0.001) {
      camera.clearViewOffset();
      return;
    }
    const { width, height } = sizes;
    const narrow = width < 768;
    camera.setViewOffset(width, height, narrow ? 0 : width * 0.2 * shift, narrow ? height * 0.16 * shift : 0, width, height);
  };

  const computeViews = () => {
    const box = new THREE.Box3().setFromObject(carHandle.car);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const H = size.y;
    const L = Math.max(size.x, size.z);

    // 车头方向：前车牌（Plane.006）相对车中心的方向
    const frontPlate = carHandle.car.getObjectByName("Plane006") ?? carHandle.car.getObjectByName("Plane.006");
    const f = new THREE.Vector3(0, 0, 1);
    if (frontPlate) frontPlate.getWorldPosition(f).sub(c).setY(0).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const s = new THREE.Vector3().crossVectors(up, f).normalize(); // 车的一侧

    const comb = (...parts) => parts.reduce((acc, [dir, k]) => acc.addScaledVector(dir, k), new THREE.Vector3());
    const v = (pos, target) => ({ position: c.clone().add(pos), target: c.clone().add(target) });

    views = {
      overview: v(comb([f, 0.78 * L], [s, 1.18 * L], [up, 0.16 * L]), comb([f, 0.04 * L], [up, -0.1 * H])),
      specs: v(comb([f, 1.05 * L], [s, -1.25 * L], [up, 0.16 * L]), comb([up, -0.08 * H])),
      wheels: v(comb([f, 0.42 * L], [s, 0.62 * L], [up, -0.12 * H]), comb([f, 0.3 * L], [s, 0.18 * L], [up, -0.28 * H])),
      lights: v(comb([f, 1.05 * L], [s, 0.22 * L], [up, 0.02 * L]), comb([f, 0.35 * L], [up, -0.08 * H])),
      rear: v(comb([f, -0.95 * L], [s, 0.45 * L], [up, 0.1 * L]), comb([f, -0.25 * L], [up, -0.1 * H])),
    };
    return { L };
  };

  const jumpTo = (name) => {
    const view = views?.[name];
    if (!view || !controls) return;
    camera.position.copy(view.position);
    controls.target.copy(view.target);
    controls.update();
  };

  const flyTo = (name, duration = 1.4) => {
    pendingView = name;
    shiftGoal = name === "specs" ? 1 : 0;
    const view = views?.[name];
    if (!view || !controls) return;
    flight = {
      start: performance.now(),
      duration: duration * 1000,
      fromPos: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPos: view.position,
      toTarget: view.target,
    };
  };

  if (showroom) {
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // 不钻到地面下面
    controls.autoRotateSpeed = 0.5;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.7;
    controls.addEventListener("start", () => {
      flight = null; // 用户一拖动就取消正在进行的镜头飞行
      onUserInteract?.();
    });
    camera.position.set(6, 1.2, 9);
    controls.target.set(-0.5, -0.4, 0);
  }

  loadCarAssets(onProgress)
    .then((assets) => {
      if (disposed) return;
      carHandle = buildCar(assets);
      carHandle.setPaint(pending.paint);
      carHandle.setRim(pending.rim);
      carHandle.setLights(pending.lights);
      carHandle.car.scale.setScalar(CAR_SCALE);
      pivot.add(carHandle.car);

      groundShadow = createGroundShadow(renderer, carHandle.car, { size: 10, far: 1.4 });
      groundShadow.group.position.y = GROUND_Y - CAR_POSITION.y + 0.002;
      pivot.add(groundShadow.group);
      groundShadow.bake();

      if (showroom) {
        const { L } = computeViews();
        controls.minDistance = 0.32 * L;
        controls.maxDistance = 2.2 * L;
        jumpTo(pendingView);
      }
      onReady?.();
    })
    .catch((error) => onError?.(error));

  // =========================================================================
  // 卡片模式：自动左右转 + 画布内拖拽
  // =========================================================================
  let dragging = false;
  let lastX = 0;
  let dragYaw = 0;
  let sinceRelease = Infinity;
  let autoPhase = 0;

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

  const cameraGoal = new THREE.Vector3();
  const cardCameraAt = (t, out) =>
    out
      .set(Math.sin(t / 5), 0, 12 + Math.cos(t / 5) / 2)
      .multiplyScalar(CARD_CAMERA_DISTANCE / 12)
      .add(new THREE.Vector3(0, 0.35, 0));

  if (!showroom) {
    canvas.style.cursor = "grab";
    canvas.style.touchAction = "pan-y"; // 手机上竖向滑动仍然滚动页面
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    cardCameraAt(0, camera.position);
    camera.lookAt(CARD_CAMERA_TARGET);
  }

  // =========================================================================
  // 渲染循环（不在视口内 / 被暂停时停止）
  // =========================================================================
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const clock = new THREE.Clock();
  let elapsed = 0;
  let frame = 0;
  let rafId = null;
  let visible = true;

  const tick = () => {
    rafId = null;
    if (!visible || paused || disposed) return;
    const delta = Math.min(clock.getDelta(), 0.1);
    frame += 1;

    if (!reduceMotion) {
      elapsed += delta;
      lightformers.update(delta, elapsed);
      if (frame % 2 === 0) refreshEnvironment();
    }

    if (showroom) {
      if (flight) {
        // 按真实时间推进，掉帧时飞行时长也不变
        const t = Math.min((performance.now() - flight.start) / flight.duration, 1);
        const k = easeInOutCubic(t);
        camera.position.lerpVectors(flight.fromPos, flight.toPos, k);
        controls.target.lerpVectors(flight.fromTarget, flight.toTarget, k);
        if (t >= 1) flight = null;
      }
      shift += (shiftGoal - shift) * Math.min(delta * 3, 1);
      applyShift();
      controls.autoRotate = autoRotate && !flight && !reduceMotion;
      controls.update(delta);
    } else {
      if (!reduceMotion && !dragging) autoPhase += delta * AUTO_YAW_SPEED;
      if (!dragging) {
        sinceRelease += delta;
        if (sinceRelease > DRAG_RETURN_DELAY) dragYaw *= Math.pow(0.35, delta);
      }
      pivot.rotation.y = CAR_BASE_YAW + Math.sin(autoPhase) * AUTO_YAW_AMPLITUDE + dragYaw;
      camera.position.lerp(cardCameraAt(elapsed, cameraGoal), 0.05);
      camera.lookAt(CARD_CAMERA_TARGET);
    }

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (rafId === null && !disposed && !paused && visible) {
      clock.getDelta();
      rafId = requestAnimationFrame(tick);
    }
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    start();
  });
  observer.observe(canvas);
  start();

  const resizeObserver = new ResizeObserver(() => {
    sizes = getSizes();
    if (!sizes.width || !sizes.height) return;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(sizes.pixelRatio);
    renderer.setSize(sizes.width, sizes.height, false);
  });
  resizeObserver.observe(container);

  return {
    setPaused(value) {
      paused = value;
      start();
    },
    setPaint(key) {
      pending.paint = key;
      carHandle?.setPaint(key);
    },
    setRim(key) {
      pending.rim = key;
      carHandle?.setRim(key);
    },
    setLights(on) {
      pending.lights = on;
      carHandle?.setLights(on);
    },
    setDay(day) {
      lightformers.setDay(day);
      floor?.setDay(day);
      ambient.intensity = (day ? 0.8 : 0.5) * Math.PI;
    },
    setAutoRotate(value) {
      autoRotate = value;
    },
    goTo(name) {
      flyTo(name);
    },
    dispose() {
      disposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      controls?.dispose();
      groundShadow?.dispose();
      floor?.dispose();
      lightformers.dispose();
      cubeTarget.dispose();
      envTarget?.dispose();
      pmrem.dispose();
      carHandle?.dispose();
      renderer.dispose();
    },
  };
}
