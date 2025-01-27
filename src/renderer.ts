import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { Sandbox } from '@/logic/physics/sandbox';
import { selectManager } from '@/ui';
import { GridManager } from '@/logic/managers/GridsManager';
import {
  PerspectiveCamera,
  WebGLRenderer,
  Scene,
  Fog,
  AmbientLight,
  Raycaster,
  Vector2
} from 'three';
import { ViewportGizmo } from 'three-viewport-gizmo';
import { FollowManager } from '@/logic/managers/FollowManager';

let camera: PerspectiveCamera;
let renderer: WebGLRenderer;
let orbitControls: OrbitControls;
let transformControls: TransformControls;
let sandbox: Sandbox;
let scene: Scene;
let gizmo: ViewportGizmo;
let followManager: FollowManager;

function init() {
  scene = new Scene();
  scene.fog = new Fog(0xd0d0d0, 100, 500);
  camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  renderer = new WebGLRenderer({ antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0xd0d0d0);
  document.body.appendChild(renderer.domElement);

  orbitControls = new OrbitControls(camera, renderer.domElement);
  transformControls = new TransformControls(camera, renderer.domElement);

  transformControls.addEventListener('dragging-changed', function (event) {
    orbitControls.enabled = !event.value;
  });

  gizmo = new ViewportGizmo(camera, renderer);
  gizmo.attachControls(orbitControls);

  sandbox = new Sandbox(scene);
  sandbox.updateVisuals(camera.position);

  const gridManager = new GridManager(scene);

  followManager = new FollowManager();

  const light = new AmbientLight(0xffffff, 1);
  scene.add(light);

  camera.position.set(40, 40, 40);
  camera.lookAt(0, 0, 0);

  sandbox.updateVisuals(camera.position);

  const raycaster = new Raycaster();
  const mouse = new Vector2();

  function onMouseClick(event: MouseEvent) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (event.target instanceof Element) {
      const target = event.target as Element;
      if (target.closest('.ui')) {
        return;
      }
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    selectManager.onIntersects(intersects);
  }

  window.addEventListener('click', onMouseClick, false);

  let lastTime = 0;

  function animate(time: number) {
    requestAnimationFrame(animate);
    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;

    sandbox.update(deltaTime);
    gridManager.update(camera.position);
    followManager.update();
    orbitControls.update();
    sandbox.updateVisuals(camera.position);
    renderer.render(scene, camera);
    gizmo.render();
  }

  animate(0);
}

init();

export {
  camera,
  renderer,
  sandbox,
  transformControls,
  orbitControls,
  followManager,
  gizmo,
  scene
};
