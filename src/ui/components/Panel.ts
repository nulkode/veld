import { Component } from '@/ui/components/Component';
import { PanelField } from '@/ui/components/fields/PanelField';
import '@/styles/panels/fields/fields.css';
import { t } from '@/ui';

export class PanelButton {
  id: string;
  innerHTML: string;
  onClick: () => void;
  color?: number;
  beforeMinimize?: boolean;

  constructor(
    id: string,
    innerHTML: string,
    onClick: () => void,
    color?: number,
    beforeMinimize?: boolean
  ) {
    this.id = id;
    this.innerHTML = innerHTML;
    this.onClick = onClick;
    this.color = color;
    this.beforeMinimize = beforeMinimize;
  }
}

export class TogglePanelButton {
  id: string;
  innerHTML: string;
  value: boolean;
  onClick: (value: boolean) => void;
  color?: number;
  beforeMinimize?: boolean;

  constructor(
    id: string,
    innerHTML: string,
    onClick: (value: boolean) => void,
    color?: number,
    beforeMinimize?: boolean
  ) {
    this.id = id;
    this.innerHTML = innerHTML;
    this.onClick = onClick;
    this.color = color;
    this.beforeMinimize = beforeMinimize;
    this.value = false;
  }

  toggle() {
    this.value = !this.value;
    const buttonElement = document.getElementById(this.id);
    if (buttonElement) {
      buttonElement.classList.toggle('active', this.value);
    }
    this.onClick(this.value);
  }
}

export class Panel extends Component {
  id: string;
  title: string;
  fields: PanelField[];
  minimized: boolean;
  buttons: (PanelButton | TogglePanelButton)[];

  constructor(
    id: string,
    title: string,
    fields: PanelField[],
    buttons: (PanelButton | TogglePanelButton)[] = []
  ) {
    super();
    this.id = id;
    this.title = title;
    this.fields = fields;
    this.minimized = false;
    this.buttons = buttons;
  }

  toggleMinimize() {
    this.minimized = !this.minimized;
    const panelContent = document.getElementById(`${this.id}-content`);
    if (panelContent) {
      panelContent.style.display = this.minimized ? 'none' : 'block';
    }
  }

  getHTML() {
    const fieldsHTML = this.fields.map((field) => field.getHTML()).join('');
    return `
        <div class="panel ui" id="${this.id}">
          <div class="panel-header" id="${this.id}-header">
            <span>${t(this.title) ?? this.title}</span>
            <div class="panel-buttons">
              ${this.buttons
                .filter((button) => button.beforeMinimize)
                .map(
                  (button) => `
                    <button id="${button.id}"
                      style="background-color: ${
                        button.color
                          ? '#' + button.color.toString(16)
                          : 'transparent'
                      }"
                      class="${
                        button instanceof TogglePanelButton
                          ? button.value
                            ? 'active'
                            : ''
                          : ''
                      } ${
                    button instanceof TogglePanelButton ? 'toggle-button' : ''
                  }"
                    >${button.innerHTML}</button>
                  `
                )
                .join('')}
              <button id="${this.id}-toggle">_</button>
              ${this.buttons
                .filter((button) => !button.beforeMinimize)
                .map(
                  (button) => `
                    <button id="${button.id}"
                      style="background-color: ${
                        button.color
                          ? '#' + button.color.toString(16)
                          : 'transparent'
                      }"
                      class="${
                        button instanceof TogglePanelButton
                          ? button.value
                            ? 'active'
                            : ''
                          : ''
                      } ${
                    button instanceof TogglePanelButton ? 'toggle-button' : ''
                  }"
                    >${button.innerHTML}</button>
                  `
                )
                .join('')}
            </div>
          </div>
          <div class="panel-content" id="${this.id}-content" style="${
      this.minimized ? 'display: none' : ''
    }">
            ${fieldsHTML}
          </div>
        </div>
      `;
  }

  attachEvents() {
    document
      .getElementById(`${this.id}-toggle`)
      ?.addEventListener('click', () => this.toggleMinimize());
    this.buttons.forEach((button) => {
      const buttonElement = document.getElementById(`${button.id}`);
      if (button instanceof TogglePanelButton) {
        buttonElement?.addEventListener('click', () => button.toggle());
      } else {
        buttonElement?.addEventListener('click', button.onClick);
      }
    });
    this.fields.forEach((field) => field.attachEvents());
  }
}
