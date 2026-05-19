import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "welcome": "Welcome to Aegis OS",
      "consent_title": "Privacy & Clinical Consent",
      "understand_btn": "I understand — begin triage"
    }
  },
  hi: {
    translation: {
      "welcome": "एजिस ओएस में आपका स्वागत है",
      "consent_title": "गोपनीयता और नैदानिक सहमति",
      "understand_btn": "मैं समझता हूँ — ट्राइएज शुरू करें"
    }
  },
  kn: {
    translation: {
      "welcome": "ಏಜಿಸ್ ಓಎಸ್ ಗೆ ಸ್ವಾಗತ",
      "consent_title": "ಗೌಪ್ಯತೆ ಮತ್ತು ಕ್ಲಿನಿಕಲ್ ಒಪ್ಪಿಗೆ",
      "understand_btn": "ನನಗೆ ಅರ್ಥವಾಗಿದೆ — ಟ್ರಯಾಜ್ ಪ್ರಾರಂಭಿಸಿ"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
