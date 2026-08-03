// src/components/common/LanguageSwitcher.jsx
import React, { useEffect, useState } from 'react';

const LanguageSwitcher = () => {
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    // Check if a language preference was previously saved in the browser cookies
    const cookies = document.cookie;
    if (cookies.includes('/en/am')) {
      setCurrentLang('am');
    } else {
      setCurrentLang('en');
    }
  }, []);

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    
    // Find the hidden Google Translate dropdown element selector injected by the script
    const googleSelect = document.querySelector('.goog-te-combo');
    if (googleSelect) {
      googleSelect.value = langCode;
      // Trigger a native change event so the translation script catches the update instantly
      googleSelect.dispatchEvent(new Event('change'));
    }
  };

  return (
    <div className="flex items-center space-x-1.5 bg-white border border-gray-200 rounded-lg p-1 shadow-xs">
      <button
        type="button"
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
          currentLang === 'en' 
            ? 'bg-indigo-600 text-white shadow-sm' 
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        🇺🇸 English
      </button>
      <button
        type="button"
        onClick={() => changeLanguage('am')}
        className={`px-3 py-1 text-xs font-bold rounded-md transition-all font-mono ${
          currentLang === 'am' 
            ? 'bg-indigo-600 text-white shadow-sm' 
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        🇪🇹 አማርኛ
      </button>

      {/* Hidden placeholder target container required by the Google Script engine */}
      <div id="google_translate_element" className="hidden"></div>
    </div>
  );
};

export default LanguageSwitcher;