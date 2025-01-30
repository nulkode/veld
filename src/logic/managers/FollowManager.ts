import { EventEmitter } from '@/logic/managers/EventManager';
import { PhysicalEntity } from '@/logic/physics/entities/PhysicalEntity';
import { camera, orbitControls } from '@/renderer';
import { Vector3 } from 'three';

export class FollowManager extends EventEmitter {
  followedEntity: PhysicalEntity | null = null;

  constructor() {
    super();
  }

  follow(entity: PhysicalEntity) {
    this.followedEntity = entity;
    this.emit('follow', entity);
  }

  unfollow() {
    this.followedEntity = null;
    this.emit('unfollow');
  }

  update() {
    if (this.followedEntity) {
      const offset = new Vector3().subVectors(
        camera.position,
        orbitControls.target
      );

      const targetPosition = this.followedEntity.object.position;
      orbitControls.target.copy(targetPosition);

      camera.position.copy(targetPosition);
      camera.position.add(offset);

      orbitControls.update();
    }
  }
}
