import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INDIAN_STATES, validateGSTIN } from '../../lib/gst';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const BusinessOnboarding: React.FC = () => {
  const { createBusiness } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Business Info
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [stateCode, setStateCode] = useState('27');
  const [pincode, setPincode] = useState('');

  // GST & Type
  const [gstRegistered, setGstRegistered] = useState(true);
  const [gstin, setGstin] = useState('');
  const [businessType, setBusinessType] = useState('Wholesale/distribution');
  const [gstError, setGstError] = useState<string | null>(null);

  // Invoice & Bank
  const [invoicePrefix, setInvoicePrefix] = useState('INV-26/');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        alert('Please enter business name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (gstRegistered && gstin.trim()) {
        const val = validateGSTIN(gstin.trim());
        if (!val.isValid) {
          setGstError(val.message || 'Invalid GSTIN');
          return;
        }
      }
      setStep(3);
    } else if (step === 3) {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    const stateObj = INDIAN_STATES.find((s) => s.code === stateCode);
    await createBusiness({
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      address: address.trim(),
      state: stateObj?.name || 'Maharashtra',
      state_code: stateCode,
      pincode: pincode.trim(),
      gst_registered: gstRegistered,
      gstin: gstRegistered ? gstin.trim().toUpperCase() : undefined,
      business_type: businessType,
      invoice_prefix: invoicePrefix.trim() || 'INV/',
      bank_name: bankName.trim(),
      account_no: accountNo.trim(),
      ifsc_code: ifscCode.trim().toUpperCase(),
      upi_id: upiId.trim(),
    });

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="max-w-xl w-full">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-xl mb-2 shadow-md">
            BL
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Set Up Your Business
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure GST, invoice numbering, and business details for BizLedger
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs font-semibold">
          <div className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            1. Profile
          </div>
          <span className="text-slate-300">──</span>
          <div className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            2. GST & Type
          </div>
          <span className="text-slate-300">──</span>
          <div className={`px-3 py-1 rounded-full ${step >= 3 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            3. Invoicing
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {step === 1 && (
              <div className="space-y-4">
                <Input
                  label="Business Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Traders & Distributors"
                  required
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Mobile Number *"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile number"
                    required
                  />
                  <Input
                    label="Business Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@business.com"
                  />
                </div>
                <Input
                  label="Business Street Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Shop #, Street, City"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Business State *"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    options={INDIAN_STATES.map((s) => ({
                      value: s.code,
                      label: `${s.code} - ${s.name}`,
                    }))}
                  />
                  <Input
                    label="PIN Code"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="6-digit PIN"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Select
                  label="Business Category / Industry *"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  options={[
                    { value: 'Retail', label: 'Retail Shop' },
                    { value: 'Wholesale/distribution', label: 'Wholesale & Distribution' },
                    { value: 'Manufacturing', label: 'Manufacturing' },
                    { value: 'Grocery', label: 'Grocery / Supermarket' },
                    { value: 'Pharmacy', label: 'Pharmacy / Healthcare' },
                    { value: 'Clothing', label: 'Clothing & Apparel' },
                    { value: 'Restaurant', label: 'Restaurant / Cafe' },
                    { value: 'Services', label: 'Professional Services' },
                    { value: 'Other', label: 'Other Business' },
                  ]}
                />

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="gstRegCheck"
                      checked={gstRegistered}
                      onChange={(e) => setGstRegistered(e.target.checked)}
                      className="w-4 h-4 text-brand-600 rounded"
                    />
                    <label htmlFor="gstRegCheck" className="text-xs font-semibold text-slate-900">
                      My business is registered under GST
                    </label>
                  </div>

                  {gstRegistered && (
                    <Input
                      label="15-digit GSTIN *"
                      value={gstin}
                      onChange={(e) => {
                        setGstin(e.target.value.toUpperCase());
                        setGstError(null);
                      }}
                      error={gstError || undefined}
                      placeholder="e.g. 27AABCA1234F1Z5"
                      helperText="GSTIN will be printed on all your sales tax invoices."
                    />
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Input
                  label="Invoice Number Prefix *"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="e.g. INV-26/ or BILL/"
                  helperText="Prefix for auto-incrementing invoice numbers (e.g., INV-26/101)"
                />

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Bank & UPI for Invoice Printing (Optional)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Bank Name"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                    />
                    <Input
                      label="Account Number"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      placeholder="Account number"
                    />
                    <Input
                      label="IFSC Code"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                    />
                    <Input
                      label="UPI ID / VPA"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. business@upi"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Buttons */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
              {step > 1 ? (
                <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
              ) : (
                <div></div>
              )}

              <Button variant="primary" onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
                {step === 3 ? 'Finish & Open Dashboard' : 'Next Step'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
