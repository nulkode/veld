import { Field } from '@/logic/physics/fields/Field';
import { Charge } from '@/logic/physics/entities/Charge';
import { PhysicalEntity } from '@/logic/physics/entities/PhysicalEntity';
import { Scene, Vector3 } from 'three';

export class ElectricField extends Field {
  constructor(
    scene: Scene,
    field: Vector3,
    show: boolean = true,
    variation?: Vector3,
    arrowColor?: number
  ) {
    super(scene, field, show, variation, arrowColor);
  }

  calculateForce(entity: PhysicalEntity): Vector3 {
    if (entity instanceof Charge) {
      return this.value.clone().multiplyScalar(entity.value);
    } else {
      return new Vector3();
    }
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

  static fromJSON(scene: Scene, data: any) {
    return new ElectricField(
      scene,
      new Vector3().fromArray(data.value),
      data.show,
      new Vector3().fromArray(data.variation),
      data.arrowColor
    );
  }
}
