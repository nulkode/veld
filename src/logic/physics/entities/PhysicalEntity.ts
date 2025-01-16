import * as THREE from 'three';
import { Field } from '@/logic/physics/fields/Field';
import { Sandbox, SandboxContext } from '@/logic/physics/sandbox';

export abstract class PhysicalEntity {
  readonly uuid = THREE.MathUtils.generateUUID();
  object: THREE.Object3D;

  constructor(object: THREE.Object3D) {
    this.object = object;
  }

  abstract calculateForce(
    context: SandboxContext,
    fields: Field[],
    ...entities: PhysicalEntity[]
  ): THREE.Vector3;

  abstract updateVisuals(sandbox: Sandbox): void;
  abstract deleteVisuals(): void;
  abstract toJSON(): any;
  static fromJSON(_data: any): PhysicalEntity {
    throw new Error('Method not implemented.');
  }
}
