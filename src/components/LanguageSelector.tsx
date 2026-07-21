import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';
import './LanguageSelector.css';

export default function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.resolvedLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="custom-lang-select" ref={containerRef}>
      <button 
        className="custom-lang-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Language"
        aria-expanded={isOpen}
      >
        <span>{compact ? currentLang.code.toUpperCase() : currentLang.label}</span>
        <svg 
          className={`custom-lang-arrow ${isOpen ? 'open' : ''}`}
          xmlns="http://www.w3.org/2000/svg" 
          width="16" height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <ul className="custom-lang-dropdown">
          {SUPPORTED_LANGUAGES.map((l) => (
            <li 
              key={l.code} 
              className={`custom-lang-option ${l.code === currentLang.code ? 'selected' : ''}`}
              onClick={() => handleSelect(l.code)}
            >
              {l.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
