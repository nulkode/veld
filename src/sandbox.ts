import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { selectManager } from './ui';
import { EventEmitter } from './utils';

const k = 8.9875517873681764e9; // N m^2 / C^2

export let protonModel: THREE.Object3D | null = null;
export let electronModel: THREE.Object3D | null = null;

const loader = new GLTFLoader();

loader.load('./proton.glb', (gltf) => {
  protonModel = gltf.scene.children[0];
  selectManager.onChargeLoad();
});

loader.load('./electron.glb', (gltf) => {
  electronModel = gltf.scene.children[0];
  selectManager.onChargeLoad();
});

export abstract class PhysicalEntity {
  readonly uuid = THREE.MathUtils.generateUUID();
  object: THREE.Object3D;

  constructor(object: THREE.Object3D) {
    this.object = object;
  }

  abstract calculateForce(
    context: SandboxContext,
    _fields: Field[],
    ..._charges: Charge[]
  ): THREE.Vector3;
}

export class Charge extends PhysicalEntity {
  value: number;
  velocity: THREE.Vector3;
  mass: number = 1; // kg
  showVelocity: boolean = false;
  velocityArrow: THREE.ArrowHelper | null = null;
  showAcceleration: boolean = false;
  accelerationArrow: THREE.ArrowHelper | null = null;

  constructor(
    charge: number,
    velocity: THREE.Vector3,
    position: THREE.Vector3,
    mass: number = 1
  ) {
    if (!protonModel || !electronModel) {
      throw new Error('Models not loaded');
    }
    const object = charge < 0 ? electronModel.clone() : protonModel.clone();
    object.position.copy(position);

    super(object);
    this.value = charge;
    this.velocity = velocity;
    this.mass = mass;
  }

  private replace3DObject(newObject: THREE.Object3D) {
    newObject.position.copy(this.object.position);
    newObject.rotation.copy(this.object.rotation);
    this.object.parent?.add(newObject);
    this.object.parent?.remove(this.object);
    this.object = newObject;
  }

  setCharge(charge: number) {
    if (!protonModel || !electronModel) {
      throw new Error('Models not loaded');
    }
    if (charge < 0 && this.value >= 0) {
      this.value = charge;
      this.replace3DObject(electronModel.clone());
    } else if (charge > 0 && this.value <= 0) {
      this.value = charge;
      this.replace3DObject(protonModel.clone());
    }

    // TODO: scale it based on the charge
  }

  setShowVelocity(show: boolean) {
    this.showVelocity = show;
    if (show && !this.velocityArrow) {
      this.velocityArrow = new THREE.ArrowHelper(
        this.velocity.clone().normalize(),
        this.object.position,
        5,
        0xff0000
      );
      this.object.add(this.velocityArrow);
    } else if (!show && this.velocityArrow) {
      this.object.remove(this.velocityArrow);
      this.velocityArrow = null;
    } else if (show && this.velocityArrow) {
      this.velocityArrow.setDirection(this.velocity.clone().normalize());
      this.velocityArrow.setLength(this.velocity.length());
    }
  }

  updateVelocityArrow() {
    if (this.velocityArrow) this.object.remove(this.velocityArrow);
    if (this.showVelocity && this.velocity.length() > 0) {
      this.velocityArrow = new THREE.ArrowHelper(
        this.velocity.clone().normalize(),
        new THREE.Vector3(0, 0, 0),
        5,
        0xff0000
      );
      this.object.add(this.velocityArrow);
    }
  }

  setShowAcceleration(show: boolean, sandbox: Sandbox) {
    this.showAcceleration = show;
    if (show && !this.accelerationArrow) {
      const acceleration = this.calculateAcceleration(sandbox);
      if (acceleration.length() === 0) return;
      this.accelerationArrow = new THREE.ArrowHelper(
        acceleration.clone().normalize(),
        new THREE.Vector3(0, 0, 0),
        4,
        0x00ff00,
        0.5, // headLength
        0.3 // headWidth
      );
      this.object.add(this.accelerationArrow);
    } else if (!show && this.accelerationArrow) {
      this.object.remove(this.accelerationArrow);
      this.accelerationArrow = null;
    } else if (show && this.accelerationArrow) {
      const acceleration = this.calculateAcceleration(sandbox);
      if (acceleration.length() === 0) return;
      if (this.accelerationArrow) this.object.remove(this.accelerationArrow);
      this.accelerationArrow = new THREE.ArrowHelper(
        acceleration.clone().normalize(),
        new THREE.Vector3(0, 0, 0),
        4,
        0x00ff00,
        0.5, // headLength
        0.3 // headWidth
      );
    }
  }

  calculateAcceleration(sandbox: Sandbox): THREE.Vector3 {
    return this.calculateForce(
      sandbox.context,
      sandbox.fields,
      ...sandbox.entities.filter((e) => e instanceof Charge)
    ).divideScalar(this.mass);
  }

