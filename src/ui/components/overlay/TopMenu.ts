import { Component } from '@/ui/components/Component';
import '@/styles/overlay/top-menu.css';

export class TopMenu extends Component {
  constructor() {
    super();
  }

  getHTML(): string {
    return `
      <div class="top-menu">
        <button class="menu-button">Menu</button>
        <div class="dropdown-content">
          <a href="#">Link 1</a>
          <a href="#">Link 2</a>
          <a href="#">Link 3</a>
        </div>
      </div>
    `;
  }

  attachEvents(): void {
    const button = document.querySelector('.menu-button');
    const dropdown = document.querySelector('.dropdown-content');

    button?.addEventListener('click', () => {
      dropdown?.classList.toggle('show');
    });
  }
}
