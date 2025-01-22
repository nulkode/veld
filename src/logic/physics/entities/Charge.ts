import { PhysicalEntity } from '@/logic/physics/entities/PhysicalEntity';
import { Sandbox } from '@/logic/physics/sandbox';
import { assetsManager } from '@/ui';
import {
  Vector3,
  ArrowHelper,
  PlaneGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Group
} from 'three';
import { MagneticField } from '@/logic/physics/fields/MagneticField';

const k = 8.9875517873681764e9; // N m^2 / C^2

function createTransparentPlane(position: Vector3, orientation: Vector3) {
  const planeGeometry = new PlaneGeometry(
    orientation.length(),
    orientation.length()
  );

  const planeMaterial = new MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    side: DoubleSide
  });

  const plane = new Mesh(planeGeometry, planeMaterial);

  plane.position.copy(position);

  plane.lookAt(position.clone().add(orientation));

  return plane;
}

export class Charge extends PhysicalEntity {
  value: number;

  constructor(
    sandbox: Sandbox,
    {
      charge,
      velocity,
      position,
      mass
    }: {
      charge: number;
      velocity: Vector3;
      position: Vector3;
      mass: number;
    }
  ) {
    if (!assetsManager.models.proton || !assetsManager.models.electron) {
      throw new Error('Models not loaded');
    }

    const object =
      charge < 0
        ? assetsManager.models.electron.clone()
        : assetsManager.models.proton.clone();
    object.position.copy(position);

    super(sandbox, { object, velocity, mass });
    this.value = charge;
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

  updateVisuals() {
    this.cleanVisuals();

    this.renderAccelerationArrow();
    this.renderCrossProductPlaneAndVelocityArrow();
    this.renderTrajectory();

    if (this.visualsObjects.length !== 0) this.object.add(...this.visualsObjects);
  }

  renderCrossProductPlaneAndVelocityArrow() {
    const showMagneticFieldPlane = this.parent.fields.filter(
      (f) => f instanceof MagneticField && f.showCrossProductPlane
    );

    let magneticFields: {
      field: Vector3;
      color: number;
    }[] = [];

    for (const field of showMagneticFieldPlane) {
      const magneticField = field as MagneticField;
      const force = magneticField.calculateForce(this);
      if (force.length() !== 0)
        magneticFields.push({
          field: field.value,
          color: magneticField.arrowColor
        });
    }

    if (magneticFields.length > 0) {
      const velocityGroup = new Group();
      const velocityArrow = new ArrowHelper(
        this.velocity.clone().normalize(),
        new Vector3(0, 0, 0),
        5,
        0xff0000
      );

      if (magneticFields.length > 0) {
        const dotGeometry = new SphereGeometry(0.1, 4, 4);
        const dotMaterial = new MeshBasicMaterial({ color: 0xff0000 });
        const dot = new Mesh(dotGeometry, dotMaterial);
        dot.position.copy(this.velocity.clone().normalize().multiplyScalar(5));
        velocityGroup.add(dot);
      }

      velocityGroup.add(velocityArrow);
      this.visualsObjects.push(velocityGroup);
    } else {
      this.renderVelocityArrow();
      return;
    }

    for (const magneticField of magneticFields) {
      const magneticFieldGroup = new Group();
      const magneticFieldArrow = new ArrowHelper(
        magneticField.field.clone().normalize(),
        new Vector3(0, 0, 0),
        4,
        magneticField.color
      );
      magneticFieldGroup.add(magneticFieldArrow);

      const dotGeometry = new SphereGeometry(0.1, 4, 4);
      const dotMaterial = new MeshBasicMaterial({ color: magneticField.color });
      const dot = new Mesh(dotGeometry, dotMaterial);
      dot.position.copy(
        magneticField.field.clone().normalize().multiplyScalar(4)
      );
      magneticFieldGroup.add(dot);

      const magneticFieldForceArrow = new ArrowHelper(
        magneticField.field
          .clone()
          .cross(this.velocity)
          .multiplyScalar(this.value)
          .normalize(),
        new Vector3(0, 0, 0),
        4,
        0x00ffff
      );
      magneticFieldGroup.add(magneticFieldForceArrow);

      const plane = createTransparentPlane(
        new Vector3(0, 0, 0),
        magneticField.field
          .clone()
          .cross(this.velocity)
          .normalize()
          .multiplyScalar(10)
      );
      magneticFieldGroup.add(plane);

      this.visualsObjects.push(magneticFieldGroup);
    }
  }

  calculateForce() {
    let force = new Vector3(0, 0, 0);

    for (const field of this.parent.fields) {
      force.add(field.calculateForce(this));
    }

    const charges = this.parent.entities.filter(
      (entity) => entity instanceof Charge && entity !== this
    ) as Charge[];

    for (const charge of charges) {
      if (charge === this) continue;

      const distance =
        this.object.position.distanceTo(charge.object.position) /
        this.parent.context.distanceUnit;
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

    if (!this.parent.context.ignoreGravity) {
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

  static fromJSON(sandbox: Sandbox, data: any) {
    const charge = new Charge(
      sandbox,
      {
        charge: data.value,
        velocity: new Vector3().fromArray(data.velocity),
        position: new Vector3().fromArray(data.position),
        mass: data.mass
      }
    );
    return charge;
  }
}
