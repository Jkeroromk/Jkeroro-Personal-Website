/**
 * 3D Lexus LC 500（Wald Sports Line，写实渲染）—— 全屏 Showroom 用
 *
 * 场景移植自 pmndrs 的 "Building Live Env Maps" 示例（Paul Henschel / 0xca0a，codesandbox.io/s/lwo219）：
 *   - 实时环境贴图：一排灯带不停从车顶扫过 + 两侧灯条 + 漂浮的红色点缀光，车漆/车窗反射一直在流动
 *   - 带阴影的顶部聚光灯 + 环境光，车身自阴影
 *
 * 展厅功能：OrbitControls 自由环绕、镜头预设、换车漆/轮毂、开车灯、白天/夜晚
 *
 * 模型："Lexus LC 500 WALD Sports Line | www.vecarz.com"（Sketchfab，vecarz），CC BY-NC 4.0，
 * 见 scripts/lexus-lc500/README.md。原模型所有材质都是同一组默认参数（metalness 0 / roughness 0.45），
 * 这里在运行时按材质名逐个调成车漆、镀铬、玻璃、轮胎等（见 MATERIAL_TUNING）。
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { HorizontalBlurShader } from "three/addons/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "three/addons/shaders/VerticalBlurShader.js";

const MODEL_URL = "/static/lexus-lc500.glb";

// 构图（原示例：car scale 1.6, position [-0.5, -0.18, 0], rotation π/5）。
// 模型单位是米，车长 4.88 m；缩放后和之前的 911 差不多大。车头朝模型的 +Z。
const CAR_SCALE = 1.58;
const CAR_POSITION = new THREE.Vector3(-0.5, -0.18, 0);
const CAR_BASE_YAW = Math.PI / 5;
const GROUND_Y = -1.16;
const CAMERA_FOV = 30;

// 车漆：原车身贴图是白色加烘焙 AO，颜色直接乘在贴图上，所以 "original" 就是白色
export const PAINTS = {
  white: { label: "Wald White", swatch: "#eeeeea", paint: "#ffffff", metalness: 0.15, roughness: 0.32 },
  black: { label: "Gloss Black", swatch: "#0b0b0c", paint: "#151516", metalness: 0.35, roughness: 0.3 },
  red: { label: "Infrared", swatch: "#b3121b", paint: "#a1121a", metalness: 0.35, roughness: 0.3 },
  silver: { label: "Atomic Silver", swatch: "#a9acaf", paint: "#a7aaae", metalness: 0.8, roughness: 0.32 },
  blue: { label: "Structural Blue", swatch: "#1f4fb4", paint: "#1f4aa8", metalness: 0.55, roughness: 0.3 },
};

// 轮毂：原厂是深色（graphite）轮毂，"original" 保留贴图原色
export const RIMS = {
  original: { label: "Graphite", swatch: "#3a3b3d", color: "#ffffff", metalness: 0.75, roughness: 0.32 },
  black: { label: "Gloss Black", swatch: "#141414", color: "#3a3a3a", metalness: 0.6, roughness: 0.22 },
  silver: { label: "Silver", swatch: "#c9ccd0", color: "#ffffff", metalness: 1, roughness: 0.18, bright: true },
  white: { label: "White", swatch: "#f2f2f2", color: "#ffffff", metalness: 0.3, roughness: 0.25, bright: true },
};

export const DEFAULT_PAINT = "white";
export const DEFAULT_RIM = "original";

export const VIEWS = ["overview", "specs", "wheels", "lights", "rear"];

// ---------------------------------------------------------------------------
// 资源：模型只加载一次（多次打开 Showroom 时复用，每次克隆一套材质）
// ---------------------------------------------------------------------------
let assetsPromise = null;
function loadCarAssets(onProgress) {
  if (assetsPromise) return assetsPromise;
  const gltfLoader = new GLTFLoader();
  assetsPromise = gltfLoader
    .loadAsync(MODEL_URL, (event) => {
      if (event.total) onProgress?.(event.loaded / event.total);
    })
    .then((gltf) => ({ gltf }))
    .catch((error) => {
      assetsPromise = null; // 允许重试
      throw error;
    });
  return assetsPromise;
}

// ---------------------------------------------------------------------------
// 材质：按原模型的材质名分组调参
// ---------------------------------------------------------------------------
const GROUPS = {
  paint: ["CSR2_CarPaint"],
  gloss: ["Black", "EXT_BODYBLACK_1", "Lights_Black", "Hood", "CSR2_Base"],
  carbon: ["CSR2_Carbon1", "CSR2_OEM_Carbon1_100"],
  chrome: ["Chrome", "EXT_chrome", "steer_chrome", "Mirror"],
  rim: ["Rim_1", "Rim_2", "Rim_black"],
  tyre: ["AC_TREAD", "AC_TIRESIDE"],
  caliper: ["lexus_caliper"],
  rotor: ["ROTOR"],
  lamp: ["CSR2_Light"],
  tail: ["taillight", "light_glass_red"],
  window: ["Window"],
  lampGlass: ["GlassClear"],
  innerGlass: ["Int_glass"],
  redGlass: ["GlassRed"],
  amberGlass: ["GlassAmber"],
  grille: ["CSR2_Grille1", "CSR2_Grille5", "CSR2_Grille6", "CSR2_Grille7", "CSR2_Grille8", "CSR2_Grille9"],
  plate: ["Material #13"],
  cap: ["Material #49"], // 轮毂中心盖（JK 标）
};
const GROUP_OF = new Map(Object.entries(GROUPS).flatMap(([group, names]) => names.map((n) => [n, group])));

const PHYSICAL_GROUPS = new Set(["paint", "gloss", "carbon", "window", "lampGlass", "innerGlass", "redGlass", "amberGlass"]);

/** 把 glTF 里的 MeshStandardMaterial 换成 MeshPhysicalMaterial（要 clearcoat / 玻璃效果的组） */
function toPhysical(material) {
  const m = new THREE.MeshPhysicalMaterial();
  THREE.MeshStandardMaterial.prototype.copy.call(m, material);
  m.name = material.name;
  return m;
}

