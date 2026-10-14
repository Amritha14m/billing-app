import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../../lib/i18n';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/ui/Button';

export const LanguageSelectScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [selected, setSelected] = useState<LanguageCode | null>(language || null);

  const handleSelect = (code: LanguageCode) => {
    setSelected(code);
    setLanguage(code);
  };

  const handleContinue = () => {
    if (!selected) return;
    navigate('/welcome/permissions');
  };

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto"
      style={{
        paddingTop: 'calc(1rem + var(--safe-area-top))',
        paddingBottom: 'calc(1.5rem + var(--safe-area-bottom))',
        paddingLeft: 'calc(1rem + var(--safe-area-left))',
        paddingRight: 'calc(1rem + var(--safe-area-right))',
      }}
    >
      {/* Header */}
      <div className="pt-6 sm:pt-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white font-black text-2xl shadow-lg mb-3">
          BL
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('select_language')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Choose your preferred language for billing & accounts
        </p>
      </div>

      {/* Language Grid: 2 columns */}
      <div className="grid grid-cols-2 gap-3 my-6">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isChosen = selected === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between shadow-subtle ${
                isChosen
                  ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500 shadow-md scale-[1.01]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                    isChosen
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {lang.avatarChar}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{lang.nativeName}</p>
                  <p className="text-[11px] text-slate-500">{lang.name}</p>
                </div>
              </div>

              {isChosen && (
                <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Sticky Action */}
      <div className="pb-6 pt-2">
        <Button
          variant="primary"
          size="lg"
          disabled={!selected}
          onClick={handleContinue}
          className="w-full text-base font-bold shadow-lg py-3.5"
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          {t('start_using_bizledger')}
        </Button>
      </div>
    </div>
  );
};
