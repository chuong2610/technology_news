import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations';

function useTranslation() {
  const { language } = useLanguage();
  
  const t = (key, params = {}) => {
    let translation = getTranslation(language, key);
    
    // Simple parameter substitution
    if (typeof translation === 'string' && Object.keys(params).length > 0) {
      Object.keys(params).forEach(param => {
        // Support both {param} and {{param}} formats
        translation = translation.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), params[param]);
        translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
      });
    }
    
    return translation;
  };
  
  return { t };
}

export { useTranslation };
export default useTranslation;
