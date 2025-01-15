import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { selectManager } from '@/ui';
import { EventEmitter } from '@/ui/managers/EventManager';
import { camera } from './renderer';

const k = 8.9875517873681764e9; // N m^2 / C^2

export let protonModel: THREE.Object3D | null = null;
export let electronModel: THREE.Object3D | null = null;

const loader = new GLTFLoader();

loader.load('./models/proton.glb', (gltf) => {
  protonModel = gltf.scene.children[0];
  selectManager.onChargeLoad();
});

loader.load('./models/electron.glb', (gltf) => {
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

  abstract updateVisuals(sandbox: Sandbox): void;
  abstract deleteVisuals(): void;
  abstract toJSON(): any;
  static fromJSON(_data: any): PhysicalEntity {
    throw new Error('Method not implemented.');
  }
}

export class Charge extends PhysicalEntity {
  value: number;
  velocity: THREE.Vector3;
  mass: number = 1; // kg
  showVelocity: boolean = false;
  showAcceleration: boolean = false;
  visuals: THREE.Object3D[] = [];

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
    } else {
      this.value = charge;
    }

    // TODO: scale it based on the charge
  }

  setShowVelocity(show: boolean) {
    this.showVelocity = show;
  }

  setShowAcceleration(show: boolean) {
    this.showAcceleration = show;
  }

  updateVisuals(sandbox: Sandbox) {
    if (this.visuals.length !== 0) {
      this.object.remove(...this.visuals);
      this.visuals = [];
    }

    if (this.showVelocity && this.velocity.length() > 0) {
      const velocityArrow = new THREE.ArrowHelper(
        this.velocity.clone().normalize(),
        new THREE.Vector3(0, 0, 0),
        5,
        0xff0000
      );
      this.visuals.push(velocityArrow);
    }

    if (this.showAcceleration) {
      const acceleration = this.calculateAcceleration(sandbox);
      if (acceleration.length() === 0) return;
      const accelerationArrow = new THREE.ArrowHelper(
        acceleration.clone().normalize(),
        new THREE.Vector3(0, 0, 0),
        4,
        0x00ff00,
        0.5,
        0.3
      );
      this.visuals.push(accelerationArrow);
    }

    if (this.visuals.length === 0) return;
    this.object.add(...this.visuals);
  }

  deleteVisuals() {
    this.object.remove(...this.visuals);
    this.visuals = [];
  }

  calculateAcceleration(sandbox: Sandbox): THREE.Vector3 {
    return this.calculateForce(
      sandbox.context,
      sandbox.fields,
      ...sandbox.entities.filter((e) => e instanceof Charge)
    ).divideScalar(this.mass);
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

  toJSON() {
    return {
      uuid: this.uuid,
      value: this.value,
      velocity: this.velocity.toArray(),
      mass: this.mass,
      position: this.object.position.toArray()
    };
  }

  static fromJSON(data: any) {
    const charge = new Charge(
      data.value,
      new THREE.Vector3().fromArray(data.velocity),
      new THREE.Vector3().fromArray(data.position),
      data.mass
    );
    return charge;
  }
}

export abstract class Field {
  readonly uuid = THREE.MathUtils.generateUUID();
  value: THREE.Vector3;
  visible: boolean = true;
  variation: THREE.Vector3;
  arrowColor: number = 0x0000ff;
  protected scene: THREE.Scene;
  protected visuals: THREE.ArrowHelper[] = [];

  constructor(
    scene: THREE.Scene,
    field: THREE.Vector3,
    show: boolean = true,
    variation?: THREE.Vector3,
    arrowColor?: number
  ) {
    this.scene = scene;
    this.value = field;
    this.visible = show;
    this.variation =
      variation ??
      new THREE.Vector3(
        Math.random() * 3,
        Math.random() * 3,
        Math.random() * 3
      );
    if (arrowColor) {
      this.arrowColor = arrowColor;
    }
  }