/**
 * 车身外板是双面材质，开门后能看到门板背面（原模型的门内饰只盖住中间一块）。
 * 背面改成深色内衬色，不显示车漆颜色
 */
function darkBackFaces(m) {
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "vec4 diffuseColor = vec4( diffuse, opacity );",
      "vec4 diffuseColor = vec4( gl_FrontFacing ? diffuse : vec3( 0.025 ), opacity );"
    );
  };
  m.customProgramCacheKey = () => "dark-back-faces";
}

function tuneMaterial(m, group) {
  m.envMapIntensity = 1.2;
  // 原模型几乎每个材质都挂了一张 32×32 的"平"法线贴图，没有作用，去掉省一次采样
  if (m.normalMap && m.normalMap.image?.width <= 32) m.normalMap = null;
  switch (group) {
    case "paint":
      Object.assign(m, { metalness: 0.15, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2 });
      darkBackFaces(m);
      break;
    case "gloss":
      Object.assign(m, { metalness: 0.2, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.6 });
      break;
    case "carbon":
      Object.assign(m, { metalness: 0.3, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6 });
      break;
    case "chrome":
      Object.assign(m, { metalness: 1, roughness: 0.08, envMapIntensity: 2.2 });
      break;
    case "rim":
      Object.assign(m, { metalness: 0.75, roughness: 0.32, envMapIntensity: 1.8 });
      break;
    case "tyre":
      Object.assign(m, { metalness: 0, roughness: 0.85, envMapIntensity: 0.6 });
      break;
    case "caliper":
      Object.assign(m, { metalness: 0.2, roughness: 0.35, envMapIntensity: 1.4 });
      break;
    case "rotor":
      Object.assign(m, { metalness: 0.9, roughness: 0.45 });
      break;
    case "lamp":
    case "lampRear":
      Object.assign(m, { metalness: 0.7, roughness: 0.18, envMapIntensity: 1.8 });
      break;
    case "tail":
      Object.assign(m, { metalness: 0.2, roughness: 0.2, envMapIntensity: 1.4 });
      break;
    case "window":
      Object.assign(m, { color: new THREE.Color("#0b0c0e"), metalness: 0, roughness: 0.02, transparent: true, opacity: 0.55, envMapIntensity: 2.5, depthWrite: false });
      break;
    case "innerGlass":
      Object.assign(m, { color: new THREE.Color("#0b0c0e"), metalness: 0, roughness: 0.02, transparent: true, opacity: 0.18, envMapIntensity: 1, depthWrite: false });
      break;
    case "lampGlass":
      Object.assign(m, { color: new THREE.Color("#ffffff"), metalness: 0, roughness: 0, transparent: true, opacity: 0.12, envMapIntensity: 2.5, depthWrite: false });
      break;
    case "redGlass":
      Object.assign(m, { color: new THREE.Color("#c8101a"), metalness: 0, roughness: 0.05, transparent: true, opacity: 0.75, envMapIntensity: 1.6, depthWrite: false });
      break;
    case "amberGlass":
      Object.assign(m, { color: new THREE.Color("#ff9a1e"), metalness: 0, roughness: 0.05, transparent: true, opacity: 0.55, envMapIntensity: 1.6, depthWrite: false });
      break;
    case "grille":
      Object.assign(m, { metalness: 0.4, roughness: 0.35 });
      break;
    case "cap":
      Object.assign(m, { metalness: 0.5, roughness: 0.25, envMapIntensity: 1.6, normalMap: null });
      if (m.map) m.map.anisotropy = 8;
      break;
    case "plate":
      Object.assign(m, { metalness: 0.1, roughness: 0.4, envMapIntensity: 0.8 });
      if (m.map) m.map.anisotropy = 8;
      break;
    default:
      // 内饰等：保持贴图，偏哑光
      Object.assign(m, { metalness: 0, roughness: 0.6, envMapIntensity: 0.8 });
  }
  m.needsUpdate = true;
}

