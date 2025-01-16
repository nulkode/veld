import { ValuePanelField } from '@/ui/components/fields/PanelField';
import '@/styles/panels/fields/value-color.css';
import { t } from '@/ui';

export class PanelValueColorField extends ValuePanelField<number> {
  onUpdate: (value: number) => void;
  predefinedColors: number[];

  constructor(
    id: string,
    label: string,
    value: number,
    onUpdate: (value: number) => void,
    predefinedColors?: number[],
    labelGenerator?: (value: number) => string
  ) {
    super(id, label, value, labelGenerator);
    this.onUpdate = onUpdate;
    this.predefinedColors = predefinedColors ?? [
      0x000000, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff
    ];
    onUpdate(value);
  }

  getHTML() {
    const colorOptions = this.predefinedColors
      .map(
        (color) => `
        <div class="color-option" data-color="${color}" style="background-color: #${color.toString(16).padStart(6, '0')}"></div>
      `
      )
      .join('');

    return `
      <div>
        <label for="${this.id}">${t(this.label) ?? this.label}</label>
        <div id="${this.id}-color-options" class="color-options">
          ${colorOptions}
        </div>
      </div>
    `;
  }

  attachEvents() {
    const colorOptionsContainer = document.getElementById(
      `${this.id}-color-options`
    ) as HTMLDivElement;
    colorOptionsContainer?.addEventListener('click', (event) => {
      const target = event.target as HTMLDivElement;
      if (target.classList.contains('color-option')) {
        const newValue = parseInt(target.dataset.color!, 10);
        this.updateValue(newValue);
      }
    });
  }

  private updateValue(newValue: number) {
    this.value = newValue;
    this.onUpdate(newValue);
  }

  setValue(value: number): void {
    this.value = value;
  }
}
