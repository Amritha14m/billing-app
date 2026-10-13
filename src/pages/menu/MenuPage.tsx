import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  ShoppingCart,
  TrendingDown,
  Globe,
  BarChart3,
  Landmark,
  Wallet,
  CheckSquare,
  CircleDollarSign,
  RefreshCw,
  Building2,
  Database,
  Wrench,
  Monitor,
  Share2,
  Settings,
  HelpCircle,
  Star,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  FileCheck,
  Truck,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
  ScanBarcode,
  Upload,
  Download,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { BusinessSwitcherModal } from '../../components/layout/BusinessSwitcherModal';
import { EditBusinessNameModal } from '../../components/layout/EditBusinessNameModal';

export const MenuPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const { status, triggerSync, pendingCount } = useSync();
  const navigate = useNavigate();

  // Accordion state for expandable rows
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    sale: true,
    purchase: false,
    backup: false,
    utilities: false,
    grow: false,
    help: false,
  });

  // Modals
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateStars, setRateStars] = useState(5);
  const [rateFeedback, setRateFeedback] = useState('');
  const [rateSubmitted, setRateSubmitted] = useState(false);

  const toggleExpand = (key: string) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRateSubmitted(true);
    setTimeout(() => {
      setRateSubmitted(false);
      setIsRateModalOpen(false);
    }, 1800);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24">
      <div className="px-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          BizLedger Menu
        </h1>
        <p className="text-xs text-slate-500">
          All business modules, accounting ledgers, utilities, and tools
        </p>
      </div>

      {/* CARD 1: MY BUSINESS */}
      <Card className="rounded-2xl border-slate-200/90 shadow-subtle overflow-hidden">
        <div className="bg-slate-50/70 px-4 py-2.5 border-b border-slate-100 font-extrabold text-xs text-slate-500 uppercase tracking-wider">
          Card 1: My Business
        </div>
        <div className="divide-y divide-slate-100">
          {/* 1.1 SALE (Expandable) */}
          <div>
            <div
              onClick={() => toggleExpand('sale')}
              className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Sale</h4>
                  <p className="text-[11px] text-slate-500">Invoices, Estimates, Quotations, Orders, Returns</p>
                </div>
              </div>
              {expandedRows.sale ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>

            {expandedRows.sale && (
              <div className="bg-slate-50/50 px-4 sm:px-6 py-2 space-y-1 border-t border-slate-100 text-xs">
                <button
                  onClick={() => navigate('/sales')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Sale Invoices</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/sales?type=estimate')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Estimates / Quotations</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/sales?type=proforma')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Proforma Invoice</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/sales?type=sales_order')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Sales Orders</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/sales?type=delivery_challan')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Delivery Challan</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/accounts')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Payment-In (Receipts)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/sales?type=credit_note')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Sale Return / Credit Note</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>

          {/* 1.2 PURCHASE (Expandable) */}
          <div>
            <div
              onClick={() => toggleExpand('purchase')}
              className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Purchase</h4>
                  <p className="text-[11px] text-slate-500">Purchase Bills, Orders, Outward Payments, Debit Notes</p>
                </div>
              </div>
              {expandedRows.purchase ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>

            {expandedRows.purchase && (
              <div className="bg-slate-50/50 px-4 sm:px-6 py-2 space-y-1 border-t border-slate-100 text-xs">
                <button
                  onClick={() => navigate('/purchases')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-emerald-600 font-semibold"
                >
                  <span>Purchase Bills</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/purchases?type=purchase_order')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-emerald-600 font-semibold"
                >
                  <span>Purchase Orders</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/accounts')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-emerald-600 font-semibold"
                >
                  <span>Payment-Out</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/purchases?type=debit_note')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-emerald-600 font-semibold"
                >
                  <span>Purchase Return / Debit Note</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>

          {/* 1.3 EXPENSES */}
          <div
            onClick={() => navigate('/expenses')}
            className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Expenses</h4>
                <p className="text-[11px] text-slate-500">Operating overheads, rent, utilities, tea & travel</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* 1.4 MY ONLINE STORE */}
          <div
            onClick={() => navigate('/store')}
            className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">My Online Store</h4>
                <p className="text-[11px] text-slate-500">Digital catalogue, online orders, and customer share link</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* 1.5 REPORTS */}
          <div
            onClick={() => navigate('/reports')}
            className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Reports</h4>
                <p className="text-[11px] text-slate-500">GSTR-1, P&L, balance sheet, stock summary, ledger statements</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </Card>

      {/* CARD 2: CASH & BANK */}
      <Card className="rounded-2xl border-slate-200/90 shadow-subtle overflow-hidden">
        <div className="bg-slate-50/70 px-4 py-2.5 border-b border-slate-100 font-extrabold text-xs text-slate-500 uppercase tracking-wider">
          Card 2: Cash & Bank
        </div>
        <div className="divide-y divide-slate-100">
          <div
            onClick={() => navigate('/accounts')}
            className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Bank Accounts</h4>
                <p className="text-[11px] text-slate-500">Current & savings accounts, bank transfers</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div
            onClick={() => navigate('/accounts')}
            className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Cash In-Hand</h4>
                <p className="text-[11px] text-slate-500">Physical shop counter cash balance</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div
            onClick={() => navigate('/accounts')}
            className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Cheques</h4>
                <p className="text-[11px] text-slate-500">Post-dated cheques, clearance status</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div
            onClick={() => navigate('/accounts')}
            className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <CircleDollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Loan Accounts</h4>
                <p className="text-[11px] text-slate-500">Business loans, EMIs, and credit lines</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </Card>

      {/* CARD 3: IMPORTANT UTILITIES */}
      <Card className="rounded-2xl border-slate-200/90 shadow-subtle overflow-hidden">
        <div className="bg-slate-50/70 px-4 py-2.5 border-b border-slate-100 font-extrabold text-xs text-slate-500 uppercase tracking-wider">
          Card 3: Important Utilities
        </div>
        <div className="divide-y divide-slate-100">
          {/* Sync & Share */}
          <div
            onClick={() => triggerSync()}
            className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center shrink-0">
                <RefreshCw className={`w-5 h-5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Sync & Share</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                    {status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {pendingCount > 0 ? `${pendingCount} offline actions pending. Tap to sync now.` : 'Cloud sync is up to date.'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Manage Companies */}
          <div
            onClick={() => setIsSwitcherOpen(true)}
            className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Manage Companies</h4>
                <p className="text-[11px] text-slate-500">Active: {activeBusiness?.name || 'My Business'} (tap to switch or add)</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Backup / Restore (Expandable) */}
          <div>
            <div
              onClick={() => toggleExpand('backup')}
              className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Backup & Restore</h4>
                  <p className="text-[11px] text-slate-500">Backup now, history, restore, JSON & Excel export</p>
                </div>
              </div>
              {expandedRows.backup ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>

            {expandedRows.backup && (
              <div className="bg-slate-50/50 px-4 sm:px-6 py-2 space-y-1 border-t border-slate-100 text-xs">
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Backup Now (Offline & Cloud)</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Restore from Backup</span>
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/utilities')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Export All Data (Excel/CSV)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>

          {/* Utilities (Expandable) */}
          <div>
            <div
              onClick={() => toggleExpand('utilities')}
              className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Utilities</h4>
                  <p className="text-[11px] text-slate-500">Barcode tools, bulk item import, party import, stock adjustment</p>
                </div>
              </div>
              {expandedRows.utilities ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>

            {expandedRows.utilities && (
              <div className="bg-slate-50/50 px-4 sm:px-6 py-2 space-y-1 border-t border-slate-100 text-xs">
                <button
                  onClick={() => navigate('/utilities')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Barcode Generator & Scanner</span>
                  <ScanBarcode className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/utilities')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Import Items (CSV / Excel)</span>
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/utilities')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Import Parties (CSV / Excel)</span>
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/items')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Stock Adjustment</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* CARD 4: OTHERS */}
      <Card className="rounded-2xl border-slate-200/90 shadow-subtle overflow-hidden">
        <div className="bg-slate-50/70 px-4 py-2.5 border-b border-slate-100 font-extrabold text-xs text-slate-500 uppercase tracking-wider">
          Card 4: Others
        </div>
        <div className="divide-y divide-slate-100">
          {/* Get Desktop Billing Software */}
          <div
            onClick={() => navigate('/desktop')}
            className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Get Desktop Billing Software</h4>
                <p className="text-[11px] text-slate-500">Access same account in desktop web browser</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Grow Your Business (Expandable) */}
          <div>
            <div
              onClick={() => toggleExpand('grow')}
              className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Grow Your Business</h4>
                  <p className="text-[11px] text-slate-500">Share store, payment reminders, referral</p>
                </div>
              </div>
              {expandedRows.grow ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>

            {expandedRows.grow && (
              <div className="bg-slate-50/50 px-4 sm:px-6 py-2 space-y-1 border-t border-slate-100 text-xs">
                <button
                  onClick={() => navigate('/store')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Share Online Store Link</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/parties')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Send Payment Reminders</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>

          {/* Settings */}
          <div
            onClick={() => navigate('/settings')}
            className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Settings</h4>
                <p className="text-[11px] text-slate-500">Language, theme, invoice prefixes, UPI QR, security PIN</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Help & Support (Expandable) */}
          <div>
            <div
              onClick={() => toggleExpand('help')}
              className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Help & Support</h4>
                  <p className="text-[11px] text-slate-500">FAQs, GST guides, report a problem, contact assistance</p>
                </div>
              </div>
              {expandedRows.help ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>

            {expandedRows.help && (
              <div className="bg-slate-50/50 px-4 sm:px-6 py-2 space-y-1 border-t border-slate-100 text-xs">
                <button
                  onClick={() => navigate('/help')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Frequently Asked Questions (FAQs)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/help')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white flex items-center justify-between text-slate-700 hover:text-brand-600 font-semibold"
                >
                  <span>Contact Us / Report a Problem</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>

          {/* Rate this app */}
          <div
            onClick={() => setIsRateModalOpen(true)}
            className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Rate this app</h4>
                <p className="text-[11px] text-slate-500">Share your feedback to help us build better features</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* App Version Card */}
          <div className="p-4 sm:px-5 bg-slate-50/70 flex items-center justify-between text-xs">
            <div>
              <p className="font-extrabold text-slate-700">BizLedger Enterprise</p>
              <p className="text-[11px] text-slate-400">Production Build 2610 • Capacitor & Vite</p>
            </div>
            <span className="font-mono text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              v1.2.0
            </span>
          </div>
        </div>
      </Card>

      {/* Switcher & Edit Name Modals */}
      <BusinessSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        onOpenEditName={() => setIsEditNameOpen(true)}
      />

      <EditBusinessNameModal
        isOpen={isEditNameOpen}
        onClose={() => setIsEditNameOpen(false)}
      />

      {/* RATE THIS APP MODAL */}
      <Modal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        title="Rate BizLedger"
        size="sm"
      >
        {rateSubmitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Thank You!</h4>
            <p className="text-xs text-slate-500 mt-1">Your rating has been received.</p>
          </div>
        ) : (
          <form onSubmit={handleRateSubmit} className="space-y-4">
            <p className="text-xs text-slate-600 text-center">
              How has your billing and inventory management experience been?
            </p>

            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRateStars(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rateStars
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              placeholder="Tell us what you like or what could be improved (optional)..."
              value={rateFeedback}
              onChange={(e) => setRateFeedback(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsRateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Submit Feedback
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
