import * as THREE from 'three';
import { Field } from '@/logic/physics/fields/Field';
import { PhysicalEntity } from '@/logic/physics/entities/PhysicalEntity';
import { Charge } from '@/logic/physics/entities/Charge';

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

  calculateForce(entity: PhysicalEntity): THREE.Vector3 {
    if (entity instanceof Charge) {
      return this.value
        .clone()
        .cross(entity.velocity)
        .multiplyScalar(entity.value);
    } else {
      return new THREE.Vector3();
    }
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
