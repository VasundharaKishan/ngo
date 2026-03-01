import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LANGUAGES = [
  { code: 'en', label: 'EN', nativeLabel: 'English' },
  { code: 'hi', label: 'हिं', nativeLabel: 'हिन्दी' },
];

/** RTL languages — update document direction when switching */
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur']);

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
    document.documentElement.dir = RTL_LANGS.has(code) ? 'rtl' : 'ltr';
  };

  return (
    <div className="language-switcher" role="group" aria-label="Language selection">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`lang-btn ${i18n.language.startsWith(lang.code) ? 'lang-btn--active' : ''}`}
          aria-pressed={i18n.language.startsWith(lang.code)}
          title={lang.nativeLabel}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