  changeField(newField: THREE.Vector3) {
    this.value = newField;
  }

  // TODO: Research on how to optimize this
  updateVisuals(cameraPosition: THREE.Vector3) {
    this.scene.remove(...this.visuals);
    this.visuals = [];

    const distance = 30;
    const maxDistance = 100;
    const minDistance = 10;
    const maxPointsPerAxis = Math.floor(maxDistance / distance);

    if (!this.visible) return;

    const direction = this.value.clone().normalize();

    const baseX =
      Math.floor(cameraPosition.x / distance) * distance + this.variation.x;
    const baseY =
      Math.floor(cameraPosition.y / distance) * distance + this.variation.y;
    const baseZ =
      Math.floor(cameraPosition.z / distance) * distance + this.variation.z;

    for (let x = -maxPointsPerAxis; x < maxPointsPerAxis; x++) {
      const pointX = baseX + x * distance;
      for (let y = -maxPointsPerAxis; y < maxPointsPerAxis; y++) {
        const pointY = baseY + y * distance;
        for (let z = -maxPointsPerAxis; z < maxPointsPerAxis; z++) {
          const pointZ = baseZ + z * distance;
          const point = new THREE.Vector3(pointX, pointY, pointZ);

          const distanceToCamera = point.distanceTo(cameraPosition);
          if (distanceToCamera > maxDistance || distanceToCamera < minDistance)
            continue;

          this.visuals.push(
            new THREE.ArrowHelper(direction, point, 5, this.arrowColor)
          );
        }
      }
    }

    this.scene.add(...this.visuals);
  }

  deleteVisuals() {
    this.scene.remove(...this.visuals);
    this.visuals = [];
  }

  abstract calculateForce(charge: Charge): THREE.Vector3;

  abstract toJSON(): any;
  static fromJSON(_scene: THREE.Scene, _data: any): Field {
    throw new Error('Method not implemented.');
  }
}

export class ElectricField extends Field {
  constructor(
    scene: THREE.Scene,
    field: THREE.Vector3,
    show: boolean = true,
    variation?: THREE.Vector3,
    arrowColor?: number
  ) {
    super(scene, field, show, variation, arrowColor);
  }

  calculateForce(charge: Charge): THREE.Vector3 {
    return this.value.clone().multiplyScalar(charge.value);
  }

  toJSON() {
    return {
      type: 'ElectricField',
      uuid: this.uuid,
      value: this.value.toArray(),
      variation: this.variation.toArray(),
      arrowColor: this.arrowColor,
      show: this.visible
    };
  }

  static fromJSON(scene: THREE.Scene, data: any) {
    return new ElectricField(
      scene,
      new THREE.Vector3().fromArray(data.value),
      data.show,
      new THREE.Vector3().fromArray(data.variation),
      data.arrowColor
    );
  }
}

export class MagneticField extends Field {
  constructor(
    scene: THREE.Scene,
    field: THREE.Vector3,
    show: boolean = true,
    variation?: THREE.Vector3,
    arrowColor?: number
  ) {
    super(scene, field, show, variation, arrowColor);
  }

  calculateForce(charge: Charge): THREE.Vector3 {
    return this.value
      .clone()
      .cross(charge.velocity)
      .multiplyScalar(charge.value);
  }

  toJSON() {
    return {
      type: 'MagneticField',
      uuid: this.uuid,
      value: this.value.toArray(),
      variation: this.variation.toArray(),
      arrowColor: this.arrowColor,
      show: this.visible
    };
  }

  static fromJSON(scene: THREE.Scene, data: any) {
    return new MagneticField(
      scene,
      new THREE.Vector3().fromArray(data.value),
      data.show,
      new THREE.Vector3().fromArray(data.variation),
      data.arrowColor
    );
  }
}

export enum SandboxStatus {
  PLAYING,
  PAUSED
}

export enum SandboxEvent {
  PLAY,
  PAUSE,
  RESET
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
}
