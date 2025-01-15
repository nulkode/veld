import { EventEmitter } from '@/managers/EventManager';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssetsManager extends EventEmitter {
  loadingState = {
    scripts: true,
    models: true
  };
  models: {
    proton: THREE.Object3D | null;
    electron: THREE.Object3D | null;
  } = {
    proton: null,
    electron: null
  };

  constructor() {
    super();

    const loader = new GLTFLoader();

    loader.load('./models/proton.glb', (gltf) => {
      this.models.proton = gltf.scene.children[0];
      this.emit('modelLoaded', 'proton');
      this.emit('loadingStateChanged');
    });

    loader.load('./models/electron.glb', (gltf) => {
      this.models.electron = gltf.scene.children[0];
      this.checkModelsLoaded();
    });

    window.addEventListener('load', () => {
      this.loadingState.scripts = false;
      this.emit('loadingStateChanged');
    });
  }

  private checkModelsLoaded() {
    if (this.models.proton !== null && this.models.electron !== null) {
      this.loadingState.models = false;
    }

    this.emit('loadingStateChanged');
  }

  getLoadingString() {
    if (this.loadingState.scripts) {
      return 'Loading scripts...';
    }

    if (this.loadingState.models) {
      return `Loading models... (${
        Object.values(this.models).filter((model) => model !== null).length
      }/${Object.keys(this.models).length})`;
    }

    return 'Loading...';
  }
}
