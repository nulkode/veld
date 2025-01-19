import { Component } from '@/ui/components/Component';
import { i18nManager, t } from '@/ui';
import { Language } from '@/logic/managers/I18nManager';
import '@/styles/overlay/settings.css';

export class Settings extends Component {
  getHTML() {
    const currentLanguage = i18nManager.currentLanguage;
    return `
      <div id="settings">
        <img id="settings-icon" src="icons/settings.svg" />
        <div id="settings-menu">
          <label for="language-select">${t('settings.language.label')}</label>
          <select id="language-select">
            <option value="en" ${currentLanguage === Language.EN ? 'selected' : ''}>${t('settings.language.en')}</option>
            <option value="es" ${currentLanguage === Language.ES ? 'selected' : ''}>${t('settings.language.es')}</option>
            <option value="fr" ${currentLanguage === Language.FR ? 'selected' : ''}>${t('settings.language.fr')}</option>
          </select>
        </div>
      </div>`;
  }

  attachEvents() {
    const settingsIcon = document.getElementById('settings-icon')!;
    const settingsMenu = document.getElementById('settings-menu')!;
    const languageSelect = document.getElementById('language-select')! as HTMLSelectElement;

    settingsIcon.addEventListener('click', () => {
      settingsMenu.classList.toggle('visible');
    });

    languageSelect.addEventListener('change', (event) => {
      const selectedLanguage = (event.target as HTMLSelectElement).value;
      i18nManager.setLanguage(selectedLanguage as Language);
    });
  }
}
