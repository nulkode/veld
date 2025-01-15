import {
  camera,
  renderer,
  sandbox,
  rotateCameraToPosition,
  scene
} from '@/renderer';
import { PanelManager } from '@/managers/PanelManager';
import { Panel } from '@/ui/components/Panel';
import { PanelValueSliderField } from '@/ui/components/fields/ValueSlider';
import { PanelValueToggleField } from '@/ui/components/fields/ValueToggle';
import { SelectManager } from '@/managers/SelectManager';
import '@/styles/global.css';
import '@/styles/overlay.css';
import { DebugPanel } from '@/ui/components/DebugPanel';
import { Toolbar } from '@/ui/components/overlay/Toolbar';
import { AssetsManager } from './managers/AssetsManager';

export const assetsManager = new AssetsManager();

export const panelManager = new PanelManager('panels-container');

export const selectManager = new SelectManager();

assetsManager.on('loadingStateChanged', () => {
  if (
    !assetsManager.loadingState.scripts &&
    !assetsManager.loadingState.models
  ) {
    document.getElementById('loading-screen')!.style.opacity = '0';
    selectManager.deselect();
  }

  document.getElementById('loading-state-text')!.innerText =
    assetsManager.getLoadingString();
});

document
  .getElementById('top-face')
  ?.addEventListener('click', () => rotateCameraToPosition(0, 1, 0));
document
  .getElementById('front-face')
  ?.addEventListener('click', () => rotateCameraToPosition(0, 0, 1));
document
  .getElementById('side-face')
  ?.addEventListener('click', () => rotateCameraToPosition(1, 0, 0));

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

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

const toolbar = new Toolbar();
document.body.insertAdjacentHTML('beforeend', toolbar.getHTML());
toolbar.attachEvents();

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
