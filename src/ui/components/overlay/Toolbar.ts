import { Component } from '../Component';
import { SandboxStatus } from '@/sandbox';
import { sandbox } from '@/renderer';
import '@/styles/overlay/Toolbar.css';

class Toolbar extends Component {
  constructor() {
    super();
  }

  getHTML() {
    return `
      <div id="toolbar" class="ui">
        <div class="button" id="move" data-tooltip="Move">
          <img src="icons/move.svg" />
        </div>
        <div class="button" id="rotate" data-tooltip="Rotate">
          <img src="icons/rotate.svg" />
        </div>
        <div class="button" id="charge" data-tooltip="Add charge">
          <img src="icons/charge.svg" />
          <img class="loading-spinner" src="icons/loading.svg" />
        </div>
        <div class="button" id="electric-field" data-tooltip="Set electric field">
          <img src="icons/electric-field.svg" />
        </div>
        <div class="button" id="magnetic-field" data-tooltip="Set magnetic field">
          <img src="icons/magnetic-field.svg" />
        </div>
        <div class="button" id="play-pause" data-tooltip="Play/Pause">
          <img id="play-pause-icon" src="icons/play.svg" />
        </div>
        <div class="button" id="reset" data-tooltip="Reset sandbox">
          <img src="icons/stop.svg" />
        </div>
      </div>`;
  }

  attachEvents() {
    document.getElementById('play-pause')?.addEventListener('click', () => {
      const icon = document.getElementById(
        'play-pause-icon'
      ) as HTMLImageElement;
      if (sandbox.status === SandboxStatus.PLAYING) {
        sandbox.pause();
        icon.src = 'icons/play.svg';
      } else {
        sandbox.play();
        icon.src = 'icons/pause.svg';
      }
    });

    document.getElementById('reset')?.addEventListener('click', () => {
      sandbox.reset();
      const icon = document.getElementById(
        'play-pause-icon'
      ) as HTMLImageElement;
      icon.src = 'icons/play.svg';
    });
  }
}

export { Toolbar };
