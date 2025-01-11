import { ValuePanelField } from './PanelField';

export class PanelValueScientificField extends ValuePanelField<number> {
  unit: string;
  onUpdate: (value: number) => void;
  allowZero: boolean;

  constructor(
    id: string,
    label: string,
    unit: string, // Added unit argument
    value: number,
    onUpdate: (value: number) => void,
    labelGenerator?: (value: number) => string,
    allowZero: boolean = true
  ) {
    super(id, label, value, labelGenerator);
    this.unit = unit;
    this.onUpdate = onUpdate;
    this.allowZero = allowZero;
    onUpdate(value);
  }

  getHTML() {
    let [decimal, exponent] = this.value.toExponential().split('e');
    if (parseInt(exponent) === 0) {
      exponent = '0';
    }

    return `
        <div>
          <label for="${this.id}">${this.label} (${this.unit})</label>
          <div class="scientific-input">
            <input type="number" id="${this.id}-decimal" value="${decimal}">
            ×10<sup><input type="number" id="${this.id}-exponent" value="${
      !exponent ? '0' : exponent
    }"></sup>
          </div>
        </div>
      `;
  }

  attachEvents() {
    const decimalInput = document.getElementById(
      `${this.id}-decimal`
    ) as HTMLInputElement;
    const exponentInput = document.getElementById(
      `${this.id}-exponent`
    ) as HTMLInputElement;

    decimalInput?.addEventListener('input', () => this.updateValue());
    exponentInput?.addEventListener('input', () => this.updateValue());
  }

  private updateValue() {
    const decimalInput = document.getElementById(
      `${this.id}-decimal`
    ) as HTMLInputElement;
    const exponentInput = document.getElementById(
      `${this.id}-exponent`
    ) as HTMLInputElement;
    const decimal = parseFloat(decimalInput.value);
    const exponent = parseInt(exponentInput.value, 10);

    if (
      isNaN(decimal) ||
      isNaN(exponent) ||
      (!this.allowZero && decimal === 0)
    ) {
      decimalInput.classList.add('invalid-input');
      exponentInput.classList.add('invalid-input');
    } else {
      decimalInput.classList.remove('invalid-input');
      exponentInput.classList.remove('invalid-input');
      const newValue = decimal * Math.pow(10, exponent);
      this.value = newValue;
      this.onUpdate(newValue);
    }
  }

  setValue(value: number): void {
    this.value = value;
    let [decimal, exponent] = value.toExponential().split('e');
    if (parseInt(exponent) === 0) {
      exponent = '0';
    }

    const decimalInput = document.getElementById(
      `${this.id}-decimal`
    ) as HTMLInputElement;
    const exponentInput = document.getElementById(
      `${this.id}-exponent`
    ) as HTMLInputElement;

    decimalInput.value = parseFloat(decimal).toString();
    exponentInput.value = parseInt(exponent).toString();
  }
}
