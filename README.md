# BizLedger - GST Billing, Accounting & Inventory Management System

**BizLedger** is a complete, production-grade business management and GST billing application built for Indian SMBs, distributors, retailers, and service providers. It is designed from the ground up as a single codebase with two first-class deliverables:

1. **Desktop Web Application:** A feature-rich browser workspace optimized for wide monitors, keyboard shortcuts, multi-column billing, print preview, and comprehensive accounting reports.
2. **Android Mobile Application:** A mobile-optimized application packaged with Capacitor into an installable Android APK (`.apk`), featuring touch controls, barcode camera scanning, native Android sharing, and full offline caching with synchronization.

---

## 🚀 Key Features

- **GST Precision Engine:**
  - Intra-State (CGST 50% + SGST 50%) vs Inter-State (IGST 100%) split based on Place of Supply.
  - Configurable GST slabs: 0%, 5%, 12%, 18%, 28%.
  - Tax-Inclusive and Tax-Exclusive pricing calculations with reverse tax computation.
  - GSTIN format validation with state code mapping.
  - Number-to-Words generator for Indian invoices ("Rupees One Lakh Twenty Three Thousand...").
  - GSTR-1 outward register summary and GSTR-3B monthly return report.
- **Fast Billing & Sales:**
  - Fast billing interface with customer selector, barcode scan shortcut, line-item discounts, and split payments (Cash, UPI, Card, Bank Transfer, Cheque).
  - Print-ready Standard A4 invoice layout and 58mm/80mm Thermal POS receipt format.
  - Native Share via Android sheet, Web Share, and 1-click WhatsApp payment reminders.
  - Full document cycle: Estimates/Quotations, Sales Orders, Delivery Challans, and Sales Invoices.
- **Inward Purchases & Payables:**
  - Inward stock purchase bills linked to suppliers.
  - Atomic stock quantity additions and accounts payable ledger updates.
- **Inventory & Barcodes:**
  - Products & Services catalogue with SKU, HSN/SAC codes, and units (PCS, BOX, KG, MTR, LTR, etc.).
  - Atomic stock deductions on sale and additions on purchase.
  - Low-stock threshold alerts and live stock valuation.
  - Built-in camera barcode scanner and printable barcode labels for retail products.
- **Cash & Bank Accounts:**
  - Cash in Hand, Bank current accounts, and Contra inter-account transfers (which do not distort sales or expenses).
- **Offline-First Synchronization:**
  - IndexedDB storage engine caching parties, catalog items, invoices, accounts, and transactions.
  - Resilient offline queue tracking pending mutations with automatic retry and conflict handling.
  - Live status indicator (Online, Offline, Syncing, Synced).
- **Data Backup & Utilities:**
  - One-click JSON data export and disaster recovery restore.
  - Bulk CSV import and export for products and customer contact lists.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v7.
- **Mobile Container:** Capacitor v8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/share`, `@capacitor/toast`).
- **Offline Storage:** IndexedDB (`idb` library) with optimistic local persistence.
- **Backend & Cloud:** Supabase with PostgreSQL (Migrations, Row Level Security, Indexes, UUIDs).
- **JDK:** OpenJDK 21 LTS Microsoft build.
- **Android Target:** Android API 36 / 35.

---

## 📁 Repository Structure

```
bizledger/
├── android/                         # Complete Capacitor Android Native Project
│   ├── app/
│   │   ├── build/outputs/apk/debug/ # Generated Android Debug APK
│   │   │   └── app-debug.apk        # Ready-to-install Android APK (4.48 MB)
│   │   └── src/main/AndroidManifest.xml
│   └── gradlew.bat                  # Gradle Wrapper script
├── src/
│   ├── components/
│   │   ├── barcode/                 # Camera & Hardware Barcode Scanner modal
│   │   ├── invoice/                 # A4 & Thermal 80mm Print and Share views
│   │   ├── layout/                  # DesktopSidebar, TopNavbar, MobileHeader, MobileBottomNav
│   │   └── ui/                      # Button, Card, Input, Select, Modal, Badge
│   ├── context/
│   │   ├── AuthContext.tsx          # Multi-business switcher & active business state
│   │   └── SyncContext.tsx          # Real-time online/offline sync status
│   ├── lib/
│   │   ├── db.ts                    # IndexedDB offline storage & sync queue engine
│   │   ├── gst.ts                   # GST calculation engine & Indian currency formatting
│   │   ├── mockData.ts              # Initial starter seed data
│   │   ├── pdf.ts                   # PDF print & native share handler
│   │   ├── supabase.ts              # Supabase cloud client & connection check
│   │   └── sync.ts                  # Background synchronization manager
│   ├── pages/
│   │   ├── accounts/                # Cash & Bank accounts, contra transfers
│   │   ├── auth/                    # Sign In / Demo access
│   │   ├── dashboard/               # Live computed KPI dashboard & trend charts
│   │   ├── expenses/                # Operating expense recording & categories
│   │   ├── help/                    # Keyboard shortcuts & GST guide
│   │   ├── items/                   # Items catalogue, stock adjustments, barcode printing
│   │   ├── onboarding/              # Multi-step Business Setup Wizard
│   │   ├── parties/                 # Customers, Suppliers, balances & WhatsApp reminders
│   │   ├── purchases/               # Inward purchase bills & supplier dues
│   │   ├── reports/                 # GSTR-1, GSTR-3B, P&L statement, stock valuation
│   │   ├── sales/                   # Fast billing invoice creation & invoice register
│   │   ├── settings/                # Business profile, print terms, JSON backup & restore
│   │   ├── store/                   # Online digital storefront link & catalogue
│   │   └── utilities/               # CSV import/export & bulk tools
│   ├── types/                       # TypeScript domain models
│   ├── App.tsx                      # Application routing shell
│   └── index.css                    # Tailwind layers & print styles
├── supabase/
│   └── migrations/
│       └── 20261010000000_bizledger_schema.sql # Complete PostgreSQL schema & RLS
├── test/
│   └── business_logic.test.js       # 19 automated business logic unit tests
├── capacitor.config.ts              # Capacitor configuration
├── package.json
└── tailwind.config.js
```

---

## 💻 Quick Start & Local Development

### 1. Prerequisites
- Node.js (v20+ or v22 LTS)
- JDK 21 (for building Android APK)
- Android SDK (installed at `%LOCALAPPDATA%\Android\Sdk` or via Android Studio)

### 2. Install Dependencies
```powershell
cd bizledger
npm install
```

### 3. Run Development Server
```powershell
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in any browser.

