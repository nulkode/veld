import * as THREE from 'three';
import {
  camera,
  renderer,
  sandbox,
  rotateCameraToPosition,
  transformControls,
  orbitControls,
  scene
} from '@/renderer';
import {
  protonModel,
  electronModel,
  Charge,
  MagneticField,
  ElectricField
} from '@/sandbox';
import { PanelManager } from '@/ui/managers/PanelManager';
import { Panel } from '@/ui/components/Panel';
import { PanelValueSliderField } from '@/ui/components/fields/ValueSlider';
import { PanelValueToggleField } from '@/ui/components/fields/ValueToggle';
import { SelectManager } from '@/ui/managers/SelectManager';
import '@/styles/global.css';
import '@/styles/overlay.css';
import { DebugPanel } from '@/ui/components/DebugPanel';
import { Toolbar } from '@/ui/components/overlay/Toolbar';

document
  .getElementById('top-face')
  ?.addEventListener('click', () => rotateCameraToPosition(0, 1, 0));
document
  .getElementById('front-face')
  ?.addEventListener('click', () => rotateCameraToPosition(0, 0, 1));
document
  .getElementById('side-face')
  ?.addEventListener('click', () => rotateCameraToPosition(1, 0, 0));

const toolbar = new Toolbar();
document.body.insertAdjacentHTML('beforeend', toolbar.getHTML());
toolbar.attachEvents();

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
  )
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
  sandbox.addField(new ElectricField(scene, new THREE.Vector3(0, 1, 0)));
});

magneticField.addEventListener('click', () => {
  selectManager.deselect();
  sandbox.addField(new MagneticField(scene, new THREE.Vector3(0, 1, 0)));
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

let clicks = 0;
const debugPanel = new DebugPanel(scene);

document.getElementById('logo')?.addEventListener('click', () => {
  clicks += 1;
  if (clicks > 3) {
    document.body.insertAdjacentHTML('beforeend', debugPanel.getHTML());
    debugPanel.attachEvents();
    debugPanel.show();
    clicks = 0;
  }
});

export const selectManager = new SelectManager(
  sandbox,
  transformControls,
  sandbox.scene
);
