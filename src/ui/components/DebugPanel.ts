import { Component } from './Component';
import { Scene } from 'three';

export class DebugPanel extends Component {
  private element: HTMLElement | null = null;
  private scene: Scene;
  private lastTime = performance.now();
  private frameCount = 0;
  private fps = 0;

  private readonly TARGET_FPS = 60;
  private readonly fpsHistory: number[] = [];
  private readonly HISTORY_SIZE = 10;

  constructor(scene: Scene) {
    super();
    this.scene = scene;
  }

  getHTML(): string {
    return `
            <div id="debug-panel">
                Objects: <span id="object-count">0</span><br>
                FPS: <span id="fps-counter">0</span><br>
                Status: <span id="performance-status">---</span>
            </div>
        `;
  }

  attachEvents(): void {
    this.element = document.getElementById('debug-panel');
    this.update();
  }

  private updatePerformanceStatus() {
    const statusElement = document.getElementById('performance-status');
    if (!statusElement) return;

    const avgFps =
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const performance = avgFps / this.TARGET_FPS;

    if (performance > 0.9) {
      statusElement.textContent = 'Good';
      statusElement.className = 'status-good';
    } else if (performance > 0.6) {
      statusElement.textContent = 'Elevated';
      statusElement.className = 'status-warning';
    } else {
      statusElement.textContent = 'Critical';
      statusElement.className = 'status-critical';
    }
  }

  update() {
    if (!this.element) return;

    const currentTime = performance.now();
    this.frameCount++;

    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round(
        (this.frameCount * 1000) / (currentTime - this.lastTime)
      );
      this.frameCount = 0;
      this.lastTime = currentTime;

      const objectCount = document.getElementById('object-count');
      const fpsCounter = document.getElementById('fps-counter');

      if (objectCount)
        objectCount.textContent = this.scene.children.length.toString();
      if (fpsCounter) fpsCounter.textContent = this.fps.toString();

      // Update FPS history
      this.fpsHistory.push(this.fps);
      if (this.fpsHistory.length > this.HISTORY_SIZE) {
        this.fpsHistory.shift();
      }

      this.updatePerformanceStatus();
    }

    requestAnimationFrame(() => this.update());
  }

  show() {
    this.element?.classList.add('visible');
  }

  hide() {
    this.element?.classList.remove('visible');
  }
}
