// Auth, Multi-Business & App Security Context for BizLedger
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Business, UserRole } from '../types';
import {
  getLocalBusinesses,
  saveLocalBusiness,
  getDB,
} from '../lib/db';
import {
  INITIAL_BUSINESS,
  INITIAL_PARTIES,
  INITIAL_ITEMS,
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_EXPENSES,
} from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UserSession {
  id: string;
  phone?: string;
  email?: string;
  name: string;
}

interface AuthContextType {
  user: UserSession | null;
  role: UserRole;
  businesses: Business[];
  activeBusiness: Business | null;
  isLoading: boolean;
  isOnboardingCompleted: boolean;
  isLocked: boolean;
  hasPin: boolean;
  setActiveBusiness: (business: Business) => void;
  createBusiness: (data: Partial<Business>) => Promise<Business>;
  updateActiveBusiness: (data: Partial<Business>) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemo: () => void;
  loginWithPhoneOtp: (phone: string) => Promise<{ success: boolean; message?: string; isTestMode?: boolean }>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  loginWithEmail: (email: string) => void;
  completeOnboarding: () => void;
  unlockApp: (pin: string) => boolean;
  setAppPin: (pin: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('bizledger_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    // Default demo user for seamless start
    return {
      id: 'usr_owner_001',
      phone: '+919876543210',
      name: 'Business Owner',
    };
  });

