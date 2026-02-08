import { Component } from '@/ui/components/Component';
import { SandboxStatus } from '@/logic/physics/sandbox';
import { orbitControls, sandbox } from '@/renderer';
import { selectManager, t } from '@/ui';
import '@/styles/overlay/toolbar.css';

export enum ToolbarButton {
  NEW = 'new',
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
        <div class="button" id="new" data-tooltip="${t('toolbar.new')}">
          <img src="${import.meta.env.BASE_URL}icons/new.svg" />
        </div>
        <div class="button" id="move" data-tooltip="${t('toolbar.move')}">
          <img src="${import.meta.env.BASE_URL}icons/move.svg" />
        </div>
        <div class="button" id="rotate" data-tooltip="${t('toolbar.rotate')}">
          <img src="${import.meta.env.BASE_URL}icons/rotate.svg" />
        </div>
        <div class="button" id="charge" data-tooltip="${t('toolbar.charge')}">
          <img src="${import.meta.env.BASE_URL}icons/charge.svg" />
        </div>
        <div class="button" id="electric-field" data-tooltip="${t(
          'toolbar.electric-field'
        )}">
          <img src="${import.meta.env.BASE_URL}icons/electric-field.svg" />
        </div>
        <div class="button" id="magnetic-field" data-tooltip="${t(
          'toolbar.magnetic-field'
        )}">
          <img src="${import.meta.env.BASE_URL}icons/magnetic-field.svg" />
        </div>
        <div class="button" id="play-pause" data-tooltip="${t(
          'toolbar.play-pause'
        )}">
          <img id="play-pause-icon" src="${import.meta.env.BASE_URL}icons/play.svg" />
        </div>
        <div class="button" id="reset" data-tooltip="${t('toolbar.reset')}">
          <img src="${import.meta.env.BASE_URL}icons/stop.svg" />
        </div>
      </div>`;
  }

  attachEvents() {
    this.buttons = {
      [ToolbarButton.NEW]: document.getElementById('new')!,
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

    this.buttons[ToolbarButton.NEW]!.addEventListener('click', () => {
      sandbox.new();
      const icon = document.getElementById(
        'play-pause-icon'
      ) as HTMLImageElement;
      icon.src = `${import.meta.env.BASE_URL}icons/play.svg`;
    });

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
        icon.src = `${import.meta.env.BASE_URL}icons/play.svg`;
      } else {
        sandbox.play();
        icon.src = `${import.meta.env.BASE_URL}icons/pause.svg`;
      }
    });

    const icon = document.getElementById('play-pause-icon') as HTMLImageElement;
    if (sandbox.status === SandboxStatus.PAUSED) {
      icon.src = `${import.meta.env.BASE_URL}icons/play.svg`;
    } else {
      icon.src = `${import.meta.env.BASE_URL}icons/pause.svg`;
    }

    this.buttons[ToolbarButton.RESET]!.addEventListener('click', () => {
      sandbox.reset();
      const icon = document.getElementById(
        'play-pause-icon'
      ) as HTMLImageElement;
      icon.src = `${import.meta.env.BASE_URL}icons/play.svg`;
    });

    this.buttons[ToolbarButton.CHARGE]!.addEventListener('click', () => {
      selectManager.deselect();
      sandbox.addCharge(orbitControls.target.clone());
    });

    this.buttons[ToolbarButton.ELECTRIC_FIELD]!.addEventListener(
      'click',
      () => {
        selectManager.deselect();
        sandbox.addElectricField();
      }
    );

    this.buttons[ToolbarButton.MAGNETIC_FIELD]!.addEventListener(
      'click',
      () => {
        selectManager.deselect();
        sandbox.addMagneticField();
      }
    );

    selectManager.on('updateButtons', buttons => {
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
