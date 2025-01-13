import { TransformControls } from 'three/examples/jsm/Addons.js';
import { orbitControls } from '@/renderer';
import {
  Sandbox,
  PhysicalEntity,
  Field,
  Charge,
  protonModel,
  electronModel,
} from '@/sandbox';
import * as THREE from 'three';

const moveButton = document.getElementById('move')!;
const rotateButton = document.getElementById('rotate')!;
const chargeButton = document.getElementById('charge')!;

export class SelectManager {
  private sandbox: Sandbox;
  private selectedEntity: PhysicalEntity | Field | null;
  private transformControls: TransformControls;
  private scene: THREE.Scene;
  private mode: 'translate' | 'rotate' | null;
  private rotationObject: THREE.Object3D | null;

  constructor(
    sandbox: Sandbox,
    transformControls: TransformControls,
    scene: THREE.Scene
  ) {
    this.sandbox = sandbox;
    this.transformControls = transformControls;
    this.scene = scene;
    this.selectedEntity = null;
    this.mode = null;
    this.rotationObject = null;

    moveButton.addEventListener('click', () => this.updateMode('translate'));
    rotateButton.addEventListener('click', () => this.updateMode('rotate'));

    this.transformControls.addEventListener(
      'change',
      this.onTransformChange.bind(this)
    );

    this.updateButtons();
  }

  private onTransformChange() {
    if (this.selectedEntity instanceof Field && this.rotationObject) {
      const direction = new THREE.Vector3();
      this.rotationObject.getWorldDirection(direction);
      direction.normalize().multiplyScalar(this.selectedEntity.value.length());
      this.selectedEntity.value.copy(direction);
    } else if (this.selectedEntity instanceof Charge && this.rotationObject) {
      const direction = new THREE.Vector3();
      this.rotationObject.getWorldDirection(direction);
      direction
        .normalize()
        .multiplyScalar(this.selectedEntity.velocity.length());
      this.selectedEntity.velocity.copy(direction);
    }
  }

  onIntersects(intersects: THREE.Intersection[]) {
    if (intersects.length > 0) {
      let selectedNewEntity = false;
      for (const intersect of intersects) {
        if (selectedNewEntity) break;
        selectedNewEntity = selectedNewEntity || this.selectObject(intersect);
      }
    }

    this.updateButtons();
  }

  private selectObject(intersect: THREE.Intersection) {
    const entity = this.sandbox.entities.find(
      (entity) => entity.object === intersect.object
    );

    if (entity && entity !== this.selectedEntity) {
      this.selectedEntity = entity;
      this.transformControls.attach(entity.object);
      this.scene.add(this.transformControls.getHelper());
      this.updateMode('translate');
      return true;
    } else if (entity === this.selectedEntity) {
      return true;
    }

    return false;
  }

  selectField(field: Field) {
    if (field !== this.selectedEntity) {
      this.selectedEntity = field;
      this.rotationObject = new THREE.Object3D();
      this.rotationObject.position.copy(orbitControls.target);
      this.rotationObject.lookAt(field.value);
      this.scene.add(this.rotationObject);

      const arrowHelper = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        5,
        0xffff00
      );
      this.rotationObject.add(arrowHelper);

      this.transformControls.attach(this.rotationObject);
      this.scene.add(this.transformControls.getHelper());
      this.updateMode('rotate');
      return true;
    }
    return false;
  }

  deselect() {
    if (this.selectedEntity) {
      this.transformControls.detach();
      this.scene.remove(this.transformControls.getHelper());
      if (this.rotationObject) {
        this.scene.remove(this.rotationObject);
        this.rotationObject = null;
      }
    }
    this.selectedEntity = null;
    this.mode = null;
    this.updateButtons();
  }

  updateMode(mode: 'translate' | 'rotate' | null) {
    if (mode) {
      if (mode === this.mode) {
        mode = null;
        this.deselect();
        return;
      }
      this.transformControls.setMode(mode);

      if (mode === 'rotate') {
        if (this.selectedEntity instanceof Charge) {
          this.rotationObject = new THREE.Object3D();
          this.rotationObject.position.copy(
            this.selectedEntity.object.position
          );
          this.rotationObject.lookAt(
            this.selectedEntity.velocity
              .clone()
              .normalize()
              .add(this.selectedEntity.object.position)
          );
          this.scene.add(this.rotationObject);
          this.transformControls.attach(this.rotationObject);
        }
      }
    } else {
      this.deselect();
    }

    this.mode = mode;
    this.updateButtons();
  }

  private updateButton(
    button: HTMLElement,
    mode: 'disabled' | 'enabled' | 'selected' | 'loading'
  ) {
    button.classList.remove(
      'button-disabled',
      'button-enabled',
      'button-selected',
      'button-loading'
    );
    button.classList.add(`button-${mode}`);
  }

  updateButtons() {
    if (this.selectedEntity instanceof Field) {
      this.updateButton(moveButton, 'disabled');
      this.updateButton(rotateButton, 'enabled');
    } else if (this.selectedEntity instanceof Charge) {
      if (this.mode) {
        if (this.mode === 'translate') {
          this.updateButton(moveButton, 'selected');
          if (this.selectedEntity.velocity.length() !== 0) {
            this.updateButton(rotateButton, 'enabled');
          } else {
            this.updateButton(rotateButton, 'disabled');
          }
        } else if (this.mode === 'rotate') {
          this.updateButton(rotateButton, 'selected');
          this.updateButton(moveButton, 'enabled');
        }
      } else {
        this.updateButton(moveButton, 'enabled');
        if (this.selectedEntity.velocity.length() !== 0) {
          this.updateButton(rotateButton, 'enabled');
        } else {
          this.updateButton(rotateButton, 'disabled');
        }
      }
    } else {
      this.updateButton(moveButton, 'disabled');
      this.updateButton(rotateButton, 'disabled');
    }

    if (protonModel && electronModel) {
      this.updateButton(chargeButton, 'enabled');
    } else {
      this.updateButton(chargeButton, 'loading');
    }
  }

  onChargeLoad() {
    this.updateButtons();
  }
}
