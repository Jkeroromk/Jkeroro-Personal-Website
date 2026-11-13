/**
 * 首页头像上方的 3D 保时捷 911（实体渲染）
 *
 * 风格参考 TresJS / R3F 的 "Porsche 911 Car Showcase"（by 0xca0a）：
 *   - 动态环境光：一排灯带不停从车顶扫过，侧面灯条 + 红/蓝色点缀光，都只存在于环境贴图里，靠车漆反射呈现
 *   - 车底接触阴影（只渲染一次）
 *   - 镜头跟随鼠标轻微移动
 *
 * 模型："(FREE) Porsche 911 Carrera 4S" by Lionsharp Studios，CC BY-SA 4.0
 * 已修改：黑色车漆、白色轮毂、JKERORO 车牌（源文件和说明见 scripts/porsche-911/）
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { HorizontalBlurShader } from "three/addons/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "three/addons/shaders/VerticalBlurShader.js";

const MODEL_URL = "/static/porsche-911.glb";
const DRACO_PATH = "/draco/";

const CAR_YAW = 0.82; // 车头朝右前方，跟原来的照片角度一致
const CAMERA_FOV = 30;
const CAMERA_BASE = new THREE.Vector3(0.9, 1.7, 9.4); // cameraZ = 20 时的机位
const CAMERA_TARGET = new THREE.Vector3(0.55, -0.45, 0);
const RIG_STRENGTH = new THREE.Vector2(1.2, 0.6); // 鼠标带动镜头的幅度

function tuneMaterials(root) {
  const seen = new Set();
  root.traverse((child) => {
    if (!child.isMesh) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const m of materials) {
      if (!m || seen.has(m)) continue;
      seen.add(m);
      switch (m.name) {
        case "paint": // 亮黑车漆
          m.color.set("#060606");
          m.metalness = 0.6;
          m.roughness = 0.22;
          if ("clearcoat" in m) {
            m.clearcoat = 1;
            m.clearcoatRoughness = 0.04;
          }
          m.envMapIntensity = 3;
          break;
        case "rim_white": // 白轮毂
          m.color.set("#ffffff");
          m.metalness = 0.15;
          m.roughness = 0.3;
          m.envMapIntensity = 1.4;
          break;
        case "window":
          m.color.set("#000000");
          m.metalness = 0.2;
          m.roughness = 0.02;
          m.envMapIntensity = 2.5;
          break;
        case "glass": // 大灯罩
          m.color.set("#ffffff");
          m.transparent = true;
          m.opacity = 0.18;
          m.roughness = 0;
          m.metalness = 0;
          m.depthWrite = false;
          m.envMapIntensity = 2;
          break;
        case "rubber":
          m.color.set("#1a1a1a");
          m.roughness = 0.65;
          m.metalness = 0;
          break;
        case "silver":
          m.color.set("#d0d0d0");
          m.metalness = 1;
          m.roughness = 0.18;
          break;
        case "license":
          m.color.set("#050505");
          m.roughness = 0.5;
          m.metalness = 0;
          break;
        case "plate_text":
          m.color.set("#ffffff");
          m.emissive?.set("#ffffff");
          m.emissiveIntensity = 0.35;
          m.roughness = 0.35;
          m.metalness = 0;
          break;
        case "lights":
          m.emissive?.set("#ffffff");
          m.emissiveIntensity = 0.6;
          break;
        default:
          break;
      }
      m.needsUpdate = true;
    }
  });
}

/** 只存在于环境贴图里的"灯"：发光面片，通过 CubeCamera 每帧重新烘焙 */
function createLightformers() {
  const envScene = new THREE.Scene();

  const lightformer = (color, intensity, { form = "rect", position, rotation = [0, 0, 0], scale = [1, 1, 1] }) => {
    const geometry = form === "circle"
      ? new THREE.CircleGeometry(0.5, 48)
      : form === "ring"
        ? new THREE.RingGeometry(0.4, 0.5, 64)
        : new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.scale.set(...scale);
    return mesh;
  };

  // 背景：深灰到黑的球面渐变（只出现在反射里）
  const background = new THREE.Mesh(
    new THREE.SphereGeometry(100, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new THREE.Color("#2a2a33") },
        uBottom: { value: new THREE.Color("#020203") },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uTop; uniform vec3 uBottom; varying vec3 vDir; void main(){ float t = smoothstep(-0.3, 0.8, vDir.y); gl_FragColor = vec4(mix(uBottom, uTop, t), 1.0); }`,
    })
  );
  envScene.add(background);

  // 顶棚大柔光
  envScene.add(lightformer("#ffffff", 2, { position: [0, 5, -9], rotation: [Math.PI / 2, 0, 0], scale: [10, 10, 1] }));

  // 移动的灯带（从车头扫到车尾，循环）
  const stripsHolder = new THREE.Group();
  stripsHolder.rotation.y = 0.5;
  const strips = new THREE.Group();
  [2, 0, 2, 0, 2, 0, 2, 0].forEach((x, i) => {
    strips.add(lightformer("#ffffff", 8, { form: "circle", position: [x, 4, i * 4], rotation: [Math.PI / 2, 0, 0], scale: [3, 1, 1] }));
  });
  stripsHolder.add(strips);
  envScene.add(stripsHolder);

  // 两侧灯条
  envScene.add(lightformer("#ffffff", 6, { position: [-5, 1, -1], rotation: [0, Math.PI / 2, 0], scale: [20, 0.1, 1] }));
  envScene.add(lightformer("#ffffff", 2, { position: [-5, -1, -1], rotation: [0, Math.PI / 2, 0], scale: [20, 0.5, 1] }));
  envScene.add(lightformer("#ffffff", 2.5, { position: [10, 1, 0], rotation: [0, -Math.PI / 2, 0], scale: [20, 1, 1] }));

  // 红 / 蓝点缀光，缓慢漂浮
  const red = lightformer("#ff2d2d", 3, { form: "ring", position: [-15, 4, -18], scale: [10, 10, 10] });
  const blue = lightformer("#3d5bff", 2.5, { form: "ring", position: [16, 3, 12], scale: [8, 8, 8] });
  red.lookAt(0, 0, 0);
  blue.lookAt(0, 0, 0);
  envScene.add(red, blue);

  const redBase = red.position.clone();
  const blueBase = blue.position.clone();

  const update = (delta, elapsed) => {
    strips.position.z += delta * 10;
    if (strips.position.z > 20) strips.position.z = -60;
    red.position.set(redBase.x, redBase.y + Math.sin(elapsed * 1.3) * 1.5, redBase.z + Math.cos(elapsed * 0.9) * 1.5);
    blue.position.set(blueBase.x + Math.sin(elapsed * 0.7) * 1.5, blueBase.y + Math.cos(elapsed * 1.1) * 1.2, blueBase.z);
    red.lookAt(0, 0, 0);
    blue.lookAt(0, 0, 0);
  };

  const dispose = () => {
    envScene.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose();
        o.material.dispose();
      }
    });
  };

  return { envScene, update, dispose };
}

/** 车底接触阴影：从下往上用正交相机渲染一次深度，模糊后贴在地面 */
function createContactShadow(renderer, car, { width, height, y, far = 1.2, darkness = 1.4, blur = 3.2, opacity = 0.95 }) {
  const group = new THREE.Group();
  group.position.y = y;

  const renderTarget = new THREE.WebGLRenderTarget(512, 512);
  renderTarget.texture.generateMipmaps = false;
  const renderTargetBlur = new THREE.WebGLRenderTarget(512, 512);
  renderTargetBlur.texture.generateMipmaps = false;

  const planeGeometry = new THREE.PlaneGeometry(width, height).rotateX(Math.PI / 2);
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

  const shadowCamera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0, far);
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

  const bake = () => {
    group.updateMatrixWorld(true);
    const tempScene = new THREE.Scene();
    const parent = car.parent;
    tempScene.add(car);
    tempScene.overrideMaterial = depthMaterial;
    const clearAlpha = renderer.getClearAlpha();
    renderer.setClearAlpha(0);
    renderer.setRenderTarget(renderTarget);
    renderer.clear();
    renderer.render(tempScene, shadowCamera);
    blurPass(blur);
    blurPass(blur * 0.4);
    renderer.setRenderTarget(null);
    renderer.setClearAlpha(clearAlpha);
    if (parent) parent.add(car);
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

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ getCameraZ?: () => number, onReady?: () => void, onError?: (e: unknown) => void }} options
 * @returns {() => void} cleanup
 */
export function createCarScene(canvas, { getCameraZ = () => 20, onReady, onError } = {}) {
  let disposed = false;
  const container = canvas.parentElement;

  const getSizes = () => {
    const rect = container.getBoundingClientRect();
    return { width: rect.width, height: rect.height, pixelRatio: Math.min(window.devicePixelRatio, 1.75) };
  };
  let sizes = getSizes();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(sizes.pixelRatio);
  renderer.setSize(sizes.width, sizes.height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, sizes.width / sizes.height, 0.1, 200);

  // ---- 动态环境贴图 ----
  const lightformers = createLightformers();
  const cubeTarget = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cubeCamera = new THREE.CubeCamera(0.1, 200, cubeTarget);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envTarget = null;
  const refreshEnvironment = () => {
    cubeCamera.update(renderer, lightformers.envScene);
    envTarget = pmrem.fromCubemap(cubeTarget.texture, envTarget);
    scene.environment = envTarget.texture;
  };
  refreshEnvironment();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 0.6));
  const key = new THREE.SpotLight(0xffffff, 120, 40, 0.5, 1);
  key.position.set(0, 14, 2);
  scene.add(key);

  // ---- 镜头跟随鼠标 ----
  const pointer = new THREE.Vector2(0, 0);
  const desired = new THREE.Vector3();
  // 窄屏时头像相对更大：镜头拉远一点、车往上抬一点，避免挡住车头
  const isNarrow = () => sizes.width < 480;
  const cameraTarget = new THREE.Vector3();
  const updateCameraTarget = () => cameraTarget.copy(CAMERA_TARGET).add(new THREE.Vector3(0, isNarrow() ? -0.55 : 0, 0));
  updateCameraTarget();
  const baseCameraPosition = () => CAMERA_BASE.clone().multiplyScalar((getCameraZ() / 20) * (isNarrow() ? 1.15 : 1));
  camera.position.copy(baseCameraPosition());
  camera.lookAt(cameraTarget);

  const handlePointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    pointer.set(THREE.MathUtils.clamp(x, -1.5, 1.5), THREE.MathUtils.clamp(y, -1.5, 1.5));
  };
  window.addEventListener("pointermove", handlePointerMove, { passive: true });

  // ---- 模型 ----
  const draco = new DRACOLoader().setDecoderPath(DRACO_PATH).setDecoderConfig({ type: "wasm" });
  const loader = new GLTFLoader().setDRACOLoader(draco);
  let car = null;
  let shadow = null;

  loader.load(
    MODEL_URL,
    (gltf) => {
      if (disposed) return;
      car = gltf.scene;
      tuneMaterials(car);

      // 居中，车身落地
      const box = new THREE.Box3().setFromObject(car);
      const center = box.getCenter(new THREE.Vector3());
      car.position.sub(new THREE.Vector3(center.x, box.min.y, center.z));
      const pivot = new THREE.Group();
      pivot.add(car);
      pivot.rotation.y = CAR_YAW;
      pivot.position.y = -1.15;
      scene.add(pivot);

      const size = box.getSize(new THREE.Vector3());
      shadow = createContactShadow(renderer, pivot, {
        width: size.z * 1.6,
        height: size.z * 1.6,
        y: -1.15 + 0.005,
        far: size.y * 0.55,
      });
      scene.add(shadow.group);
      shadow.bake();

      onReady?.();
    },
    undefined,
    (error) => onError?.(error)
  );

  // ---- 渲染循环（不在视口内时暂停） ----
  const clock = new THREE.Clock();
  let elapsed = 0;
  let frame = 0;
  let rafId = null;
  let visible = true;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const tick = () => {
    rafId = null;
    if (!visible || disposed) return;
    const delta = Math.min(clock.getDelta(), 0.1);
    elapsed += delta;
    frame += 1;

    if (!reduceMotion) {
      lightformers.update(delta, elapsed);
      if (frame % 2 === 0) refreshEnvironment(); // 隔帧更新环境贴图，够顺滑也省性能
    }

    const base = baseCameraPosition();
    desired.set(base.x + pointer.x * RIG_STRENGTH.x, base.y + pointer.y * RIG_STRENGTH.y, base.z);
    camera.position.lerp(desired, 0.05);
    camera.lookAt(cameraTarget);

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
    updateCameraTarget();
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
    window.removeEventListener("pointermove", handlePointerMove);
    draco.dispose();
    shadow?.dispose();
    lightformers.dispose();
    cubeTarget.dispose();
    envTarget?.dispose();
    pmrem.dispose();
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
