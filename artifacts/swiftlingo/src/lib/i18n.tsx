import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ru' | 'uz';

const translations = {
  en: {
    home: 'Home',
    jobs: 'Jobs',
    contracts: 'Contracts',
    profile: 'Profile',
    notifications: 'Notifications',
    post_job: 'Post Job',
    browse_jobs: 'Browse Jobs',
    login_dev: 'Dev Login',
    loading: 'Loading...',
  },
  ru: {
    home: 'Главная',
    jobs: 'Заказы',
    contracts: 'Контракты',
    profile: 'Профиль',
    notifications: 'Уведомления',
    post_job: 'Разместить заказ',
    browse_jobs: 'Искать заказы',
    login_dev: 'Вход для разработчиков',
    loading: 'Загрузка...',
  },
  uz: {
    home: 'Asosiy',
    jobs: 'Ishlar',
    contracts: 'Shartnomalar',
    profile: 'Profil',
    notifications: 'Bildirishnomalar',
    post_job: 'Ish joylash',
    browse_jobs: 'Ishlarni qidirish',
    login_dev: 'Dasturchi kirish',
    loading: 'Yuklanmoqda...',
  }
};

type Translations = typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('swiftlingo_lang');
    if (saved && (saved === 'en' || saved === 'ru' || saved === 'uz')) {
      return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('swiftlingo_lang', lang);
  };

  const t = (key: keyof Translations) => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
