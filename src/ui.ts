import { camera, gizmo, renderer, scene } from '@/renderer';
import { PanelManager } from '@/logic/managers/PanelManager';
import { SelectManager } from '@/logic/managers/SelectManager';
import '@/styles/global.css';
import '@/styles/overlay.css';
import { DebugPanel } from '@/ui/components/DebugPanel';
import { Toolbar } from '@/ui/components/overlay/Toolbar';
import { AssetsManager } from '@/logic/managers/AssetsManager';
import { I18nManager } from '@/logic/managers/I18nManager';
import { Settings } from '@/ui/components/overlay/Settings';

export const i18nManager = new I18nManager();
export const t = i18nManager.getTranslation.bind(i18nManager);
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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  gizmo.update();
});

function registerTooltips() {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  document.body.appendChild(tooltip);

  const tooltipElements = document.querySelectorAll('[data-tooltip]');

  tooltipElements.forEach(el => {
    el.addEventListener('mouseenter', event => {
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
}

function createToolbar() {
  const toolbar = new Toolbar();
  document.body.insertAdjacentHTML('beforeend', toolbar.getHTML());
  toolbar.attachEvents();
}

function createSettings() {
  const settings = new Settings();
  document.body.insertAdjacentHTML('beforeend', settings.getHTML());
  settings.attachEvents();
}

function createDebugPanel() {
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
}

createToolbar();
createDebugPanel();
createSettings();
document.addEventListener('DOMContentLoaded', () => {
  registerTooltips();
});

i18nManager.on('languageChange', () => {
  document.getElementById('toolbar')!.remove();
  createToolbar();
  selectManager.deselect();
  document.getElementById('settings')!.remove();
  createSettings();
  document.getElementById('debug-panel')?.remove();
  createDebugPanel();
  panelManager.refresh();
  document.querySelectorAll('.tooltip').forEach(el => el.remove());
  registerTooltips();
});
