import { PanelField } from './PanelField';

export class PanelTextField extends PanelField {
  content: string;

  constructor(id: string, label: string, content: string) {
    super(id, label);
    this.content = content;
  }

  getHTML() {
    return `<div><label>${this.label}</label><p>${this.content}</p></div>`;
  }

  attachEvents() {
    // No events to attach for static text
  }
}
