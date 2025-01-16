import * as THREE from 'three';
import { PhysicalEntity } from '@/logic/physics/entities/PhysicalEntity';

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

  abstract calculateForce(entity: PhysicalEntity): THREE.Vector3;

  abstract toJSON(): any;
  static fromJSON(_scene: THREE.Scene, _data: any): Field {
    throw new Error('Method not implemented.');
  }
}
