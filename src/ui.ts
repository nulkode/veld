import * as THREE from 'three';
import {
  camera,
  renderer,
  sandbox,
  rotateCameraToPosition,
  transformControls,
  orbitControls,
} from '@/renderer';
import {
  SandboxStatus,
  protonModel,
  electronModel,
  Charge,
  MagneticField,
  ElectricField,
} from '@/sandbox';
import { PanelManager } from '@/ui/managers/PanelManager';
import { Panel } from '@/ui/components/Panel';
import { PanelValueSliderField } from '@/ui/components/fields/ValueSlider';
import { PanelValueToggleField } from '@/ui/components/fields/ValueToggle';
import { SelectManager } from '@/ui/managers/SelectManager';
import '@/styles/global.css';
import '@/styles/overlay.css';

function rotateCameraToTopView() {
  rotateCameraToPosition(0, 1, 0);
}

function rotateCameraToFrontView() {
  rotateCameraToPosition(0, 0, 1);
}

function rotateCameraToSideView() {
  rotateCameraToPosition(1, 0, 0);
}

document
  .getElementById('top-face')
  ?.addEventListener('click', rotateCameraToTopView);
document
  .getElementById('front-face')
  ?.addEventListener('click', rotateCameraToFrontView);
document
  .getElementById('side-face')
  ?.addEventListener('click', rotateCameraToSideView);

document.getElementById('play-pause')?.addEventListener('click', () => {
  const icon = document.getElementById('play-pause-icon') as HTMLImageElement;
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
  const icon = document.getElementById('play-pause-icon') as HTMLImageElement;
  icon.src = '/play.svg';
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

export const panelManager = new PanelManager('panels-container', sandbox);

const sandboxPanel = new Panel('sandbox', 'Sandbox Settings', [
  new PanelValueSliderField(
    'time-unit',
    'Time Unit',
    -10,
    10,
    0,
    (value) => {
      sandbox.context.timeUnit = Math.pow(10, value);
    },
    (value) => `10<sup>${value}</sup> s`
  ),
  new PanelValueSliderField(
    'distance-unit',
    'Distance Unit',
    -10,
    10,
    0,
    (value) => {
      sandbox.context.distanceUnit = Math.pow(10, value);
    },
    (value) =>
      `i&#770; = 10<sup>${value}</sup> m; j&#770; = 10<sup>${value}</sup> m; k&#770; = 10<sup>${value}</sup> m`
  ),
  new PanelValueToggleField(
    'ignore-gravity',
    'Ignore Gravity',
    true,
    (value) => {
      sandbox.context.ignoreGravity = value;
    }
  ),
]);

panelManager.addPanel(sandboxPanel);

const chargeButton = document.getElementById('charge')!;
const electricField = document.getElementById('electric-field')!;
const magneticField = document.getElementById('magnetic-field')!;

chargeButton.addEventListener('click', () => {
  selectManager.deselect();

  if (protonModel && electronModel) {
    sandbox.appendEntity(
      new Charge(-1, new THREE.Vector3(0, 0, 0), orbitControls.target)
    );
  }
});

electricField.addEventListener('click', () => {
  selectManager.deselect();
  sandbox.addField(new ElectricField(new THREE.Vector3(0, 1, 0)));
});

magneticField.addEventListener('click', () => {
  selectManager.deselect();
  sandbox.addField(new MagneticField(new THREE.Vector3(0, 1, 0)));
});

const tooltip = document.createElement('div');
tooltip.className = 'tooltip';
document.body.appendChild(tooltip);

document.addEventListener('DOMContentLoaded', () => {
  const tooltipElements = document.querySelectorAll('[data-tooltip]');

  tooltipElements.forEach((el) => {
    el.addEventListener('mouseenter', (event) => {
      const tooltipText = el.getAttribute('data-tooltip')!;
      tooltip.classList.add('tooltip-visible');
      tooltip.innerText = tooltipText;

      const updateTooltipPosition = (event: MouseEvent) => {
        console.log(event);
        const cursorX = event.clientX;
        const cursorY = event.clientY;
        tooltip.style.left = `${cursorX + 20}px`;
        tooltip.style.top = `${cursorY + 20}px`;
      };

      updateTooltipPosition(event as MouseEvent);

      el.addEventListener('mousemove', updateTooltipPosition as EventListener);

      el.addEventListener(
        'mouseleave',
        () => {
          tooltip.classList.remove('tooltip-visible');
          el.removeEventListener(
            'mousemove',
            updateTooltipPosition as EventListener
          );
        },
        { once: true }
      );
    });
  });
});

export const selectManager = new SelectManager(
  sandbox,
  transformControls,
  sandbox.scene
);
