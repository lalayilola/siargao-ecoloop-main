import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

type Language = "en" | "tl" | "ceb";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return "en";
    return (localStorage.getItem("selectedLanguage") as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem("selectedLanguage", lang);
    }
    i18n.changeLanguage(lang);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedLang = localStorage.getItem("selectedLanguage") as Language;
    if (savedLang && savedLang !== language) {
      setLanguageState(savedLang);
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
