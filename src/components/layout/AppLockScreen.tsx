import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const AppLockScreen: React.FC = () => {
  const { unlockApp } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockApp(pin);
    if (!success) {
      setError(true);
      setPin('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col items-center justify-center p-4 select-none"
      style={{
        paddingTop: 'calc(1.5rem + var(--safe-area-top))',
        paddingBottom: 'calc(1.5rem + var(--safe-area-bottom))',
        paddingLeft: 'calc(1rem + var(--safe-area-left))',
        paddingRight: 'calc(1rem + var(--safe-area-right))',
      }}
    >
      <div className="max-w-xs w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-lg mb-2">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">BizLedger Locked</h2>
          <p className="text-xs text-slate-500 mt-1">Enter your 4-digit PIN to access your account</p>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Incorrect PIN. Try again.</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''));
              setError(false);
            }}
            placeholder="••••"
            className="w-full py-3 text-center text-2xl font-mono tracking-[0.5em] rounded-2xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            autoFocus
            required
          />

          <Button
            variant="primary"
            type="submit"
            disabled={pin.length !== 4}
            className="w-full py-3 font-bold text-sm shadow-md"
          >
            Unlock Application
          </Button>
        </form>
      </div>
    </div>
  );
};