/**
 * 把网格的三角形按车头/车尾（模型 +Z 是车头）分成两个 group：0 = 车头，1 = 车尾。
 * 几何体是共享缓存，只处理一次。返回 "front" / "rear"（整块都在一边）或 "both"。
 */
function splitFrontRear(mesh) {
  const geometry = mesh.geometry;
  if (geometry.userData.frontRear) return geometry.userData.frontRear;
  const position = geometry.attributes.position;
  const index = geometry.index;
  const v = new THREE.Vector3();
  const zs = new Float32Array(position.count);
  for (let i = 0; i < position.count; i++) zs[i] = v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld).z;

  let result = "both";
  if (index) {
    const src = index.array;
    const front = [];
    const rear = [];
    for (let t = 0; t < src.length; t += 3) {
      const a = src[t], b = src[t + 1], c = src[t + 2];
      (zs[a] + zs[b] + zs[c] >= 0 ? front : rear).push(a, b, c);
    }
    if (!rear.length) result = "front";
    else if (!front.length) result = "rear";
    else {
      const out = new src.constructor(src.length);
      out.set(front, 0);
      out.set(rear, front.length);
      geometry.setIndex(new THREE.BufferAttribute(out, 1));
      geometry.clearGroups();
      geometry.addGroup(0, front.length, 0);
      geometry.addGroup(front.length, rear.length, 1);
    }
  }
  geometry.userData.frontRear = result;
  return result;
}

/**
 * 车门：两扇门在模型里是独立零件（门板、车窗、后视镜、门内饰…），节点名以 L_Door / R_door / r_Door / Door 开头，
 * 左右按位置分（模型 +X 是左边）。每边建一个铰链节点放在门的前上缘，把零件挂上去，开门就是绕 Y 轴转。
 */
const DOOR_PART = /^(L_Door|R_door|r_Door|Door)/;
const DOOR_OPEN_ANGLE = THREE.MathUtils.degToRad(62);

function rigDoors(car) {
  car.updateMatrixWorld(true);
  const parts = { left: [], right: [] };
  const box = new THREE.Box3();
  const center = new THREE.Vector3();
  car.traverse((node) => {
    if (!node.isMesh || !DOOR_PART.test(node.name)) return;
    box.setFromObject(node).getCenter(center);
    parts[center.x >= 0 ? "left" : "right"].push(node);
  });

  const hinges = {};
  for (const side of ["left", "right"]) {
    if (!parts[side].length) continue;
    const doorBox = new THREE.Box3();
    parts[side].forEach((node) => doorBox.expandByObject(node));
    const sign = side === "left" ? 1 : -1;
    const hinge = new THREE.Object3D();
    hinge.name = `DoorHinge_${side}`;
    // 铰链在门的最前缘、靠外侧
    const outer = sign > 0 ? doorBox.max.x : doorBox.min.x;
    hinge.position.set(outer - sign * 0.17, 0, doorBox.max.z - 0.04);
    car.add(hinge);
    hinge.updateMatrixWorld(true);
    parts[side].forEach((node) => hinge.attach(node));
    hinges[side] = { hinge, sign };
  }
  return hinges;
}