---

## 🧪 Automated Testing

Run the automated business logic test suite covering GST split, tax-inclusive calculations, line discounts, and non-GST scenarios:
```powershell
node test/business_logic.test.js
```
Output:
```
--- Running BizLedger Business Logic Tests ---
  ✓ PASS: Subtotal should be 10000
  ✓ PASS: Discount amount should be 1000
  ✓ PASS: Taxable amount should be 9000
  ✓ PASS: CGST and SGST rates should both be 9%
  ✓ PASS: CGST amount should be 810
  ✓ PASS: SGST amount should be 810
  ✓ PASS: IGST amount should be 0
  ✓ PASS: Total amount should be 10620 (9000 + 1620)
  ...
Test Summary: 42 Passed, 0 Failed.
```

---

## 🏗️ Production Web Build

To produce the optimized production web bundle:
```powershell
npm run build
```
Bundle outputs directly to `bizledger/dist/`.

---

## 📱 Android APK Build

### Pre-requisites for Android Build
Ensure your environment points to JDK 21 and the Android SDK:
```powershell
$env:JAVA_HOME = "C:\Users\Guru\jdk-21"
$env:ANDROID_HOME = "C:\Users\Guru\AppData\Local\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;" + $env:Path
```

### Build Steps:
1. **Sync web build to Capacitor:**
   ```powershell
   npx cap sync android
   ```
2. **Build Debug APK with Gradle:**
   ```powershell
   cd android
   .\gradlew.bat assembleDebug
   ```

### 📦 Output APK Location:
The generated, installable Android debug APK is located at:
```
bizledger/android/app/build/outputs/apk/debug/app-debug.apk
```
File size: **~4.82 MB**. This file is signed with the Android debug certificate and can be directly installed on any Android device via `adb install` or transferred via USB/cloud storage.

---

## ☁️ Supabase Cloud & Database Setup

BizLedger works **100% offline-first** by default using IndexedDB. To enable real-time multi-device cloud synchronization with PostgreSQL:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the SQL Editor in Supabase and execute the migration script:
   [`bizledger/supabase/migrations/20261010000000_bizledger_schema.sql`](supabase/migrations/20261010000000_bizledger_schema.sql)
3. Copy your Project URL and Anon API Key into `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Rebuild the app. BizLedger will now seamlessly sync local changes to Supabase whenever an internet connection is detected.

---

## ⚖️ Known Limitations & External Integrations

- **Government GST Portal Submission:** In accordance with GST regulations, filing returns or generating e-Way bills requires an authorized GSP (GST Suvidha Provider) or ASP API key. BizLedger generates internal prepared GSTR-1 and GSTR-3B audit statements from actual records.
- **SMS OTP Authentication:** Requires an active Indian SMS provider (e.g. Twilio, MSG91, or Fast2SMS). Email authentication is supported by default.
- **Payment Gateway:** UPI QR codes and bank account details are rendered on invoices for instant zero-fee counter settlement. Payment gateway integrations (Razorpay / Cashfree) can be plugged into the modular payment handlers.
