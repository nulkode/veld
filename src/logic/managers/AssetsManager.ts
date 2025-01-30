import { EventEmitter } from '@/logic/managers/EventManager';
import { t } from '@/ui';
import {
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry
} from 'three';

function createTextSphere(
  text: string,
  sphereColor: string,
  textColor = '#ffffff',
  size = 1
) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = 1024;
  canvas.height = 512;

  context.fillStyle = sphereColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = '400px Arial';
  context.fillStyle = textColor;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new CanvasTexture(canvas);

  const geometry = new SphereGeometry(size, 32, 32);
  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true
  });

  return new Mesh(geometry, material);
}

export class AssetsManager extends EventEmitter {
  loadingState = {
    scripts: true,
    models: true
  };
  models: {
    proton: Object3D | null;
    electron: Object3D | null;
  } = {
    proton: null,
    electron: null
  };

  constructor() {
    super();

    this.models.electron = createTextSphere('-', '#0000ff', '#ffffff', 0.5);
    this.models.proton = createTextSphere('+', '#ff0000', '#ffffff', 0.5);
    this.checkModelsLoaded();

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
        Object.values(this.models).filter(model => model !== null).length
      }/${Object.keys(this.models).length})`;
    }

    return t('loadingScreen.loading');
  }
}
