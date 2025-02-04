import { Component } from '@/ui/components/Component';
import { Toolbar } from '@/ui/components/overlay/Toolbar';
import { TopMenu } from '@/ui/components/overlay/TopMenu';
import '@/styles/overlay/layout.css';

export class Layout extends Component {
  private topMenu: TopMenu;
  private toolbar: Toolbar;

  constructor(
    topMenu: TopMenu,
    toolbar: Toolbar
  ) {
    super();
    this.topMenu = topMenu;
    this.toolbar = toolbar;
  }

  getHTML(): string {
    return `
      <div id="layout">
        <div id="top-menu-container">
          ${this.topMenu.getHTML()}
        </div>
      </div>
    `;
  }

  attachEvents(): void {
    this.topMenu.attachEvents();
    this.toolbar.attachEvents();
  }
}
