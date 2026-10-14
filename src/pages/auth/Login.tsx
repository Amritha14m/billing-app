import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Mail, Lock, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { validateIndianPhone } from '../../lib/gst';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

export const Login: React.FC = () => {
  const { loginWithPhoneOtp, verifyPhoneOtp, loginWithEmail, loginAsDemo, isOnboardingCompleted } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Mode: 'phone' | 'otp' | 'email'
  const [mode, setMode] = useState<'phone' | 'otp' | 'email'>('phone');

  // Phone & OTP state
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [attemptCount, setAttemptCount] = useState(0);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend Countdown
  useEffect(() => {
    let interval: any = null;
    if (mode === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, resendTimer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPhoneError(null);
    setStatusNotice(null);

    const validation = validateIndianPhone(phone);
    if (!validation.isValid) {
      setPhoneError(validation.message || 'Please enter a valid 10-digit mobile number');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithPhoneOtp(`${countryCode}${phone}`);
      if (res.success) {
        setIsTestMode(Boolean(res.isTestMode));
        if (res.message) setStatusNotice(res.message);
        setMode('otp');
        setResendTimer(30);
        setAttemptCount(0);
        setOtp(['', '', '', '', '', '']);
      } else {
        setPhoneError(res.message || 'Failed to send OTP.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOtpError(null);

    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setOtpError('Please enter all 6 digits of the OTP.');
      return;
    }

    if (attemptCount >= 3) {
      setOtpError('Too many failed attempts. Please request a new OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyPhoneOtp(`${countryCode}${phone}`, fullOtp);
      if (res.success) {
        if (!isOnboardingCompleted) {
          navigate('/welcome/business-setup');
        } else {
          navigate('/');
        }
      } else {
        setAttemptCount((prev) => prev + 1);
        setOtpError(res.message || 'Incorrect OTP. Please check and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Pasting full OTP
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    loginWithEmail(email);
    if (!isOnboardingCompleted) {
      navigate('/welcome/business-setup');
    } else {
      navigate('/');
    }
  };

  const handleFillDevTestNumber = () => {
    setPhone('9999999999');
    setPhoneError(null);
  };

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6"
      style={{
        paddingTop: 'calc(1.5rem + var(--safe-area-top))',
        paddingBottom: 'calc(1.5rem + var(--safe-area-bottom))',
        paddingLeft: 'calc(1rem + var(--safe-area-left))',
        paddingRight: 'calc(1rem + var(--safe-area-right))',
      }}
    >
      <div className="max-w-md w-full">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white font-black text-2xl shadow-md mb-2">
            BL
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            BizLedger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Indian GST Billing, Parties & Inventory Management
          </p>
        </div>

        <Card className="shadow-lg border-slate-200/90 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            {/* MODE 1: PHONE NUMBER INPUT */}
            {mode === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {t('login_title')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    We will send a 6-digit verification code to your phone
                  </p>
                </div>

                {phoneError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{phoneError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mobile Number *
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Country Code Chip */}
                    <div className="px-3 py-2.5 bg-slate-100 border border-slate-300 rounded-xl font-bold text-xs text-slate-700 shrink-0 select-none">
                      {countryCode}
                    </div>
                    {/* 10-Digit Mobile Input */}
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoFocus
                      maxLength={10}
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ''));
                        setPhoneError(null);
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 tracking-wider"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Valid Indian 10-digit number starting with 6–9
                  </p>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting || phone.length < 10}
                  className="w-full font-bold shadow-md py-3 text-sm"
                  rightIcon={
                    isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )
                  }
                >
                  {isSubmitting ? 'Sending OTP...' : t('get_otp')}
                </Button>

                {/* Dev test shortcut & fallback */}
                <div className="pt-2 border-t border-slate-100 space-y-2 text-center">
                  <button
                    type="button"
                    onClick={handleFillDevTestNumber}
                    className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 hover:bg-amber-100"
                  >
                    🛠️ Use Dev Test Number (9999999999 / OTP 123456)
                  </button>

                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setMode('email')}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      {t('use_email_instead')}
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        loginAsDemo();
                        if (!isOnboardingCompleted) navigate('/welcome/business-setup');
                        else navigate('/');
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Instant Demo
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* MODE 2: OTP INPUT */}
            {mode === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Verify OTP
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('otp_sent_to')} <span className="font-bold text-slate-700">{countryCode} {phone}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('phone');
                      setOtpError(null);
                    }}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 underline"
                  >
                    {t('edit_number')}
                  </button>
                </div>

                {statusNotice && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{statusNotice}</span>
                  </div>
                )}

                {otpError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{otpError}</span>
                  </div>
                )}

                {/* 6 Digit OTP inputs */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                    {t('enter_otp')}
                  </label>
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-12 text-center text-lg font-black rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting || otp.join('').length < 6}
                  className="w-full font-bold shadow-md py-3 text-sm"
                  rightIcon={
                    isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )
                  }
                >
                  {isSubmitting ? 'Verifying...' : t('verify_otp')}
                </Button>

                {/* Resend OTP */}
                <div className="pt-2 text-center text-xs">
                  {resendTimer > 0 ? (
                    <span className="text-slate-400 font-medium">
                      {t('resend_otp_in')} <strong className="text-slate-700">{resendTimer}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="font-bold text-brand-600 hover:text-brand-700 underline"
                    >
                      {t('resend_otp')}
                    </button>
                  )}
                </div>

                {isTestMode && (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-center text-[11px] text-amber-800">
                    💡 Dev Test Mode: Enter <strong>123456</strong> as OTP.
                  </div>
                )}
              </form>
            )}

            {/* MODE 3: EMAIL & PASSWORD FALLBACK */}
            {mode === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Sign In with Email
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fallback access for owners and accounting staff
                  </p>
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@mybusiness.com"
                  required
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  leftIcon={<Lock className="w-4 h-4" />}
                />

                <Button
                  variant="primary"
                  type="submit"
                  className="w-full font-bold shadow-md py-3 text-sm"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In
                </Button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setMode('phone')}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Mobile Login
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer links */}
        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-slate-500">
          <Link to="/privacy-policy" className="hover:text-brand-600 underline">
            {t('privacy_policy')}
          </Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-brand-600 underline">
            {t('terms_of_service')}
          </Link>
        </div>
      </div>
    </div>
  );
};