/** 克隆模型并调材质 */
function buildCar({ gltf }) {
  const car = gltf.scene.clone(true);
  car.updateMatrixWorld(true);
  const cloned = new Map();
  const byGroup = new Map();

  car.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;

    // 车灯材质前后共用一个，有的网格（Kit1_Light）甚至把车头灯和尾灯放在一起。
    // 开灯时前面是白光、后面是红光，所以按三角形位置拆成两组，各用一份材质
    if (GROUP_OF.get(node.material.name) === "lamp") {
      const split = splitFrontRear(node);
      const front = cloneFor(node.material, "lamp:front", "lamp");
      const rear = cloneFor(node.material, "lamp:rear", "lampRear");
      node.material = split === "front" ? front : split === "rear" ? rear : [front, rear];
      return;
    }
    node.material = cloneFor(node.material, node.material, GROUP_OF.get(node.material.name) ?? "other");
    // 透明件不投影（车窗投影会让车里一片黑）
    if (node.material.transparent) node.castShadow = false;
  });

  function cloneFor(source, key, group) {
    if (!cloned.has(key)) {
      const m = PHYSICAL_GROUPS.has(group) ? toPhysical(source) : source.clone();
      tuneMaterial(m, group);
      if (!byGroup.has(group)) byGroup.set(group, []);
      byGroup.get(group).push(m);
      cloned.set(key, m);
    }
    return cloned.get(key);
  }

  const each = (group, fn) => (byGroup.get(group) ?? []).forEach(fn);
  const doors = rigDoors(car);

  return {
    car,
    setPaint(key) {
      const p = PAINTS[key] ?? PAINTS[DEFAULT_PAINT];
      each("paint", (m) => {
        m.color.set(p.paint);
        m.metalness = p.metalness;
        m.roughness = p.roughness;
      });
    },
    setRim(key) {
      const r = RIMS[key] ?? RIMS[DEFAULT_RIM];
      each("rim", (m) => {
        // 原贴图是深色的；换浅色轮毂时去掉贴图里的底色，只保留明暗
        if (m.userData.map === undefined) m.userData.map = m.map;
        m.map = r.bright ? null : m.userData.map;
        m.color.set(r.bright ? r.swatch : r.color);
        m.metalness = r.metalness;
        m.roughness = r.roughness;
        m.needsUpdate = true;
      });
    },
    setLights(on) {
      // 灯罩贴图在灯珠位置是暗的，用贴图做发光会看不出来，所以直接整块发光
      each("lamp", (m) => {
        m.emissive.set(on ? "#e8f0ff" : "#000000");
        m.emissiveIntensity = on ? 3 : 1;
      });
      each("lampRear", (m) => {
        m.emissive.set(on ? "#ff1a1a" : "#000000");
        m.emissiveIntensity = on ? 1.4 : 1;
      });
      each("tail", (m) => {
        m.emissiveMap = m.map;
        m.emissive.set(on ? "#ff2a2a" : "#000000");
        m.emissiveIntensity = on ? 2.5 : 1;
        m.needsUpdate = true;
      });
      each("redGlass", (m) => {
        m.emissive.set(on ? "#ff1010" : "#000000");
        m.emissiveIntensity = on ? 1.2 : 1;
      });
      each("lampGlass", (m) => {
        m.opacity = on ? 0.22 : 0.12;
      });
    },
    /** 0 = 关，1 = 全开 */
    setDoorOpen(t) {
      for (const { hinge, sign } of Object.values(doors)) hinge.rotation.y = -sign * DOOR_OPEN_ANGLE * t;
    },
    dispose() {
      // 几何体和贴图是共享缓存，不在这里释放；只释放克隆出来的材质
      new Set(cloned.values()).forEach((m) => m.dispose());
    },
  };
}

