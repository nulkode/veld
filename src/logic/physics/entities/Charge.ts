import { PhysicalEntity } from '@/logic/physics/entities/PhysicalEntity';
import { Sandbox, SandboxContext } from '@/logic/physics/sandbox';
import { Field } from '@/logic/physics/fields/Field';
import { assetsManager } from '@/ui';
import { Vector3, Object3D, ArrowHelper } from 'three';

const k = 8.9875517873681764e9; // N m^2 / C^2

export class Charge extends PhysicalEntity {
  value: number;
  velocity: Vector3;
  mass: number = 1; // kg
  showVelocity: boolean = false;
  showAcceleration: boolean = false;
  visuals: Object3D[] = [];

  constructor(
    charge: number,
    velocity: Vector3,
    position: Vector3,
    mass: number = 1
  ) {
    if (!assetsManager.models.proton || !assetsManager.models.electron) {
      throw new Error('Models not loaded');
    }
    const object =
      charge < 0
        ? assetsManager.models.electron.clone()
        : assetsManager.models.proton.clone();
    object.position.copy(position);

    super(object);
    this.value = charge;
    this.velocity = velocity;
    this.mass = mass;
  }

  private replace3DObject(newObject: Object3D) {
    newObject.position.copy(this.object.position);
    newObject.rotation.copy(this.object.rotation);
    this.object.parent?.add(newObject);
    this.object.parent?.remove(this.object);
    this.object = newObject;
  }

  setCharge(charge: number) {
    if (!assetsManager.models.proton || !assetsManager.models.electron) {
      throw new Error('Models not loaded');
    }
    if (charge < 0 && this.value >= 0) {
      this.value = charge;
      this.replace3DObject(assetsManager.models.electron.clone());
    } else if (charge > 0 && this.value <= 0) {
      this.value = charge;
      this.replace3DObject(assetsManager.models.proton.clone());
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
      const velocityArrow = new ArrowHelper(
        this.velocity.clone().normalize(),
        new Vector3(0, 0, 0),
        5,
        0xff0000
      );
      this.visuals.push(velocityArrow);
    }

    if (this.showAcceleration) {
      const acceleration = this.calculateAcceleration(sandbox);
      if (acceleration.length() === 0) return;
      const accelerationArrow = new ArrowHelper(
        acceleration.clone().normalize(),
        new Vector3(0, 0, 0),
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

  calculateAcceleration(sandbox: Sandbox): Vector3 {
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
    let force = new Vector3(0, 0, 0);

    for (const field of fields) {
      force.add(field.calculateForce(this));
    }

    for (const charge of charges) {
      if (charge === this) continue;

      const distance = this.object.position.distanceTo(charge.object.position) / context.distanceUnit;
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
      force.add(new Vector3(0, -9.8 * this.mass, 0));
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
      new Vector3().fromArray(data.velocity),
      new Vector3().fromArray(data.position),
      data.mass
    );
    return charge;
  }
}
