import { Field } from '@/logic/physics/fields/Field';
import { Sandbox, SandboxContext } from '@/logic/physics/sandbox';
import { MathUtils, Object3D, Vector3 } from 'three';

export abstract class PhysicalEntity {
  readonly uuid = MathUtils.generateUUID();
  object: Object3D;

  constructor(object: Object3D) {
    this.object = object;
  }

  abstract calculateForce(
    context: SandboxContext,
    fields: Field[],
    ...entities: PhysicalEntity[]
  ): Vector3;

  abstract updateVisuals(sandbox: Sandbox): void;
  abstract deleteVisuals(): void;
  abstract toJSON(): any;
  static fromJSON(_data: any): PhysicalEntity {
    throw new Error('Method not implemented.');
  }
}
