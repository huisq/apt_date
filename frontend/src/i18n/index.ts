import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh'],
    debug: true,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    backend: {
      loadPath: '/i18n/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },
    react: {
      useSuspense: false,
    },
  });

  i18n.on('initialized', (options) => {
    console.log('i18next initialized:', options);
  });
  
  i18n.on('loaded', (loaded) => {
    console.log('i18next loaded:', loaded);
  });
  
  i18n.on('failedLoading', (lng, ns, msg) => {
    console.error('i18next failed loading:', lng, ns, msg);
  });

export default i18n;