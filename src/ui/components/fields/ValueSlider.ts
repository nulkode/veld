import { ValuePanelField } from '@/ui/components/fields/PanelField';
import '@/styles/panels/fields/value-slider.css';
import { t } from '@/ui';

export class PanelValueSliderField extends ValuePanelField<number> {
  min: number;
  max: number;
  onUpdate: (value: number) => void;

  constructor(
    id: string,
    label: string,
    min: number,
    max: number,
    value: number,
    onUpdate: (value: number) => void,
    labelGenerator?: (value: number) => string
  ) {
    super(id, label, value, onUpdate, labelGenerator);
    this.min = min;
    this.max = max;
    this.onUpdate = onUpdate;

    onUpdate(value);
  }

  getHTML() {
    const label = this.getLabel(this.value);
    return `
        <div>
          <label for="${this.id}">${t(this.label) ?? this.label}: <span id="${
      this.id
    }-value">${label}</span></label>
          <input type="range" id="${this.id}" min="${this.min}" max="${
      this.max
    }" value="${this.value}">
        </div>
      `;
  }

  attachEvents() {
    document.getElementById(this.id)?.addEventListener('input', event => {
      const input = event.target as HTMLInputElement;
      const value = parseInt(input.value);
      this.value = value;
      this.onUpdate(value);
      const span = document.getElementById(`${this.id}-value`);
      if (span) {
        span.innerHTML = this.getLabel(value);
      }
    });
  }
}
