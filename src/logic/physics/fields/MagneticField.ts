import { Field } from '@/logic/physics/fields/Field';
import { PhysicalEntity } from '@/logic/physics/entities/PhysicalEntity';
import { Charge } from '@/logic/physics/entities/Charge';
import { Scene, Vector3 } from 'three';

export class MagneticField extends Field {
  showCrossProductPlane: boolean = false;

  constructor(
    scene: Scene,
    field: Vector3,
    show: boolean = true,
    variation?: Vector3,
    arrowColor?: number,
    showCrossProductPlane: boolean = false
  ) {
    super(scene, field, show, variation, arrowColor);
    this.showCrossProductPlane = showCrossProductPlane;
  }

  calculateForce(entity: PhysicalEntity): Vector3 {
    if (entity instanceof Charge) {
      return this.value
        .clone()
        .cross(entity.velocity)
        .multiplyScalar(-entity.value);
    } else {
      return new Vector3();
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

  static fromJSON(scene: Scene, data: any) {
    return new MagneticField(
      scene,
      new Vector3().fromArray(data.value),
      data.show,
      new Vector3().fromArray(data.variation),
      data.arrowColor
    );
  }
}
