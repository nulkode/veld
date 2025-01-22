import { selectManager } from '@/ui';
import { EventEmitter } from '@/logic/managers/EventManager';
import { camera } from '@/renderer';
import { Field } from '@/logic/physics/fields/Field';
import { Charge } from '@/logic/physics/entities/Charge';
import { ElectricField } from '@/logic/physics/fields/ElectricField';
import { MagneticField } from '@/logic/physics/fields/MagneticField';
import { PhysicalEntity } from '@/logic/physics/entities/PhysicalEntity';
import { Scene, Vector3 } from 'three';

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
  scene: Scene;
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

  constructor(scene: Scene) {
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

  updateVisuals(cameraPosition: Vector3) {
    for (const field of this.fields) {
      field.updateVisuals(cameraPosition);
    }

    for (const entity of this.entities) {
      entity.updateVisuals();
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
      Charge.fromJSON(this, data)
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
    const sandboxDelta = deltaTime / this.context.timeUnit;

    for (const entity of this.entities) {
      const forces = entity.calculateForce();
      const acceleration = forces.clone().divideScalar(entity.mass);

      if (this.status === SandboxStatus.PLAYING) {
        entity.velocity.add(acceleration.clone().multiplyScalar(sandboxDelta));
        entity.object.position.add(
          entity.velocity
            .clone()
            .multiplyScalar(sandboxDelta)
            .multiplyScalar(this.context.distanceUnit)
        );
      }

      this.emit('entityUpdated', entity);

      if (entity.object.position.length() > 1e5) {
        this.deleteEntity(entity);
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

  addCharge(target: Vector3) {
    this.appendEntity(new Charge(
      this,
      {
        position: target,
        charge: -1,
        mass: 1,
        velocity: new Vector3(0, 0, 0)
      }
    ));
  }

  addElectricField() {
    this.addField(new ElectricField(this.scene, new Vector3(0, 1, 0)));
  }

  addMagneticField() {
    this.addField(new MagneticField(this.scene, new Vector3(0, 1, 0)));
  }

  new() {
    this.status = SandboxStatus.PAUSED;
    selectManager.deselect();

    for (const entity of this.entities) {
      this.deleteEntity(entity);
    }

    for (const field of this.fields) {
      this.deleteField(field);
    }

    this.initialState = {
      entities: [],
      fields: [],
      sandboxContext: this.context
    };

    this.emit('reset');
  }
}
