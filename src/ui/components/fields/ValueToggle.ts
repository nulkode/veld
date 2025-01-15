import { ValuePanelField } from '@/ui/components/fields/PanelField';
import '@/styles/panels/fields/button.css';
import '@/styles/panels/fields/value-toggle.css';

export class PanelValueToggleField extends ValuePanelField<boolean> {
  constructor(
    id: string,
    label: string,
    value: boolean,
    onUpdate?: (value: boolean) => void,
    labelGenerator?: (value: boolean) => string
  ) {
    super(id, label, value, onUpdate, labelGenerator);
    this.onUpdate = onUpdate;
    if (onUpdate) onUpdate(value);
  }

  getHTML() {
    return `
        <div class="value-toggle-container">
          <label for="${this.id}" class="value-toggle-label">${this.label}</label>
          <button id="${this.id}" class="toggle-button ${
            this.value ? 'on' : 'off'
          }">
            ${this.value ? 'On' : 'Off'}
          </button>
        </div>
      `;
  }

  attachEvents() {
    document.getElementById(this.id)!.addEventListener('click', () => {
      this.value = !this.value;
      if (this.onUpdate) this.onUpdate(this.value);
      const button = document.getElementById(this.id) as HTMLButtonElement;
      button.classList.toggle('on', this.value);
      button.classList.toggle('off', !this.value);
      button.innerHTML = this.value ? 'On' : 'Off';
    });
  }
}