  updateAccelerationArrow(sandbox: Sandbox) {
    if (this.accelerationArrow) this.object.remove(this.accelerationArrow);
    if (this.showAcceleration) {
      const acceleration = this.calculateAcceleration(sandbox);
      if (acceleration.length() === 0) return;
      this.accelerationArrow = new THREE.ArrowHelper(
        acceleration.clone().normalize(),
        new THREE.Vector3(0, 0, 0),
        4,
        0x00ff00,
        0.5, // headLength
        0.3 // headWidth
      );
      this.object.add(this.accelerationArrow);
    }
  }

  calculateForce(
    context: SandboxContext,
    fields: Field[],
    ...charges: Charge[]
  ) {
    let force = new THREE.Vector3(0, 0, 0);

    for (const field of fields) {
      force.add(field.calculateForce(this));
    }

    for (const charge of charges) {
      if (charge === this) continue;

      const distance = this.object.position.distanceTo(charge.object.position);
      const direction = charge.object.position
        .clone()
        .sub(this.object.position)
        .multiplyScalar(-1);

      force.add(
        direction
          .normalize()
          .multiplyScalar((k * this.value * charge.value) / distance ** 2)
      );
    }

    if (!context.ignoreGravity) {
      force.add(new THREE.Vector3(0, -9.8 * this.mass, 0));
    }

    return force;
  }
}

export abstract class Field {
  readonly uuid = THREE.MathUtils.generateUUID();
  value: THREE.Vector3;
  visible: boolean = true;
  variation: THREE.Vector3;

  constructor(field: THREE.Vector3, show: boolean = true) {
    this.value = field;
    this.visible = show;
    this.variation = new THREE.Vector3(
      Math.random() * 3,
      Math.random() * 3,
      Math.random() * 3
    );
  }

  changeField(newField: THREE.Vector3) {
    this.value = newField;
  }

  abstract calculateForce(charge: Charge): THREE.Vector3;
}

export class ElectricField extends Field {
  constructor(field: THREE.Vector3) {
    super(field);
  }

  calculateForce(charge: Charge): THREE.Vector3 {
    return this.value.clone().multiplyScalar(charge.value);
  }
}

export class MagneticField extends Field {
  constructor(field: THREE.Vector3) {
    super(field);
  }

  calculateForce(charge: Charge): THREE.Vector3 {
    return this.value
      .clone()
      .cross(charge.velocity)
      .multiplyScalar(charge.value);
  }
}

export enum SandboxStatus {
  PLAYING,
  PAUSED,
}

export enum SandboxEvent {
  PLAY,
  PAUSE,
  RESET,
}

interface SandboxContext {
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
    ignoreGravity: true,
  };

  private fieldsObjects: THREE.Object3D[];

  constructor(scene: THREE.Scene) {
    super();
    this.scene = scene;
    this.entities = [];
    this.fields = [];
    this.status = SandboxStatus.PAUSED;
    this.fieldsObjects = [];
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

  updateFieldsObjects(cameraPosition: THREE.Vector3) {
    this.scene.remove(...this.fieldsObjects);
    this.fieldsObjects = [];

    const divisions = 15;
    const size = 300;
    const distance = size / divisions;
    const maxDistance = 50;
    const minDistance = 10;

    for (const field of this.fields) {
      if (!field.visible) continue;

      const direction = field.value.clone().normalize();

      for (let i = 0; i < divisions; i++) {
        const x = -size / 2 + i * distance;
        const dx = Math.abs(cameraPosition.x - x);
        if (dx > maxDistance) {
          continue;
        }
        for (let j = 0; j < divisions; j++) {
          const y = -size / 2 + j * distance;
          const dy = Math.abs(cameraPosition.y - y);
          if (dy > maxDistance) {
            continue;
          }
          for (let k = 0; k < divisions; k++) {
            const x = -size / 2 + i * distance;
            const z = -size / 2 + k * distance;
            const point = new THREE.Vector3(x, y, z).add(field.variation);

            const dist = cameraPosition.distanceTo(point);
            if (dist < minDistance || dist > maxDistance) continue;

            this.fieldsObjects.push(
              new THREE.ArrowHelper(direction, point, 5, 0x0000ff)
            );
          }
        }
      }
    }

    for (const entity of this.entities) {
      if (
        entity instanceof Charge &&
        entity.showVelocity &&
        entity.velocityArrow
      ) {
        entity.updateVelocityArrow();
      }
    }

    if (this.fieldsObjects.length !== 0) {
      this.scene.add(...this.fieldsObjects);
    }
  }

  play() {
    selectManager.deselect();
    this.status = SandboxStatus.PLAYING;
  }

  pause() {
    selectManager.deselect();
    this.status = SandboxStatus.PAUSED;
  }

  reset() {
    throw new Error('Method not implemented.');
    // TODO: reset all entities to their initial positions
  }

  deleteEntity(entity: PhysicalEntity) {
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

        // Update arrows
        entity.updateVelocityArrow();
        entity.updateAccelerationArrow(this);
      }
    }
  }

  addField(field: Field) {
    this.fields.push(field);
    this.emit('fieldAdded', field);
  }

  removeField(field: Field) {
    this.fields = this.fields.filter((f) => f !== field);
    this.emit('fieldRemoved', field);
  }
}
