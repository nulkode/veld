import { PanelField } from './PanelField';

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
          <label>${this.label}</label>
          <button id="${this.id}">${this.buttonText}</button>
        </div>
      `;
  }

  attachEvents() {
    document.getElementById(this.id)?.addEventListener('click', this.onClick);
  }
}
