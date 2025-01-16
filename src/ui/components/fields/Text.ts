import { t } from '@/ui';
import { PanelField } from '@/ui/components/fields/PanelField';

export class PanelTextField extends PanelField {
  content: string;

  constructor(id: string, label: string, content: string) {
    super(id, label);
    this.content = content;
  }

  getHTML() {
    return `<div><label>${t(this.label) ?? this.label}</label><p>${t(this.content) ?? this.content}</p></div>`;
  }

  attachEvents() {}
}
