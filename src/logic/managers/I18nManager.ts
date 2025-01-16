import get from 'lodash/get';
import { EventEmitter } from '@/logic/managers/EventManager';
import enTranslations from '@/i18n/en.json';

export enum Language {
  EN = 'en',
}

export class I18nManager extends EventEmitter {
  currentLanguage = Language.EN;
  translations = {};

  constructor() {
    super();
  }

  getTranslations(language: Language) {
    switch (language) {
      case Language.EN:
        return enTranslations;
      default:
        return enTranslations;
    }
  }

  setLanguage(language: Language) {
    this.currentLanguage = language;
    this.translations = this.getTranslations(language);
    this.emit('languageChange', language);
  }

  getTranslation(key: string) {
    return get(this.translations, key, key);
  }
}
