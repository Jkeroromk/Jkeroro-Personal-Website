"use client";

import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function Car() {
  const canvasRef = useRef(null);
  const [shaders, setShaders] = useState({
    vertexShader: "",
    fragmentShader: "",
  });

  useEffect(() => {
    async function loadShaders() {
      const vertexShader = await fetch("/shaders/particles/vertex.glsl").then(
        (res) => res.text()
      );
      const fragmentShader = await fetch("/shaders/particles/fragment.glsl").then(
        (res) => res.text()
      );
      setShaders({ vertexShader, fragmentShader });
    }
    loadShaders();
  }, []);

  useEffect(() => {
    if (!shaders.vertexShader || !shaders.fragmentShader) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

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
      const subdivisions = isMobile ? 256 : 512; // Reduced from 768 to test

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
          uBasePointSize: { value: isMobile ? 0.5 : 0.35 },
          uBrightness: { value: isMobile ? 0.9 : 0.35 },
          uDisplacementStrength: { value: isMobile ? 3 : 3.0 },
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
      displacement.context.globalAlpha = 0.025;
      displacement.context.fillStyle = "black";
      displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height);

      const cursorDistance = displacement.canvasCursorPrevious.distanceTo(displacement.canvasCursor);
      displacement.canvasCursorPrevious.copy(displacement.canvasCursor);
      const alpha = Math.min(cursorDistance * 0.3, 1);

      const glowSize = displacement.canvas.width * 0.12;
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
    };
  }, [shaders]);

  return (
    <div className="relative w-full max-w-[600px] aspect-[2/1]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full bg-black rounded-lg" />
    </div>
  );
}