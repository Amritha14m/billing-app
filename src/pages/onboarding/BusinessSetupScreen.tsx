import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { INDIAN_STATES, validateGSTIN, validateIndianPhone } from '../../lib/gst';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';

export const BusinessSetupScreen: React.FC = () => {
  const { createBusiness, completeOnboarding } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const [address, setAddress] = useState('');
  const [stateCode, setStateCode] = useState('27'); // Maharashtra default
  const [businessType, setBusinessType] = useState('retail');
  const [gstRegistered, setGstRegistered] = useState(false);
  const [gstin, setGstin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const businessTypes = [
    { value: 'retail', label: 'Retail Store / Shop' },
    { value: 'wholesale', label: 'Wholesale / Trader' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'service', label: 'Service Provider / Professional' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Company / Business name is required.');
      return;
    }

    if (phone.trim()) {
      const phoneVal = validateIndianPhone(phone);
      if (!phoneVal.isValid) {
        setError(phoneVal.message || 'Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    if (gstRegistered) {
      if (!gstin.trim()) {
        setError('Please enter your 15-character GSTIN number.');
        return;
      }
      const gstinVal = validateGSTIN(gstin.trim(), stateCode);
      if (!gstValIsOk(gstinVal)) {
        setError(gstinVal.message || 'Invalid GSTIN format or state code mismatch.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const selectedState = INDIAN_STATES.find((s) => s.code === stateCode);
      await createBusiness({
        name: name.trim(),
        mobile: phone.trim() || undefined,
        address: address.trim() || undefined,
        state: selectedState?.name || 'Maharashtra',
        state_code: stateCode,
        business_type: businessType,
        gst_registered: gstRegistered,
        gstin: gstRegistered ? gstin.trim().toUpperCase() : undefined,
      });

      completeOnboarding();
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Failed to save business profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const gstValIsOk = (res: { isValid: boolean }) => res.isValid;

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
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white font-black text-2xl shadow-md mb-2">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('business_setup_title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('business_setup_sub')}
          </p>
        </div>

        <Card className="shadow-lg border-slate-200/90 rounded-2xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Company / Business Name */}
              <Input
                label="Company / Business Name *"
                placeholder="e.g. Radhe Krishna Enterprises"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                required
                autoFocus
              />

              {/* Business Phone (Optional) */}
              <Input
                label="Business Phone (Optional)"
                placeholder="10-digit mobile number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
              />

              {/* Add shop location link */}
              {!showLocation ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowLocation(true)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    + {t('add_shop_location')}
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Shop Address</span>
                    <button
                      type="button"
                      onClick={() => setShowLocation(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      Hide
                    </button>
                  </div>
                  <Input
                    label="Shop / Office Address"
                    placeholder="Shop No. 4, Main Market Road"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <Select
                    label="State"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    options={INDIAN_STATES.map((s) => ({
                      value: s.code,
                      label: `${s.code} - ${s.name}`,
                    }))}
                  />
                </div>
              )}

              {/* Business Type */}
              <Select
                label={t('business_type')}
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                options={businessTypes}
              />

              {/* GST Registered Toggle */}
              <div className="pt-2">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <label
                      htmlFor="gstToggle"
                      className="text-xs font-bold text-slate-800 cursor-pointer block"
                    >
                      {t('gst_registered')}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Enable if you possess a valid 15-digit GSTIN
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="gstToggle"
                    checked={gstRegistered}
                    onChange={(e) => {
                      setGstRegistered(e.target.checked);
                      setError(null);
                    }}
                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                </div>

                {/* GSTIN Field (Only if enabled) */}
                {gstRegistered && (
                  <div className="mt-3 space-y-2">
                    <Select
                      label="State of Registration *"
                      value={stateCode}
                      onChange={(e) => {
                        setStateCode(e.target.value);
                        setError(null);
                      }}
                      options={INDIAN_STATES.map((s) => ({
                        value: s.code,
                        label: `${s.code} - ${s.name}`,
                      }))}
                    />
                    <Input
                      label="GSTIN *"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={gstin}
                      onChange={(e) => {
                        setGstin(e.target.value.toUpperCase());
                        setError(null);
                      }}
                      maxLength={15}
                      required
                    />
                    <p className="text-[11px] text-slate-400">
                      15 characters: 2-digit state code + PAN + 1 + Z + check code. State code must match registration state ({stateCode}).
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full font-bold shadow-md py-3 text-sm"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Saving...' : t('save_and_start')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
