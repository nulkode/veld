import { PhysicalEntity } from '@/logic/physics/entities/PhysicalEntity';
import { Sandbox, SandboxContext } from '@/logic/physics/sandbox';
import { Field } from '@/logic/physics/fields/Field';
import { assetsManager } from '@/ui';
import {
  Vector3,
  Object3D,
  ArrowHelper,
  PlaneGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Group,
  BufferGeometry,
  Line,
  LineBasicMaterial
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
  velocity: Vector3;
  mass: number = 1; // kg
  showVelocity: boolean = false;
  showAcceleration: boolean = false;
  showTrajectory: boolean = false;
  visuals: Object3D[] = [];
  trajectoryLine: Line | null = null;
  trajectoryPoints: Vector3[] = [];

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

  updateVisuals(sandbox: Sandbox) {
    if (this.visuals.length !== 0) {
      this.object.remove(...this.visuals);
      this.visuals = [];
    }

    const showMagneticFieldPlane = sandbox.fields.filter(
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

    if (
      (this.showVelocity && this.velocity.length() > 0) ||
      magneticFields.length > 0
    ) {
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
      this.visuals.push(velocityGroup);
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

      this.visuals.push(magneticFieldGroup);
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

    if (this.visuals.length !== 0) this.object.add(...this.visuals);

    if (this.showTrajectory) {
      if (
        this.trajectoryPoints.length === 0 ||
        this.object.position.distanceToSquared(
          this.trajectoryPoints[this.trajectoryPoints.length - 1]
        ) > 0.3
      ) {
        this.trajectoryPoints.push(this.object.position.clone());
      }
      if (this.trajectoryLine) {
        const geometry = new BufferGeometry().setFromPoints(
          this.trajectoryPoints
        );
        this.trajectoryLine.geometry.dispose();
        this.trajectoryLine.geometry = geometry;
      } else {
        const geometry = new BufferGeometry().setFromPoints(
          this.trajectoryPoints
        );
        const material = new LineBasicMaterial({ color: 0x00ff00 });
        this.trajectoryLine = new Line(geometry, material);
        this.object.parent!.add(this.trajectoryLine);
      }
    } else if (this.trajectoryLine) {
      this.trajectoryLine.geometry.dispose();
      this.object.parent?.remove(this.trajectoryLine);
      this.trajectoryLine = null;
      this.trajectoryPoints = [];
    }
  }

  deleteVisuals() {
    this.object.remove(...this.visuals);
    this.visuals = [];
    this.deleteTrajectory();
  }

  deleteTrajectory() {
    if (this.trajectoryLine) {
      this.trajectoryLine.geometry.dispose();
      this.object.parent?.remove(this.trajectoryLine);
      this.trajectoryLine = null;
      this.trajectoryPoints = [];
    }
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

      const distance =
        this.object.position.distanceTo(charge.object.position) /
        context.distanceUnit;
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
