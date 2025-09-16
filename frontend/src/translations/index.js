import { en } from './en';
import { vi } from './vi';

export const translations = {
  en,
  vi
};

export const getTranslation = (language, key) => {
  const keys = key.split('.');
  let translation = translations[language];
  
  for (const k of keys) {
    if (translation && typeof translation === 'object') {
      translation = translation[k];
    } else {
      // Fallback to English if translation not found
      translation = translations['en'];
      for (const fallbackKey of keys) {
        if (translation && typeof translation === 'object') {
          translation = translation[fallbackKey];
        } else {
          return key; // Return the key if no translation found
        }
      }
      break;
    }
  }
  
  return translation || key;
};
