import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Configure renderer
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x37383c); // Background color
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3.14);
scene.add(hemisphereLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.57);
directionalLight.position.set(-2, 4, 2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.right = 5;
directionalLight.shadow.camera.top = 5;
directionalLight.shadow.camera.bottom = -5;
scene.add(directionalLight);

// Model container for rotation/position
const modelContainer = new THREE.Group();
scene.add(modelContainer);

// Camera position
camera.position.z = 3;

// Mouse interaction variables
let isMouseDown = false;
let isRightMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let modelScale = 1;

// Load 3D model
const loader = new GLTFLoader();
loader.load(
  // Model path
  'Duck.glb',
  
  // Success callback
  function (gltf) {
    const model = gltf.scene;
    modelContainer.add(model);

    // Center and scale model
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Calculate scale to make model reasonable size
    let scale = 1.6 / size.y;
    scale = Math.min(scale, 2.0 / size.x);
    scale = Math.min(scale, 2.0 / size.z);
    model.scale.setScalar(scale);
    modelScale = scale;

    // Center model
    model.position.sub(center.multiplyScalar(scale));
    
    // Initial rotation
    model.rotation.y = -Math.PI / 6; // -30 degrees
  },
  
  // Progress callback
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  
  // Error callback
  function (error) {
    console.error('Error loading model:', error);
  }
);

// Mouse event handlers
function onMouseDown(event) {
  isMouseDown = true;
  isRightMouseDown = event.buttons === 3;
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
}

function onMouseUp() {
  isMouseDown = false;
  isRightMouseDown = false;
}

function onMouseMove(event) {
  if (!isMouseDown) return;

  const deltaX = event.clientX - lastMouseX;
  const deltaY = event.clientY - lastMouseY;

  if (isRightMouseDown) {
    // Pan model
    modelContainer.position.x += deltaX * 0.005;
    modelContainer.position.y -= deltaY * 0.005;
  } else {
    // Rotate model
    modelContainer.rotation.y += deltaX * 0.01;
    modelContainer.rotation.x += deltaY * 0.005;
    
    // Clamp vertical rotation
    modelContainer.rotation.x = Math.min(Math.max(-Math.PI / 2, modelContainer.rotation.x), Math.PI / 2);
  }

  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
}

function onWheel(event) {
  // Zoom with mouse wheel
  modelScale -= event.deltaY * 0.001;
  modelScale = Math.min(Math.max(0.8, modelScale), 2.0);
  modelContainer.scale.setScalar(modelScale);
}

// Window resize handler
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Add event listeners
document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mouseup', onMouseUp);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('wheel', onWheel);
window.addEventListener('resize', onWindowResize);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();