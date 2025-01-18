import { EventEmitter } from '@/logic/managers/EventManager';
import { t } from '@/ui';
import { Object3D } from 'three';

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

    this.models.electron = new Object3D();
    this.models.proton = new Object3D();
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
        Object.values(this.models).filter((model) => model !== null).length
      }/${Object.keys(this.models).length})`;
    }

    return t('loadingScreen.loading');
  }
}
