"use client";

import { useEffect, useRef, useState } from "react";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from 'lil-gui';

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

export default function Car() {
  const canvasRef = useRef(null);
  const [shaders, setShaders] = useState({
    vertexShader,
    fragmentShader,
  });
  const guiRef = useRef(null);

  useEffect(() => {
    if (!shaders.vertexShader || !shaders.fragmentShader) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use global THREE
    const THREE = window.THREE;
    if (!THREE) {
      console.error('THREE.js not loaded');
      return;
    }

    const scene = new THREE.Scene();

    const getSizes = () => ({
      width: canvas.parentElement.offsetWidth,
      height: canvas.parentElement.offsetWidth / 2,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    });

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

    const handlePointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      displacement.screenCursor.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      displacement.screenCursor.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener("pointermove", handlePointerMove);

    displacement.texture = new THREE.CanvasTexture(displacement.canvas);

    let particles, particlesMaterial;

    // GUI parameters
    const guiParams = {
      basePointSize: window.innerWidth <= 768 ? 0.5 : 0.35,
      brightness: window.innerWidth <= 768 ? 0.9 : 0.35,
      displacementStrength: window.innerWidth <= 768 ? 3 : 3.0,
      glowSize: 0.12,
      glowAlpha: 0.3,
      decayRate: 0.025,
    };

    // Initialize GUI
    if (!guiRef.current) {
      guiRef.current = new GUI();
      const gui = guiRef.current;
      
      // Set GUI to be closed by default
      gui.closeOnTop = true;
      gui.close();
      
      gui.add(guiParams, 'basePointSize', 0.1, 1, 0.05)
        .name('Point Size')
        .onChange((value) => {
          if (particlesMaterial) {
            particlesMaterial.uniforms.uBasePointSize.value = value;
          }
        });

      gui.add(guiParams, 'brightness', 0, 1, 0.05)
        .name('Brightness')
        .onChange((value) => {
          if (particlesMaterial) {
            particlesMaterial.uniforms.uBrightness.value = value;
          }
        });

      gui.add(guiParams, 'displacementStrength', 0, 5, 0.1)
        .name('Displacement')
        .onChange((value) => {
          if (particlesMaterial) {
            particlesMaterial.uniforms.uDisplacementStrength.value = value;
          }
        });

      gui.add(guiParams, 'glowSize', 0.05, 0.3, 0.01)
        .name('Glow Size')
        .onChange((value) => {
          displacement.glowSize = value;
        });

      gui.add(guiParams, 'glowAlpha', 0.1, 0.5, 0.05)
        .name('Glow Alpha')
        .onChange((value) => {
          displacement.glowAlpha = value;
        });

      gui.add(guiParams, 'decayRate', 0.01, 0.1, 0.005)
        .name('Decay Rate')
        .onChange((value) => {
          displacement.decayRate = value;
        });

      // Add a folder for camera controls
      const cameraFolder = gui.addFolder('Camera');
      cameraFolder.add(camera.position, 'z', 5, 30, 0.1)
        .name('Distance')
        .onChange((value) => {
          camera.position.z = value;
        });
    }

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

      displacement.raycaster.setFromCamera(displacement.screenCursor, camera);
      const intersections = displacement.raycaster.intersectObject(displacement.interactivePlane);

      if (intersections.length) {
        const uv = intersections[0].uv;
        displacement.canvasCursor.x = uv.x * displacement.canvas.width;
        displacement.canvasCursor.y = (1 - uv.y) * displacement.canvas.height;
      }

      displacement.context.globalCompositeOperation = "source-over";
      displacement.context.globalAlpha = guiParams.decayRate;
      displacement.context.fillStyle = "black";
      displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height);

      const cursorDistance = displacement.canvasCursorPrevious.distanceTo(displacement.canvasCursor);
      displacement.canvasCursorPrevious.copy(displacement.canvasCursor);
      const alpha = Math.min(cursorDistance * guiParams.glowAlpha, 1);

      const glowSize = displacement.canvas.width * guiParams.glowSize;
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

    const handleResize = () => {
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
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      if (particles) {
        particles.geometry.dispose();
        particles.material.dispose();
      }
      renderer.dispose();
      if (guiRef.current) {
        guiRef.current.destroy();
        guiRef.current = null;
      }
    };
  }, [shaders]);

  return (
    <div className="relative w-full max-w-[600px] aspect-[2/1]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full bg-black rounded-lg" />
    </div>
  );
}