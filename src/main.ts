import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';

let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

function init() {
  const scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xf0f0f0);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  const size = 300;
  const divisions = 50;
  const gridHelper = new THREE.GridHelper(size, divisions);
  gridHelper.material.color.setHex(0x404040);
  gridHelper.material.opacity = 0.6;
  gridHelper.material.transparent = true;
  
  const grid = gridHelper.clone();
  scene.add(grid);

  camera.position.z = 5;

  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

function rotateCameraToPosition(targetX: number, targetY: number, targetZ: number) {
  gsap.to(camera.position, {
    x: targetX,
    y: targetY,
    z: targetZ,
    duration: 1,
    ease: "power2.inOut",
    onUpdate: () => {
      camera.lookAt(controls.target);
      controls.update();
    }
  });
}

function rotateCameraToTopView() {
  rotateCameraToPosition(0, 5, 0);
}

function rotateCameraToFrontView() {
  rotateCameraToPosition(0, 0, 5);
}

function rotateCameraToSideView() {
  rotateCameraToPosition(5, 0, 0);
}

document.getElementById('top-face')?.addEventListener('click', rotateCameraToTopView);
document.getElementById('front-face')?.addEventListener('click', rotateCameraToFrontView);
document.getElementById('side-face')?.addEventListener('click', rotateCameraToSideView);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
