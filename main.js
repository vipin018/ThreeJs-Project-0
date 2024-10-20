import "./style.css";
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import gsap from "gsap";
import LocomotiveScroll from 'locomotive-scroll';

const locomotiveScroll = new LocomotiveScroll();
// Create scene
const scene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;


// Add OrbitControls


// Create EffectComposer
const composer = new EffectComposer(renderer);

// Add RenderPass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add RGBShiftShader
const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.00115;
composer.addPass(rgbShiftPass);

// Declare model variable in the global scope
let model;

// Load HDRI environment map
new RGBELoader()
  .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/industrial_sunset_02_puresky_2k.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    // scene.background = texture;
    scene.environment = texture;

    // Load GLB model
    const loader = new GLTFLoader();
    loader.load(
      "./DamagedHelmet.gltf",
      function (gltf) {
        model = gltf.scene;
        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        // Scale the model if it's too large or too small
        const scale = 2 / box.getSize(new THREE.Vector3()).length();
        model.scale.setScalar(scale);

        // Apply textures
        model.traverse((child) => {
          if (child.isMesh) {
            // Load and apply roughness map
            const roughnessTexture = new THREE.TextureLoader().load('./DamagedHelmet_roughness.jpg');
            child.material.roughnessMap = roughnessTexture;
            child.material.roughness = 1.0;

            // Load and apply normal map
            const normalTexture = new THREE.TextureLoader().load('./DamagedHelmet_normal.jpg');
            child.material.normalMap = normalTexture;

            // Load and apply metalness map
            const metalnessTexture = new THREE.TextureLoader().load('./DamagedHelmet_metallic.jpg');
            child.material.metalnessMap = metalnessTexture;
            child.material.metalness = 1.0;

            // Load and apply emissive map
            const emissiveTexture = new THREE.TextureLoader().load('./DamagedHelmet_emissive.jpg');
            child.material.emissiveMap = emissiveTexture;
            child.material.emissive = new THREE.Color(0xffffff);

            // Update material
            child.material.needsUpdate = true;
          }
        });

        scene.add(model);
        // Adjust camera position
        camera.position.z = 2;
        // Remove this line as 'controls' is not defined
        // controls.update();
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      function (error) {
        console.error('An error happened', error);
      }
    );
  });

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  // Update controls in the animation loop
  composer.render(); // Use composer.render() instead of renderer.render()
}

// Add event listener for mouse movement
window.addEventListener('mousemove', (event) => {
  if (model) {
    // Calculate rotation based on mouse position
    const rotationY = (event.clientY / window.innerHeight - 0.5) * Math.PI*0.2;
    const rotationX = (event.clientX / window.innerWidth - 0.5) * Math.PI*0.2;

    // Apply rotation to the model
    gsap.to(model.rotation, {
      x: rotationY,
      y: rotationX,
      duration: 0.7,
      ease: "power2.out"
    });
  }
});


animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