  const [role, setRole] = useState<UserRole>('owner');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusinessState] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Onboarding & App Lock
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(() => {
    return localStorage.getItem('bizledger_onboarding_completed') === 'true';
  });

  const [hasPin, setHasPin] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('bizledger_app_lock_pin'));
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('bizledger_app_lock_pin'));
  });

  // Initialize and seed local database if empty
  useEffect(() => {
    async function init() {
      try {
        const localBizList = await getLocalBusinesses();
        if (localBizList.length === 0) {
          // Seed database with starter business
          const db = await getDB();
          await db.put('businesses', INITIAL_BUSINESS);

          for (const p of INITIAL_PARTIES) await db.put('parties', p);
          for (const item of INITIAL_ITEMS) await db.put('items', item);
          for (const acc of INITIAL_ACCOUNTS) await db.put('accounts', acc);
          for (const tx of INITIAL_TRANSACTIONS) await db.put('transactions', tx);
          for (const exp of INITIAL_EXPENSES) await db.put('expenses', exp);

          setBusinesses([INITIAL_BUSINESS]);
          setActiveBusinessState(INITIAL_BUSINESS);
        } else {
          setBusinesses(localBizList);
          const savedActiveId = localStorage.getItem('bizledger_active_business_id');
          const found = localBizList.find((b) => b.id === savedActiveId) || localBizList[0];
          setActiveBusinessState(found);
        }
      } catch (err) {
        console.error('Failed to initialize local business storage:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const setActiveBusiness = (biz: Business) => {
    setActiveBusinessState(biz);
    localStorage.setItem('bizledger_active_business_id', biz.id);
  };

  const createBusiness = async (data: Partial<Business>): Promise<Business> => {
    const newBiz: Business = {
      id: `biz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: data.name || 'My Business',
      mobile: data.mobile || '',
      email: data.email || '',
      address: data.address || '',
      state: data.state || 'Maharashtra',
      state_code: data.state_code || '27',
      pincode: data.pincode || '',
      gst_registered: Boolean(data.gst_registered),
      gstin: data.gstin || '',
      business_type: data.business_type || 'Retail',
      financial_year_start: '2026-04-01',
      currency: 'INR',
      invoice_prefix: data.invoice_prefix || 'INV/',
      invoice_next_number: 1,
      default_terms: data.default_terms || '1. Payment due upon receipt of invoice.',
      bank_name: data.bank_name || '',
      account_no: data.account_no || '',
      ifsc_code: data.ifsc_code || '',
      upi_id: data.upi_id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    };

    await saveLocalBusiness(newBiz);
    const updated = [...businesses, newBiz];
    setBusinesses(updated);
    setActiveBusiness(newBiz);

    // Also create default Cash account
    const db = await getDB();
    await db.put('accounts', {
      id: `acc_cash_${Date.now()}`,
      business_id: newBiz.id,
      account_name: 'Cash in Hand',
      account_type: 'cash',
      opening_balance: 0,
      current_balance: 0,
      created_at: new Date().toISOString(),
    });

    return newBiz;
  };

  const updateActiveBusiness = async (data: Partial<Business>): Promise<void> => {
    if (!activeBusiness) return;
    const updatedBiz: Business = {
      ...activeBusiness,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await saveLocalBusiness(updatedBiz);
    setActiveBusinessState(updatedBiz);
    setBusinesses((prev) => prev.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)));
  };

  const completeOnboarding = () => {
    setIsOnboardingCompleted(true);
    localStorage.setItem('bizledger_onboarding_completed', 'true');
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
    localStorage.removeItem('bizledger_user');
  };

  const loginAsDemo = () => {
    const demoUser: UserSession = {
      id: 'usr_demo_001',
      email: 'admin@bizledger.app',
      name: 'Business Owner',
    };
    setUser(demoUser);
    localStorage.setItem('bizledger_user', JSON.stringify(demoUser));
    setRole('owner');
  };

  const loginWithEmail = (email: string) => {
    const emailUser: UserSession = {
      id: `usr_${Date.now()}`,
      email,
      name: email.split('@')[0] || 'Business User',
    };
    setUser(emailUser);
    localStorage.setItem('bizledger_user', JSON.stringify(emailUser));
    setRole('owner');
  };

  const loginWithPhoneOtp = async (
    phone: string
  ): Promise<{ success: boolean; message?: string; isTestMode?: boolean }> => {
    // Check if development test number (+919999999999 or 9999999999)
    const cleanDigits = phone.replace(/\D/g, '');
    const isDevNumber = cleanDigits.endsWith('9999999999');

    if (isDevNumber) {
      return {
        success: true,
        message: 'Dev test number detected. Use fixed OTP: 123456',
        isTestMode: true,
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message:
          'SMS provider not configured on Supabase backend. Please configure Twilio or MSG91 in Supabase Auth Settings, or use Email / Dev Test number (+91 9999999999).',
      };
    }

    try {
      const fullPhone = cleanDigits.startsWith('91') ? `+${cleanDigits}` : `+91${cleanDigits}`;
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to send OTP via SMS provider',
      };
    }
  };

  const verifyPhoneOtp = async (
    phone: string,
    otp: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanDigits = phone.replace(/\D/g, '');
    const isDevNumber = cleanDigits.endsWith('9999999999');

    // Dev test number verification
    if (isDevNumber) {
      if (otp === '123456') {
        const phoneUser: UserSession = {
          id: `usr_phone_${cleanDigits}`,
          phone: `+91${cleanDigits.slice(-10)}`,
          name: 'Business Owner',
        };
        setUser(phoneUser);
        localStorage.setItem('bizledger_user', JSON.stringify(phoneUser));
        return { success: true };
      }
      return { success: false, message: 'Invalid test OTP. Please enter 123456.' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'SMS provider not configured on Supabase backend.',
      };
    }

    try {
      const fullPhone = cleanDigits.startsWith('91') ? `+${cleanDigits}` : `+91${cleanDigits}`;
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms',
      });
      if (error) {
        return { success: false, message: error.message };
      }
      const phoneUser: UserSession = {
        id: data.user?.id || `usr_phone_${cleanDigits}`,
        phone: fullPhone,
        name: 'Business Owner',
      };
      setUser(phoneUser);
      localStorage.setItem('bizledger_user', JSON.stringify(phoneUser));
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'OTP verification failed' };
    }
  };

  const unlockApp = (pin: string): boolean => {
    const savedPin = localStorage.getItem('bizledger_app_lock_pin');
    if (!savedPin || savedPin === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const setAppPin = (pin: string | null) => {
    if (pin) {
      localStorage.setItem('bizledger_app_lock_pin', pin);
      setHasPin(true);
      setIsLocked(false);
    } else {
      localStorage.removeItem('bizledger_app_lock_pin');
      setHasPin(false);
      setIsLocked(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        businesses,
        activeBusiness,
        isLoading,
        isOnboardingCompleted,
        isLocked,
        hasPin,
        setActiveBusiness,
        createBusiness,
        updateActiveBusiness,
        logout,
        loginAsDemo,
        loginWithPhoneOtp,
        verifyPhoneOtp,
        loginWithEmail,
        completeOnboarding,
        unlockApp,
        setAppPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
