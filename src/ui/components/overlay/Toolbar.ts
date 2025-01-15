import { Component } from '@/ui/components/Component';
import { Charge, ElectricField, MagneticField, SandboxStatus } from '@/sandbox';
import { orbitControls, sandbox, scene } from '@/renderer';
import { selectManager } from '@/ui';
import * as THREE from 'three';
import '@/styles/overlay/Toolbar.css';

export enum ToolbarButton {
  MOVE = 'move',
  ROTATE = 'rotate',
  CHARGE = 'charge',
  ELECTRIC_FIELD = 'electric-field',
  MAGNETIC_FIELD = 'magnetic-field',
  PLAY_PAUSE = 'play-pause',
  RESET = 'reset'
}

class Toolbar extends Component {
  buttons: {
    [key in ToolbarButton]?: HTMLElement;
  };

  constructor() {
    super();
    this.buttons = {};
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
    this.buttons = {
      [ToolbarButton.MOVE]: document.getElementById('move')!,
      [ToolbarButton.ROTATE]: document.getElementById('rotate')!,
      [ToolbarButton.CHARGE]: document.getElementById('charge')!,
      [ToolbarButton.ELECTRIC_FIELD]:
        document.getElementById('electric-field')!,
      [ToolbarButton.MAGNETIC_FIELD]:
        document.getElementById('magnetic-field')!,
      [ToolbarButton.PLAY_PAUSE]: document.getElementById('play-pause')!,
      [ToolbarButton.RESET]: document.getElementById('reset')!
    };

    this.buttons[ToolbarButton.MOVE]!.addEventListener('click', () =>
      selectManager.updateMode('translate')
    );
    this.buttons[ToolbarButton.ROTATE]!.addEventListener('click', () =>
      selectManager.updateMode('rotate')
    );

    this.buttons[ToolbarButton.PLAY_PAUSE]!.addEventListener('click', () => {
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

    this.buttons[ToolbarButton.RESET]!.addEventListener('click', () => {
      sandbox.reset();
      const icon = document.getElementById(
        'play-pause-icon'
      ) as HTMLImageElement;
      icon.src = 'icons/play.svg';
    });

    this.buttons[ToolbarButton.CHARGE]!.addEventListener('click', () => {
      selectManager.deselect();

      sandbox.appendEntity(
        new Charge(-1, new THREE.Vector3(0, 0, 0), orbitControls.target)
      );
    });

    this.buttons[ToolbarButton.ELECTRIC_FIELD]!.addEventListener(
      'click',
      () => {
        selectManager.deselect();
        sandbox.addField(new ElectricField(scene, new THREE.Vector3(0, 1, 0)));
      }
    );

    this.buttons[ToolbarButton.MAGNETIC_FIELD]!.addEventListener(
      'click',
      () => {
        selectManager.deselect();
        sandbox.addField(new MagneticField(scene, new THREE.Vector3(0, 1, 0)));
      }
    );

    selectManager.on('updateButtons', (buttons) => {
      for (const button in buttons) {
        this.updateButton(button as ToolbarButton, buttons[button]);
      }
    });
  }

  private updateButton(
    button: ToolbarButton,
    mode: 'disabled' | 'enabled' | 'selected'
  ) {
    const buttonElement = this.buttons[button]!;
    buttonElement.classList.remove(
      'button-disabled',
      'button-enabled',
      'button-selected'
    );
    buttonElement.classList.add(`button-${mode}`);
  }
}

export { Toolbar };
