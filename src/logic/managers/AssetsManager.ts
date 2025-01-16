import { EventEmitter } from '@/logic/managers/EventManager';
import { t } from '@/ui';
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
      this.checkModelsLoaded();
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
      return t('loadingScreen.loadingScripts');
    }

    if (this.loadingState.models) {
      return `${t('loadingScreen.loadingModels')} (${
        Object.values(this.models).filter((model) => model !== null).length
      }/${Object.keys(this.models).length})`;
    }

    return t('loadingScreen.loading');
  }
}
