import { PanelField } from '@/ui/components/fields/PanelField';
import '@/styles/panels/fields/button.css';
import { t } from '@/ui';

export class PanelButtonField extends PanelField {
  buttonText: string;
  onClick: () => void;

  constructor(
    id: string,
    label: string,
    buttonText: string,
    onClick: () => void
  ) {
    super(id, label);
    this.buttonText = buttonText;
    this.onClick = onClick;
  }

  getHTML() {
    return `
        <div>
          ${
            this.label === ''
              ? ''
              : `<label for="${this.id}">${t(this.label) ?? this.label}</label>`
          }
          <button id="${this.id}">${
      t(this.buttonText) ?? this.buttonText
    }</button>
        </div>
      `;
  }

  attachEvents() {
    document.getElementById(this.id)?.addEventListener('click', this.onClick);
  }
}