// 环境背景色：原示例是 #444 + 蓝色渐变（偏紫），这里改成中性灰
const NIGHT_BG = { base: "#3d3d40", a: "#8e8e94", b: "#0d0d0f" };
const DAY_BG = { base: "#dcdcdc", a: "#ffffff", b: "#9a9a9a" };

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
  const red = lightformer({ form: "ring", color: "red", intensity: 0.2, scale: 10, position: [-15, 4, -18] }); // 白车上原来的强度像一块红斑
  red.lookAt(0, 0, 0);
  floatGroup.add(red);
  envScene.add(floatGroup);

  // 背景球：底色 + 从 (100,100,100) 方向的深度渐变（对应原示例 lamina 的 LayerMaterial）
  const backgroundUniforms = {
    uBase: { value: new THREE.Color(NIGHT_BG.base) },
    uColorA: { value: new THREE.Color(NIGHT_BG.a) },
    uColorB: { value: new THREE.Color(NIGHT_BG.b) },
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
    const bg = day ? DAY_BG : NIGHT_BG;
    backgroundUniforms.uBase.value.set(bg.base);
    backgroundUniforms.uColorA.value.set(bg.a);
    backgroundUniforms.uColorB.value.set(bg.b);
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
    new THREE.MeshStandardMaterial({ color: "#1d1d20", roughness: 0.42, metalness: 0.25, transparent: true, alphaMap, depthWrite: false })
  );
  floor.receiveShadow = true;
  floor.position.y = GROUND_Y - 0.002;
  floor.renderOrder = 0;

  return {
    floor,
    setDay(day) {
      floor.material.color.set(day ? "#d6d6d6" : "#1d1d20");
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
 *   onReady?: () => void,
 *   onProgress?: (p: number) => void,
 *   onError?: (e: unknown) => void,
 *   onUserInteract?: () => void,
 * }} options
 */
