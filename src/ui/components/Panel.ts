import { Component } from '@/ui/components/Component';
import { PanelField } from '@/ui/components/fields/PanelField';
import '@/styles/panels/fields/fields.css';

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

export class Panel extends Component {
  id: string;
  title: string;
  fields: PanelField[];
  minimized: boolean;
  buttons: PanelButton[];

  constructor(
    id: string,
    title: string,
    fields: PanelField[],
    buttons: PanelButton[] = []
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
            <span>${this.title}</span>
            <div class="panel-buttons">
              ${this.buttons
                .filter((button) => button.beforeMinimize)
                .map(
                  (button) => `
                    <button id="${this.id}-${button.id}"
                      style="background-color: ${button.color ? '#' + button.color.toString(16) : 'transparent'}"
                    >${button.innerHTML}</button>
                  `
                )
                .join('')}
              <button id="${this.id}-toggle">_</button>
              ${this.buttons
                .filter((button) => !button.beforeMinimize)
                .map(
                  (button) => `
                    <button id="${this.id}-${button.id}"
                      style="background-color: ${button.color ? '#' + button.color.toString(16) : 'transparent'}"
                    >${button.innerHTML}</button>
                  `
                )
                .join('')}
            </div>
          </div>
          <div class="panel-content" id="${this.id}-content">
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
      document
        .getElementById(`${this.id}-${button.id}`)
        ?.addEventListener('click', button.onClick);
    });
    this.fields.forEach((field) => field.attachEvents());
  }
}
