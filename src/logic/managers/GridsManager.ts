import * as THREE from 'three';

export class GridManager {
  scene: THREE.Scene;
  grids: {
    object: THREE.GridHelper;
    position: THREE.Vector2;
  }[] = [];
  farPlane = 500;
  size = 3000;
  divisions = 160;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update(cameraPosition: THREE.Vector3) {
    const currentGridX = Math.floor(cameraPosition.x / this.size);
    const currentGridY = Math.floor(cameraPosition.z / this.size);

    for (let x = currentGridX - 1; x <= currentGridX + 1; x++) {
        for (let y = currentGridY - 1; y <= currentGridY + 1; y++) {
            const position = new THREE.Vector2(x, y);
            if (!this.grids.find(grid => grid.position.x === x && grid.position.y === y)) {
                this.createGrid(position);
            }
        }
    }

    this.grids.forEach((grid, index) => {
        if (Math.abs(grid.position.x - currentGridX) > 1 || Math.abs(grid.position.y - currentGridY) > 1) {
            this.removeGrid(index);
        }
    });
  }

  private createGrid(position: THREE.Vector2) {
    const gridHelper = new THREE.GridHelper(this.size, this.divisions);
    gridHelper.position.set(position.x * this.size, 0, position.y * this.size);
    gridHelper.material.color.setHex(0x404040);
    gridHelper.material.opacity = 0.5;
    gridHelper.material.transparent = true;

    this.scene.add(gridHelper);
    this.grids.push({ object: gridHelper, position });
  }

  private removeGrid(grid: number) {
    this.scene.remove(this.grids[grid].object);
    this.grids.splice(grid, 1);
  }
}
