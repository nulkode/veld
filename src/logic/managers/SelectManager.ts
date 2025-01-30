import { orbitControls, sandbox, scene, transformControls } from '@/renderer';
import { Charge } from '@/logic/physics/entities/Charge';
import { Field } from '@/logic/physics/fields/Field';
import { PhysicalEntity } from '@/logic/physics/entities/PhysicalEntity';
import { ToolbarButton } from '@/ui/components/overlay/Toolbar';
import { EventEmitter } from '@/logic/managers/EventManager';
import { ArrowHelper, Intersection, Object3D, Vector3 } from 'three';

export class SelectManager extends EventEmitter {
  mode: 'translate' | 'rotate' | null;
  private selectedEntity: PhysicalEntity | Field | null;
  private rotationObject: Object3D | null;

  constructor() {
    super();
    this.selectedEntity = null;
    this.mode = null;
    this.rotationObject = null;

    transformControls.addEventListener(
      'change',
      this.onTransformChange.bind(this)
    );
    sandbox.on('entityRemoved', this.onEntityRemoved.bind(this));
    sandbox.on('fieldRemoved', this.onFieldRemoved.bind(this));

    this.updateButtons();
  }

  private onTransformChange() {
    if (this.selectedEntity instanceof Field && this.rotationObject) {
      const direction = new Vector3();
      this.rotationObject.getWorldDirection(direction);
      direction.normalize().multiplyScalar(this.selectedEntity.value.length());
      this.selectedEntity.value.copy(direction);
    } else if (this.selectedEntity instanceof Charge && this.rotationObject) {
      const direction = new Vector3();
      this.rotationObject.getWorldDirection(direction);
      direction
        .normalize()
        .multiplyScalar(this.selectedEntity.velocity.length());
      this.selectedEntity.velocity.copy(direction);
    }
  }

  amISelected(entity: PhysicalEntity | Field) {
    return entity === this.selectedEntity;
  }

  onIntersects(intersects: Intersection[]) {
    if (intersects.length > 0) {
      let selectedNewEntity = false;
      for (const intersect of intersects) {
        if (selectedNewEntity) break;
        selectedNewEntity = selectedNewEntity || this.selectObject(intersect);
      }
    }

    this.updateButtons();
  }

  private selectObject(intersect: Intersection) {
    const entity = sandbox.entities.find(
      entity => entity.object === intersect.object
    );

    if (entity && entity !== this.selectedEntity) {
      this.selectedEntity = entity;
      transformControls.attach(entity.object);
      scene.add(transformControls.getHelper());
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
      this.rotationObject = new Object3D();
      this.rotationObject.position.copy(orbitControls.target);
      this.rotationObject.lookAt(field.value.clone().add(orbitControls.target));
      scene.add(this.rotationObject);

      const arrowHelper = new ArrowHelper(
        new Vector3(0, 0, 1),
        new Vector3(0, 0, 0),
        5,
        0xffff00
      );
      this.rotationObject.add(arrowHelper);

      transformControls.attach(this.rotationObject);
      scene.add(transformControls.getHelper());
      this.updateMode('rotate');
      return true;
    }
    return false;
  }

  deselect() {
    if (this.selectedEntity) {
      transformControls.detach();
      scene.remove(transformControls.getHelper());
      if (this.rotationObject) {
        scene.remove(this.rotationObject);
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
      transformControls.setMode(mode);

      if (mode === 'rotate') {
        if (this.selectedEntity instanceof Charge) {
          this.rotationObject = new Object3D();
          this.rotationObject.lookAt(
            this.selectedEntity.velocity.clone().normalize()
          );
          this.selectedEntity.object.add(this.rotationObject);
          transformControls.attach(this.rotationObject);
        }
      } else if (mode === 'translate') {
        if (this.rotationObject) {
          scene.remove(this.rotationObject);
          this.rotationObject = null;
        }

        if (this.selectedEntity instanceof Charge) {
          transformControls.attach(this.selectedEntity.object);
        }
      }
    } else {
      this.deselect();
    }

    this.mode = mode;
    this.updateButtons();
  }

  updateButtons() {
    if (this.selectedEntity instanceof Field) {
      this.emit('updateButtons', {
        [ToolbarButton.MOVE]: 'disabled',
        [ToolbarButton.ROTATE]: this.mode === 'rotate' ? 'selected' : 'enabled'
      });
    } else if (this.selectedEntity instanceof Charge) {
      if (this.mode) {
        if (this.mode === 'translate') {
          this.emit('updateButtons', {
            [ToolbarButton.MOVE]: 'selected',
            [ToolbarButton.ROTATE]:
              this.selectedEntity.velocity.length() !== 0
                ? 'enabled'
                : 'disabled'
          });
        } else if (this.mode === 'rotate') {
          this.emit('updateButtons', {
            [ToolbarButton.ROTATE]: 'selected',
            [ToolbarButton.MOVE]: 'enabled'
          });
        }
      } else {
        this.emit('updateButtons', {
          [ToolbarButton.MOVE]: 'enabled',
          [ToolbarButton.ROTATE]:
            this.selectedEntity.velocity.length() !== 0 ? 'enabled' : 'disabled'
        });
      }
    } else {
      this.emit('updateButtons', {
        [ToolbarButton.MOVE]: 'disabled',
        [ToolbarButton.ROTATE]: 'disabled'
      });
    }
  }

  private onEntityRemoved(entity: PhysicalEntity) {
    if (entity === this.selectedEntity) {
      this.deselect();
    }
  }

  private onFieldRemoved(field: Field) {
    if (field === this.selectedEntity) {
      this.deselect();
    }
  }
}
