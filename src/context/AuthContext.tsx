// Auth & Multi-Business Context for BizLedger
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

interface AuthContextType {
  user: { id: string; email: string; name: string } | null;
  role: UserRole;
  businesses: Business[];
  activeBusiness: Business | null;
  isLoading: boolean;
  setActiveBusiness: (business: Business) => void;
  createBusiness: (data: Partial<Business>) => Promise<Business>;
  updateActiveBusiness: (data: Partial<Business>) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>({
    id: 'usr_demo_001',
    email: 'admin@bizledger.app',
    name: 'Business Owner',
  });
  const [role, setRole] = useState<UserRole>('owner');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusinessState] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const loginAsDemo = () => {
    setUser({
      id: 'usr_demo_001',
      email: 'admin@bizledger.app',
      name: 'Business Owner',
    });
    setRole('owner');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        businesses,
        activeBusiness,
        isLoading,
        setActiveBusiness,
        createBusiness,
        updateActiveBusiness,
        logout,
        loginAsDemo,
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
