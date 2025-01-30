import { Sandbox } from '@/logic/physics/sandbox';
import { selectManager } from '@/ui';
import {
  ArrowHelper,
  BufferGeometry,
  Line,
  LineBasicMaterial,
  MathUtils,
  Object3D,
  Vector3
} from 'three';

export abstract class PhysicalEntity {
  readonly uuid = MathUtils.generateUUID();
  readonly parent: Sandbox;
  object: Object3D;
  velocity: Vector3;
  mass: number;
  visuals: {
    velocity: boolean;
    acceleration: boolean;
    trajectory: boolean;
  };
  protected visualsObjects: Object3D[] = [];
  private trajectoryPoints: Vector3[] = [];
  private trajectoryLine: Line | null = null;

  constructor(
    sandbox: Sandbox,
    {
      object,
      velocity,
      mass
    }: {
      object: Object3D;
      velocity: Vector3;
      mass: number;
    }
  ) {
    this.parent = sandbox;
    this.object = object;
    this.velocity = velocity;
    this.mass = mass;
    this.visuals = {
      velocity: false,
      acceleration: false,
      trajectory: false
    };
  }

  abstract calculateForce(): Vector3;

  protected replace3DObject(newObject: Object3D) {
    newObject.position.copy(this.object.position);
    newObject.rotation.copy(this.object.rotation);
    this.object.parent?.add(newObject);
    this.object.parent?.remove(this.object);
    this.object = newObject;
  }

  cleanVisuals() {
    if (this.visualsObjects.length !== 0) {
      this.object.remove(...this.visualsObjects);
      this.visualsObjects = [];
    }
  }

  private deleteTrajectory() {
    if (this.trajectoryLine) {
      this.trajectoryLine.geometry.dispose();
      this.object.parent?.remove(this.trajectoryLine);
      this.trajectoryLine = null;
      this.trajectoryPoints = [];
    }
  }

  deleteVisuals() {
    this.cleanVisuals();
    this.deleteTrajectory();
  }

  updateDistanceUnit(oldUnit: number, newUnit: number) {
    this.object.position.multiplyScalar(newUnit / oldUnit);
    this.trajectoryPoints.forEach(point =>
      point.multiplyScalar(newUnit / oldUnit)
    );
  }

  protected renderVelocityArrow() {
    if (!selectManager.amISelected(this)) if (!this.visuals.velocity) return;
    if (this.velocity.length() === 0) return;

    const velocityArrow = new ArrowHelper(
      this.velocity.clone().normalize(),
      new Vector3(0, 0, 0),
      5,
      0xff0000
    );

    this.visualsObjects.push(velocityArrow);
  }

  protected renderAccelerationArrow() {
    if (!this.visuals.acceleration) return;

    const acceleration = this.calculateForce().divideScalar(this.mass);

    const accelerationArrow = new ArrowHelper(
      acceleration.clone().normalize(),
      new Vector3(0, 0, 0),
      4,
      0x00ff00,
      0.5,
      0.3
    );

    this.visualsObjects.push(accelerationArrow);
  }

  protected renderTrajectory() {
    if (this.visuals.trajectory) {
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
        const material = new LineBasicMaterial({
          color: 0x00ff00
        });
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

  updateVisuals() {
    this.cleanVisuals();

    this.renderAccelerationArrow();
    this.renderTrajectory();
    this.renderVelocityArrow();
  }

  abstract toJSON(): any;
  static fromJSON(_parent: Sandbox, _data: any): PhysicalEntity {
    throw new Error('Method not implemented.');
  }
}