export function createCarScene(canvas, { onReady, onProgress, onError, onUserInteract } = {}) {
  let disposed = false;
  let autoRotate = false; // 默认不自动旋转（Showroom 右下角可以打开）
  const container = canvas.parentElement;

  const getSizes = () => {
    const rect = container.getBoundingClientRect();
    return { width: rect.width, height: rect.height, pixelRatio: Math.min(window.devicePixelRatio, 2) };
  };
  let sizes = getSizes();

  // 透明画布：背景色和水印标题由页面（CSS）负责，车压在水印上面
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
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

  // ---- 实时环境贴图 ----
  const lightformers = createLightformers();
  const cubeTarget = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cubeCamera = new THREE.CubeCamera(1, 1000, cubeTarget);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envTarget = null;
  const refreshEnvironment = () => {
    cubeCamera.update(renderer, lightformers.envScene);
    envTarget = pmrem.fromCubemap(cubeTarget.texture, envTarget);
    scene.environment = envTarget.texture;
  };
  refreshEnvironment();

  const floor = createFloor();
  scene.add(floor.floor);

  // ---- 车 ----
  const pivot = new THREE.Group();
  pivot.position.copy(CAR_POSITION);
  pivot.rotation.y = CAR_BASE_YAW;
  scene.add(pivot);

  let carHandle = null;
  let groundShadow = null;
  let views = null; // showroom 镜头预设（加载后根据车的尺寸计算）
  let pendingView = "overview";
  const pending = { paint: DEFAULT_PAINT, rim: DEFAULT_RIM, lights: false };
  let doorGoal = 0;
  let doorT = 0;

  // =========================================================================
  // OrbitControls + 镜头飞行
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
    camera.setViewOffset(width, height, narrow ? 0 : width * 0.12 * shift, narrow ? height * 0.16 * shift : 0, width, height);
  };

  const computeViews = () => {
    const box = new THREE.Box3().setFromObject(carHandle.car);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const H = size.y;
    const L = Math.max(size.x, size.z);

    // 车头方向：模型的 +Z
    const f = new THREE.Vector3(0, 0, 1).transformDirection(carHandle.car.matrixWorld).setY(0).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const s = new THREE.Vector3().crossVectors(up, f).normalize(); // 车的一侧

    const comb = (...parts) => parts.reduce((acc, [dir, k]) => acc.addScaledVector(dir, k), new THREE.Vector3());
    const v = (pos, target) => ({ position: c.clone().add(pos), target: c.clone().add(target) });

    views = {
      overview: v(comb([f, 0.78 * L], [s, 1.18 * L], [up, 0.16 * L]), comb([f, 0.04 * L], [up, -0.1 * H])),
      specs: v(comb([f, 1.3 * L], [s, -1.55 * L], [up, 0.2 * L]), comb([up, -0.08 * H])),
      wheels: v(comb([f, 0.42 * L], [s, 0.62 * L], [up, -0.12 * H]), comb([f, 0.3 * L], [s, 0.18 * L], [up, -0.28 * H])),
      lights: v(comb([f, 1.05 * L], [s, 0.22 * L], [up, 0.02 * L]), comb([f, 0.35 * L], [up, -0.08 * H])),
      rear: v(comb([f, -0.95 * L], [s, 0.45 * L], [up, 0.1 * L]), comb([f, -0.25 * L], [up, -0.1 * H])),
    };
    return { L };
  };

  // 视角距离随画面比例调整：宽屏稍微拉远一点留出两侧 UI，竖屏（手机）拉得更远让整台车放得下
  let carLength = 1;
  const fitPosition = (view) => {
    const aspect = sizes.width / Math.max(sizes.height, 1);
    const k = 1.18 * Math.pow(Math.max(1, 1.5 / aspect), 0.85);
    const position = view.target.clone().add(view.position.clone().sub(view.target).multiplyScalar(k));
    if (controls) controls.maxDistance = Math.max(2.4 * carLength, position.distanceTo(view.target) * 1.4);
    return position;
  };

  const jumpTo = (name) => {
    const view = views?.[name];
    if (!view || !controls) return;
    camera.position.copy(fitPosition(view));
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
      toPos: fitPosition(view),
      toTarget: view.target,
    };
  };

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

  loadCarAssets(onProgress)
    .then((assets) => {
      if (disposed) return;
      carHandle = buildCar(assets);
      carHandle.setPaint(pending.paint);
      carHandle.setRim(pending.rim);
      carHandle.setLights(pending.lights);
      carHandle.car.scale.setScalar(CAR_SCALE);
      // 车底贴地、前后左右居中（在挂到 pivot 之前量，量出来就是 pivot 坐标系里的尺寸）
      carHandle.car.updateMatrixWorld(true);
      const local = new THREE.Box3().setFromObject(carHandle.car);
      carHandle.car.position.set(
        -(local.min.x + local.max.x) / 2,
        GROUND_Y - CAR_POSITION.y - local.min.y,
        -(local.min.z + local.max.z) / 2
      );
      pivot.add(carHandle.car);

      groundShadow = createGroundShadow(renderer, carHandle.car, { size: 10, far: 1.4 });
      groundShadow.group.position.y = GROUND_Y - CAR_POSITION.y + 0.002;
      pivot.add(groundShadow.group);
      groundShadow.bake();

      scene.updateMatrixWorld(true);
      const { L } = computeViews();
      carLength = L;
      controls.minDistance = 0.32 * L;
      jumpTo(pendingView);
      onReady?.();
    })
    .catch((error) => onError?.(error));

  // =========================================================================
  // 渲染循环（不在视口内时停止）
  // =========================================================================
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const clock = new THREE.Clock();
  let elapsed = 0;
  let frame = 0;
  let rafId = null;
  let visible = true;

  const tick = () => {
    rafId = null;
    if (!visible || disposed) return;
    const delta = Math.min(clock.getDelta(), 0.1);
    frame += 1;

    if (!reduceMotion) {
      elapsed += delta;
      lightformers.update(delta, elapsed);
      if (frame % 2 === 0) refreshEnvironment();
    }

    if (flight) {
      // 按真实时间推进，掉帧时飞行时长也不变
      const t = Math.min((performance.now() - flight.start) / flight.duration, 1);
      const k = easeInOutCubic(t);
      camera.position.lerpVectors(flight.fromPos, flight.toPos, k);
      controls.target.lerpVectors(flight.fromTarget, flight.toTarget, k);
      if (t >= 1) flight = null;
    }
    if (carHandle && doorT !== doorGoal) {
      // 开关门约 1.1 秒，先快后慢；停下后重新烘焙地面阴影
      doorT = doorGoal > doorT ? Math.min(doorT + delta / 1.1, 1) : Math.max(doorT - delta / 1.1, 0);
      carHandle.setDoorOpen(easeInOutCubic(doorT));
      if (doorT === doorGoal) groundShadow?.bake();
    }
    shift += (shiftGoal - shift) * Math.min(delta * 3, 1);
    applyShift();
    controls.autoRotate = autoRotate && !flight && !reduceMotion && shiftGoal === 0; // 看参数时不转，免得车跑到面板下面
    controls.update(delta);

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (rafId === null && !disposed && visible) {
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
      floor.setDay(day);
      ambient.intensity = (day ? 0.8 : 0.5) * Math.PI;
    },
    setDoors(open) {
      doorGoal = open ? 1 : 0;
      if (reduceMotion && carHandle) {
        doorT = doorGoal;
        carHandle.setDoorOpen(doorT);
        groundShadow?.bake();
      }
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
      controls.dispose();
      groundShadow?.dispose();
      floor.dispose();
      lightformers.dispose();
      cubeTarget.dispose();
      envTarget?.dispose();
      pmrem.dispose();
      carHandle?.dispose();
      renderer.dispose();
    },
  };
}
