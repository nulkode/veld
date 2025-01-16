import get from 'lodash/get';
import { EventEmitter } from '@/logic/managers/EventManager';
import enTranslations from '@/i18n/en.json';
import esTranslations from '@/i18n/es.json';

export enum Language {
  EN = 'en',
  ES = 'es',
}

export class I18nManager extends EventEmitter {
  currentLanguage = Language.EN;
  translations = {};
  initializing = true;

  constructor() {
    super();
    this.loadLanguagePreference();
    this.initializing = false;
  }

  loadLanguagePreference() {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      this.setLanguage(savedLanguage as Language);
    } else {
      const browserLanguage = navigator.language.split('-')[0] as Language;
      if (Object.values(Language).includes(browserLanguage)) {
        this.setLanguage(browserLanguage);
      } else {
        this.setLanguage(Language.EN);
      }
    }
  }

  saveLanguagePreference(language: Language) {
    localStorage.setItem('preferredLanguage', language);
  }

  getTranslations(language: Language) {
    switch (language) {
      case Language.EN:
        return enTranslations;
      case Language.ES:
        return esTranslations;
      default:
        return enTranslations;
    }
  }

  setLanguage(language: Language) {
    this.currentLanguage = language;
    this.translations = this.getTranslations(language);
    this.saveLanguagePreference(language);
    if (!this.initializing) {
      console.log('Language changed to', language);
      this.emit('languageChange', language);
    }
  }

  getTranslation(key: string) {
    return get(this.translations, key, key);
  }
}
