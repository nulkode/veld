import { Component } from '@/ui/components/Component';

export abstract class PanelField extends Component {
  id: string;
  label: string;

  constructor(id: string, label: string) {
    super();
    this.id = id;
    this.label = label;
  }

  abstract getHTML(): string;
  abstract attachEvents(): void;
}

export abstract class ValuePanelField<T> extends PanelField {
  value: T;
  onUpdate?: (value: T) => void;
  labelGenerator?: (value: T) => string;

  constructor(
    id: string,
    label: string,
    value: T,
    onUpdate?: (value: T) => void,
    labelGenerator?: (value: T) => string
  ) {
    super(id, label);
    this.value = value;
    this.labelGenerator = labelGenerator;
    this.onUpdate = onUpdate;
  }

  setValue(value: T) {
    this.value = value;
    const span = document.getElementById(`${this.id}-value`);
    if (span) {
      span.innerHTML = this.getLabel(value);
    }
    const input = document.getElementById(this.id) as HTMLInputElement;
    if (input) {
      input.value =
        typeof value === 'string' || typeof value === 'number'
          ? value.toString()
          : '';
    }
  }

  getLabel(value: T): string {
    return this.labelGenerator ? this.labelGenerator(value) : `${value}`;
  }

  abstract getHTML(): string;
  abstract attachEvents(): void;
}
