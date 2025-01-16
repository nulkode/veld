import * as THREE from 'three';
import { selectManager } from '@/ui';
import { EventEmitter } from '@/logic/managers/EventManager';
import { camera } from '@/renderer';
import { PhysicalEntity } from './entities/PhysicalEntity';
import { Field } from '@/logic/physics/fields/Field';
import { Charge } from '@/logic/physics/entities/Charge';
import { ElectricField } from '@/logic/physics/fields/ElectricField';
import { MagneticField } from '@/logic/physics/fields/MagneticField';

export enum SandboxStatus {
  PLAYING,
  PAUSED
}

export enum SandboxEvent {
  PLAY,
  PAUSE,
  RESET
}

export interface SandboxContext {
  timeUnit: number;
  distanceUnit: number;
  ignoreGravity: boolean;
}

export class Sandbox extends EventEmitter {
  scene: THREE.Scene;
  entities: PhysicalEntity[];
  fields: Field[];
  status: SandboxStatus;
  context: SandboxContext = {
    timeUnit: 1,
    distanceUnit: 1,
    ignoreGravity: true
  };
  initialState: {
    entities: any[];
    fields: any[];
    sandboxContext: SandboxContext;
  };

  constructor(scene: THREE.Scene) {
    super();
    this.scene = scene;
    this.entities = [];
    this.fields = [];
    this.status = SandboxStatus.PAUSED;
    this.initialState = {
      entities: [],
      fields: [],
      sandboxContext: this.context
    };
  }

  appendEntity(entity: PhysicalEntity) {
    this.entities.push(entity);
    this.scene.add(entity.object);
    this.emit('entityAdded', entity);
  }

  setDistanceUnit(unit: number) {
    for (const entity of this.entities) {
      entity.object.position.multiplyScalar(unit / this.context.distanceUnit);
    }
    this.context.distanceUnit = unit;
  }

  updateVisuals(cameraPosition: THREE.Vector3) {
    for (const field of this.fields) {
      field.updateVisuals(cameraPosition);
    }

    for (const entity of this.entities) {
      entity.updateVisuals(this);
    }
  }

  play() {
    selectManager.deselect();

    this.initialState = {
      entities: this.entities.map((e) => e.toJSON()),
      fields: this.fields.map((f) => f.toJSON()),
      sandboxContext: this.context
    };

    this.status = SandboxStatus.PLAYING;
  }

  pause() {
    selectManager.deselect();
    this.status = SandboxStatus.PAUSED;
  }

  reset() {
    selectManager.deselect();
    this.status = SandboxStatus.PAUSED;

    for (const entity of this.entities) {
      this.deleteEntity(entity);
    }
    const entities = this.initialState.entities.map((data: any) =>
      Charge.fromJSON(data)
    );

    for (const entity of entities) {
      this.appendEntity(entity);
    }

    for (const field of this.fields) {
      this.deleteField(field);
    }

    const fields = this.initialState.fields.map((data: any) => {
      if (data.type === 'ElectricField') {
        return ElectricField.fromJSON(this.scene, data);
      } else if (data.type === 'MagneticField') {
        return MagneticField.fromJSON(this.scene, data);
      } else {
        throw new Error('Invalid field type');
      }
    });

    for (const field of fields) {
      this.addField(field);
    }

    this.context = this.initialState.sandboxContext;

    this.emit('reset');
  }

  deleteEntity(entity: PhysicalEntity) {
    entity.deleteVisuals();
    this.entities = this.entities.filter((e) => e !== entity);
    this.scene.remove(entity.object);
    this.emit('entityRemoved', entity);
  }

  update(deltaTime: number) {
    for (const entity of this.entities) {
      if (entity instanceof Charge) {
        const charges = this.entities.filter((e) => e instanceof Charge);
        const forces = entity.calculateForce(
          this.context,
          this.fields,
          ...charges
        );
        const acceleration = forces
          .clone()
          .divideScalar(entity.mass)
          .divideScalar(this.context.timeUnit ** 2)
          .divideScalar(this.context.distanceUnit);

        if (this.status === SandboxStatus.PLAYING) {
          entity.velocity.add(acceleration.clone().multiplyScalar(deltaTime));
          entity.object.position.add(
            entity.velocity.clone().multiplyScalar(deltaTime)
          );
        }

        this.emit('entityUpdated', entity);

        if (entity.object.position.length() > 1e5) {
          this.deleteEntity(entity);
        }
      }
    }

    this.updateVisuals(camera.position);
  }

  addField(field: Field) {
    this.fields.push(field);
    this.emit('fieldAdded', field);
  }

  deleteField(field: Field) {
    field.deleteVisuals();
    this.fields = this.fields.filter((f) => f !== field);
    this.emit('fieldRemoved', field);
  }

  addCharge(target: THREE.Vector3) {
    this.appendEntity(
      new Charge(-1, new THREE.Vector3(0, 0, 0), target)
    );
  }

  addElectricField() {
    this.addField(new ElectricField(this.scene, new THREE.Vector3(0, 1, 0)));
  }

  addMagneticField() {
    this.addField(new MagneticField(this.scene, new THREE.Vector3(0, 1, 0)));
  }

  new() {
    for (const entity of this.entities) {
      this.deleteEntity(entity);
    }

    for (const field of this.fields) {
      this.deleteField(field);
    }

    this.status = SandboxStatus.PAUSED;
    this.initialState = {
      entities: [],
      fields: [],
      sandboxContext: this.context
    };

    this.emit('reset');
  }
}
