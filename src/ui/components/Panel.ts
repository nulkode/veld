import { Component } from '@/ui/components/Component';
import { PanelField } from '@/ui/components/fields/PanelField';

export class Panel extends Component {
  id: string;
  title: string;
  fields: PanelField[];
  minimized: boolean;

  constructor(id: string, title: string, fields: PanelField[]) {
    super();
    this.id = id;
    this.title = title;
    this.fields = fields;
    this.minimized = false;
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
            <button id="${this.id}-toggle">_</button>
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
    this.fields.forEach((field) => field.attachEvents());
  }
}
