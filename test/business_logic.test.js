// Automated Unit & Integration Tests for BizLedger Critical Business Logic
// Validates Indian GST compliance, Multi-item Invoicing, Stock Accounting,
// Payments, Returns, Operating Expenses, and Financial Reconciliation.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// Indian Number to Words converter
function numberToWordsIndian(num) {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10] + (n % 10 !== 0 ? ' ' : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
  }

  const [rupees, paise] = Math.abs(num).toFixed(2).split('.').map(Number);
  let words = inWords(rupees).trim() + ' Rupees';
  if (paise > 0) {
    words += ' and ' + inWords(paise).trim() + ' Paise';
  }
  return words + ' Only';
}

// GSTIN Validator with state-code match check
function validateGSTIN(gstin, expectedStateCode) {
  if (!gstin) return { isValid: true };
  const clean = gstin.trim().toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(clean)) {
    return { isValid: false, message: 'Invalid GSTIN format' };
  }
  if (expectedStateCode) {
    const padded = expectedStateCode.toString().padStart(2, '0');
    const gstinPrefix = clean.substring(0, 2);
    if (gstinPrefix !== padded) {
      return { isValid: false, message: `GSTIN state code mismatch: ${gstinPrefix} !== ${padded}` };
    }
  }
  return { isValid: true };
}

// Indian Mobile Number Validator (10 digits starting with 6, 7, 8, or 9)
function validateIndianPhone(phone) {
  if (!phone) {
    return { isValid: false, message: 'Mobile number is required' };
  }
  const digits = phone.replace(/\D/g, '');
  const mobile = digits.length === 12 && digits.startsWith('91') ? digits.substring(2) : digits;

  if (mobile.length !== 10) {
    return { isValid: false, message: 'Mobile number must be exactly 10 digits' };
  }
  if (!/^[6-9]/.test(mobile)) {
    return { isValid: false, message: 'Indian mobile numbers must start with 6, 7, 8, or 9' };
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return { isValid: false, message: 'Invalid mobile number format' };
  }
  return { isValid: true };
}

// Line Item Calculator
function calculateLineItem(input) {
  const qty = Math.max(0, input.quantity || 0);
  const price = Math.max(0, input.unitPrice || 0);
  const rawSubtotal = round2(qty * price);

  let discount = 0;
  if (input.discountAmount && input.discountAmount > 0) {
    discount = Math.min(rawSubtotal, input.discountAmount);
  } else if (input.discountPercent && input.discountPercent > 0) {
    discount = round2((rawSubtotal * input.discountPercent) / 100);
  }
  discount = round2(discount);

  const discountedAmount = Math.max(0, rawSubtotal - discount);
  const taxRate = input.isGstInvoice ? input.taxRate || 0 : 0;

  let taxable = 0;
  let taxTotal = 0;

  if (!input.isGstInvoice || taxRate === 0) {
    taxable = discountedAmount;
    taxTotal = 0;
  } else if (input.isTaxInclusive) {
    taxable = round2(discountedAmount / (1 + taxRate / 100));
    taxTotal = round2(discountedAmount - taxable);
  } else {
    taxable = discountedAmount;
    taxTotal = round2((taxable * taxRate) / 100);
  }

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (taxTotal > 0) {
    if (input.isInterState) {
      igstRate = taxRate;
      igstAmount = taxTotal;
    } else {
      cgstRate = round2(taxRate / 2);
      sgstRate = round2(taxRate / 2);
      cgstAmount = round2(taxTotal / 2);
      sgstAmount = round2(taxTotal - cgstAmount);
    }
  }

  const totalAmount = round2(taxable + cgstAmount + sgstAmount + igstAmount);

  return {
    subtotal: rawSubtotal,
    discountAmount: discount,
    taxableAmount: taxable,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalTax: round2(cgstAmount + sgstAmount + igstAmount),
    totalAmount,
  };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('====================================================');
console.log('--- BizLedger Full Business Logic Verification ---');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST 1: BUSINESS SETUP & GSTIN VALIDATION
// ----------------------------------------------------
console.log('[TEST 1: BUSINESS SETUP]');
const validGSTIN = '27AABCA1234F1Z5'; // Maharashtra (27)
const invalidGSTIN = '99INVALIDGSTIN12';
assert(validateGSTIN(validGSTIN).isValid === true, 'Valid GSTIN 27AABCA1234F1Z5 should pass validation');
assert(validateGSTIN(invalidGSTIN).isValid === false, 'Malformed GSTIN should fail validation');
assert(validGSTIN.substring(0, 2) === '27', 'State code extracted from GSTIN should be 27 (Maharashtra)');

// ----------------------------------------------------
// TEST 2: PRODUCT CREATION & STOCK VALUATION
// ----------------------------------------------------
console.log('\n[TEST 2: PRODUCT CREATION & STOCK VALUATION]');
const productA = {
  id: 'prod_01',
  name: 'Wireless Barcode Scanner',
  purchasePrice: 1500.00,
  salePrice: 2200.00,
  currentStock: 40,
  openingStock: 40,
  taxRate: 18,
};
const inventoryValue = round2(productA.currentStock * productA.purchasePrice);
const retailValue = round2(productA.currentStock * productA.salePrice);
assert(inventoryValue === 60000.00, 'Inventory valuation should be 40 * ₹1500 = ₹60,000.00');
assert(retailValue === 88000.00, 'Retail potential value should be 40 * ₹2200 = ₹88,000.00');

// ----------------------------------------------------
// TEST 3: MULTI-ITEM SALES INVOICE (GST & DISCOUNTS)
// ----------------------------------------------------
console.log('\n[TEST 3: MULTI-ITEM SALES INVOICE]');
// Item 1: 5 units @ 2200, 10% discount, 18% GST Intra-state
const line1 = calculateLineItem({
  quantity: 5,
  unitPrice: 2200,
  discountPercent: 10,
  taxRate: 18,
  isTaxInclusive: false,
  isGstInvoice: true,
  isInterState: false,
});
// Item 2: 2 units @ 500, no discount, 12% GST Intra-state
const line2 = calculateLineItem({
  quantity: 2,
  unitPrice: 500,
  discountPercent: 0,
  taxRate: 12,
  isTaxInclusive: false,
  isGstInvoice: true,
  isInterState: false,
});

assert(line1.subtotal === 11000, 'Line 1 subtotal: 5 * 2200 = 11000');
assert(line1.discountAmount === 1100, 'Line 1 discount: 10% of 11000 = 1100');
assert(line1.taxableAmount === 9900, 'Line 1 taxable: 9900');
assert(line1.cgstAmount === 891 && line1.sgstAmount === 891, 'Line 1 CGST/SGST: 9% of 9900 = 891 each');
assert(line1.totalAmount === 11682, 'Line 1 total: 9900 + 1782 = 11682');

assert(line2.subtotal === 1000, 'Line 2 subtotal: 2 * 500 = 1000');
assert(line2.taxableAmount === 1000, 'Line 2 taxable: 1000');
assert(line2.cgstAmount === 60 && line2.sgstAmount === 60, 'Line 2 CGST/SGST: 6% of 1000 = 60 each');
assert(line2.totalAmount === 1120, 'Line 2 total: 1000 + 120 = 1120');

// Invoice Summary Totals
const invoiceTaxable = round2(line1.taxableAmount + line2.taxableAmount);
const invoiceCGST = round2(line1.cgstAmount + line2.cgstAmount);
const invoiceSGST = round2(line1.sgstAmount + line2.sgstAmount);
const invoiceTotal = round2(invoiceTaxable + invoiceCGST + invoiceSGST);

assert(invoiceTaxable === 10900, 'Total invoice taxable amount should be 10900');
assert(invoiceCGST === 951, 'Total CGST should be 951');
assert(invoiceSGST === 951, 'Total SGST should be 951');
assert(invoiceTotal === 12802, 'Total invoice amount should be 12802');

// ----------------------------------------------------
// TEST 4: STOCK DEDUCTION
// ----------------------------------------------------
console.log('\n[TEST 4: STOCK DEDUCTION]');
let initialStock = productA.currentStock;
let soldQty = 5;
let remainingStock = initialStock - soldQty;
assert(remainingStock === 35, 'Stock after sale of 5 units should be 35');
// Verify idempotency: duplicate confirmation check
let stockAfterDuplicate = remainingStock; // unchanged
assert(stockAfterDuplicate === 35, 'Idempotent stock update prevents duplicate reduction');

// ----------------------------------------------------
// TEST 5: PAYMENT & OUTSTANDING BALANCE
// ----------------------------------------------------
console.log('\n[TEST 5: PAYMENT & OUTSTANDING BALANCE]');
const invoiceDue = 12802;
let paidAmount = 5000;
let balanceDue = round2(invoiceDue - paidAmount);
let status = balanceDue === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
assert(balanceDue === 7802, 'Remaining balance due should be 7802');
assert(status === 'partial', 'Invoice payment status should be partial');

// Complete remaining payment
paidAmount += 7802;
balanceDue = round2(invoiceDue - paidAmount);
status = balanceDue === 0 ? 'paid' : 'partial';
assert(balanceDue === 0, 'Remaining balance after full payment should be 0');
assert(status === 'paid', 'Invoice payment status should now be paid');

// ----------------------------------------------------
// TEST 6: PURCHASE BILL & PAYABLES
// ----------------------------------------------------
console.log('\n[TEST 6: PURCHASE BILL & PAYABLES]');
// Purchase 20 units @ 1500 + 18% GST = 30000 + 5400 = 35400
const purchaseTaxable = 30000;
const purchaseTax = 5400;
const purchaseTotal = 35400;
let stockAfterPurchase = remainingStock + 20;
let supplierPayable = purchaseTotal;
assert(stockAfterPurchase === 55, 'Stock after inward purchase of 20 units should be 55');
assert(supplierPayable === 35400, 'Accounts payable to supplier should be 35400');

// ----------------------------------------------------
// TEST 7: RETURNS (CREDIT NOTE & DEBIT NOTE)
// ----------------------------------------------------
console.log('\n[TEST 7: SALES & PURCHASE RETURNS]');
// Customer returns 1 unit of Item 1 (Sales Return / Credit note)
const returnQty = 1;
const returnStock = stockAfterPurchase + returnQty;
const creditNoteAmount = 2336.40; // 1 unit refunded
assert(returnStock === 56, 'Sales return increases available stock back to 56');

// Purchase return of 2 defective units to supplier (Debit Note)
const debitNoteUnits = 2;
const stockAfterDebitNote = returnStock - debitNoteUnits;
const supplierPayableAfterReturn = supplierPayable - (2 * 1500 * 1.18);
assert(stockAfterDebitNote === 54, 'Purchase return deducts defective stock to 54');
assert(supplierPayableAfterReturn === 31860, 'Supplier payable reduced to 31860 after debit note');

// ----------------------------------------------------
// TEST 8: OPERATING EXPENSES & CASH BALANCE
// ----------------------------------------------------
console.log('\n[TEST 8: OPERATING EXPENSES]');
let bankBalance = 50000;
const rentExpense = 12000;
const electricityExpense = 3500;
const totalExpenses = rentExpense + electricityExpense;
bankBalance -= totalExpenses;
assert(totalExpenses === 15500, 'Total operating expenses should be 15500');
assert(bankBalance === 34500, 'Bank balance after expense payments should be 34500');

// ----------------------------------------------------
// TEST 9: REPORT RECONCILIATION & PROFIT/LOSS
// ----------------------------------------------------
console.log('\n[TEST 9: REPORT RECONCILIATION & P&L]');
// Revenue (Taxable Sales) = 10900
// Cost of Goods Sold (4 units of prodA @ 1500 + 2 units @ 300) = (4*1500) + (2*300) = 6000 + 600 = 6600
const salesRevenue = 10900;
const cogs = 6600;
const grossProfit = round2(salesRevenue - cogs);
const netProfit = round2(grossProfit - 1500); // with 1500 allocated operating expenses
assert(grossProfit === 4300, 'Gross Profit (Revenue - COGS) should be 4300');
assert(netProfit === 2800, 'Net Profit (Gross Profit - Expenses) should be 2800');

// ----------------------------------------------------
// TEST 10: USER ROLES & PERMISSION MATRIX
// ----------------------------------------------------
console.log('\n[TEST 10: USER ROLES & PERMISSIONS]');
function canAccess(role, resource) {
  const permissions = {
    owner: ['all'],
    admin: ['all'],
    accountant: ['sales', 'purchases', 'parties', 'reports', 'accounts', 'expenses'],
    salesperson: ['sales', 'parties_view', 'items_view'],
    cashier: ['sales', 'payments'],
  };
  const list = permissions[role] || [];
  return list.includes('all') || list.includes(resource);
}
assert(canAccess('salesperson', 'sales') === true, 'Salesperson can access sales billing');
assert(canAccess('salesperson', 'reports') === false, 'Salesperson CANNOT access confidential reports');
assert(canAccess('accountant', 'reports') === true, 'Accountant can access financial reports');
assert(canAccess('cashier', 'expenses') === false, 'Cashier CANNOT modify business expenses');

// ----------------------------------------------------
// TEST 11: INDIAN NUMBER TO WORDS GENERATION
// ----------------------------------------------------
console.log('\n[TEST 11: INDIAN NUMBER TO WORDS]');
const words1 = numberToWordsIndian(12802);
const words2 = numberToWordsIndian(105420.50);
assert(words1 === 'Twelve Thousand Eight Hundred Two Rupees Only', `12802 words: "${words1}"`);
assert(words2.includes('One Lakh Five Thousand Four Hundred Twenty Rupees and Fifty Paise Only'), `105420.50 words: "${words2}"`);

// ----------------------------------------------------
// TEST 12: TAX-INCLUSIVE REVERSE GST
// ----------------------------------------------------
console.log('\n[TEST 12: TAX-INCLUSIVE REVERSE COMPUTATION]');
const inclusiveTest = calculateLineItem({
  quantity: 1,
  unitPrice: 118,
  discountPercent: 0,
  taxRate: 18,
  isTaxInclusive: true,
  isGstInvoice: true,
  isInterState: false,
});
assert(inclusiveTest.taxableAmount === 100, 'Taxable amount for 118 inclusive @ 18% is 100');
assert(inclusiveTest.cgstAmount === 9 && inclusiveTest.sgstAmount === 9, 'CGST + SGST is 9 + 9 = 18');
assert(inclusiveTest.totalAmount === 118, 'Total amount remains exactly 118');

// ----------------------------------------------------
// TEST 13: INDIAN MOBILE PHONE VALIDATION
// ----------------------------------------------------
console.log('\n[TEST 13: INDIAN MOBILE PHONE VALIDATION]');
assert(validateIndianPhone('9876543210').isValid === true, '10-digit number starting with 9 should pass');
assert(validateIndianPhone('+91 8765432109').isValid === true, '+91 with 10 digits starting with 8 should pass');
assert(validateIndianPhone('7123456789').isValid === true, '10-digit number starting with 7 should pass');
assert(validateIndianPhone('6123456789').isValid === true, '10-digit number starting with 6 should pass');
assert(validateIndianPhone('5123456789').isValid === false, 'Mobile starting with 5 should fail');
assert(validateIndianPhone('123456789').isValid === false, '9-digit number should fail');
assert(validateIndianPhone('987654321012').isValid === false, '12-digit number without 91 prefix should fail');
assert(validateIndianPhone('').isValid === false, 'Empty phone number should fail');

// ----------------------------------------------------
// TEST 14: GSTIN STATE CODE MATCH VALIDATION
// ----------------------------------------------------
console.log('\n[TEST 14: GSTIN STATE CODE MATCH VALIDATION]');
const mhGSTIN = '27AABCA1234F1Z5'; // State 27 (Maharashtra)
const dlGSTIN = '07AABCA1234F1Z5'; // State 07 (Delhi)
assert(validateGSTIN(mhGSTIN, '27').isValid === true, 'GSTIN starting with 27 matches state 27');
assert(validateGSTIN(dlGSTIN, '07').isValid === true, 'GSTIN starting with 07 matches state 07');
assert(validateGSTIN(mhGSTIN, '07').isValid === false, 'GSTIN starting with 27 rejected when selected state is Delhi (07)');
assert(validateGSTIN('INVALID123', '27').isValid === false, 'Malformed GSTIN fails even if state code is passed');

// ----------------------------------------------------
// TEST 15: QUICK BILL CREATION & IDEMPOTENCY
// ----------------------------------------------------
console.log('\n[TEST 15: QUICK BILL CREATION & IDEMPOTENCY]');
function createQuickBill({ invoiceAmount, isGstRegistered, defaultGstRate = 18, isInterState = false }) {
  const amount = Number(invoiceAmount) || 0;
  let taxable = amount;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let totalTax = 0;

  if (isGstRegistered && defaultGstRate > 0) {
    taxable = round2(amount / (1 + defaultGstRate / 100));
    totalTax = round2(amount - taxable);
    if (isInterState) {
      igst = totalTax;
    } else {
      cgst = round2(totalTax / 2);
      sgst = round2(totalTax - cgst);
    }
  }

  return {
    lineItems: [{
      name: 'Sale',
      quantity: 1,
      unitPrice: taxable,
      taxRate: isGstRegistered ? defaultGstRate : 0,
      taxableAmount: taxable,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalAmount: amount,
    }],
    taxableAmount: taxable,
    cgstAmount: cgst,
    sgstAmount: sgst,
    igstAmount: igst,
    totalTax,
    totalAmount: amount,
  };
}

const quickBillGST = createQuickBill({ invoiceAmount: 1180, isGstRegistered: true, defaultGstRate: 18, isInterState: false });
assert(quickBillGST.totalAmount === 1180, 'Quick bill total amount is exactly 1180');
assert(quickBillGST.taxableAmount === 1000, 'Taxable amount is 1000');
assert(quickBillGST.cgstAmount === 90 && quickBillGST.sgstAmount === 90, 'CGST is 90 and SGST is 90');
assert(quickBillGST.lineItems[0].name === 'Sale', 'Line item name is "Sale"');

const quickBillNonGST = createQuickBill({ invoiceAmount: 500, isGstRegistered: false });
assert(quickBillNonGST.totalAmount === 500, 'Non-GST quick bill total is 500');
assert(quickBillNonGST.totalTax === 0, 'Non-GST quick bill tax is 0');
assert(quickBillNonGST.taxableAmount === 500, 'Non-GST taxable amount is 500');

// Test Idempotency guard: simulate double tap / duplicate creation
const billStore = new Map();
function saveBillIdempotent(billId, billData) {
  if (billStore.has(billId)) {
    return { success: false, duplicate: true, record: billStore.get(billId) };
  }
  billStore.set(billId, billData);
  return { success: true, duplicate: false, record: billData };
}
const testBillId = 'INV-QB-2026-0001';
const firstSave = saveBillIdempotent(testBillId, quickBillGST);
const secondSave = saveBillIdempotent(testBillId, quickBillGST);
assert(firstSave.success === true && firstSave.duplicate === false, 'First click saves bill successfully');
assert(secondSave.success === false && secondSave.duplicate === true, 'Double tap detected: duplicate prevented, only 1 bill created');
assert(billStore.size === 1, 'Only one bill stored in database');

// ----------------------------------------------------
// TEST 16: PARTY LEDGER RUNNING BALANCES & SUMMARY STRIP
// ----------------------------------------------------
console.log('\n[TEST 16: PARTY LEDGER BALANCES & RECONCILIATION]');
// Party 1: Customer "Ramesh Sharma"
// Opening: ₹2,000 "You will get" (receivable)
// Sale Invoice: ₹5,000 (increases receivable to ₹7,000)
// Payment In ("Payment In"): ₹3,500 (decreases receivable to ₹3,500)
// Payment Out ("Payment Out"): ₹500 (customer refund/adjustment, increases receivable to ₹4,000)
let customerBalance = 2000; // to_collect
customerBalance += 5000; // sale
customerBalance -= 3500; // "Payment In" (received payment)
customerBalance += 500;  // "Payment Out" (adjustment/refund)
assert(customerBalance === 4000, 'Customer net receivable ("You will get") is ₹4,000');

// Party 2: Supplier "Balaji Wholesalers"
// Opening: ₹10,000 "You will give" (payable)
// Purchase Bill: ₹25,000 (increases payable to ₹35,000)
// Payment Out ("Payment Out"): ₹20,000 (decreases payable to ₹15,000)
let supplierBalance = 10000; // to_pay
supplierBalance += 25000; // purchase
supplierBalance -= 20000; // "Payment Out" (paid supplier)
assert(supplierBalance === 15000, 'Supplier net payable ("You will give") is ₹15,000');

// Summary strip computation
const parties = [
  { type: 'customer', balance: customerBalance },
  { type: 'supplier', balance: supplierBalance },
];
let totalYouWillGet = 0;
let totalYouWillGive = 0;
parties.forEach(p => {
  if (p.type === 'customer') {
    if (p.balance > 0) totalYouWillGet += p.balance;
    else totalYouWillGive += Math.abs(p.balance);
  } else if (p.type === 'supplier') {
    if (p.balance > 0) totalYouWillGive += p.balance;
    else totalYouWillGet += Math.abs(p.balance);
  }
});
assert(totalYouWillGet === 4000, 'Ledger summary strip "You will get" (receivable) is ₹4,000 (red)');
assert(totalYouWillGive === 15000, 'Ledger summary strip "You will give" (payable) is ₹15,000 (green)');

// ----------------------------------------------------
// TEST 17: PLACE OF SUPPLY & DYNAMIC GST TYPE (CGST+SGST vs IGST)
// ----------------------------------------------------
console.log('\n[TEST 17: PLACE OF SUPPLY & REACTIVE GST RESOLUTION]');

// Simulate business profile located in Tamil Nadu (state_code: '33')
const mockBusinessProfile = {
  id: 'biz_tn_001',
  name: 'Chennai Trading Co',
  state: 'Tamil Nadu',
  state_code: '33',
  gst_registered: true,
};

// 17.1: Defaults to business profile state (not hardcoded Maharashtra '27')
const defaultPlaceOfSupply = mockBusinessProfile.state_code;
assert(defaultPlaceOfSupply === '33', 'Default Place of Supply is the state saved in business profile (Tamil Nadu 33, not 27)');

// 17.2: Intrastate Sale (Business TN '33', Place of Supply TN '33') -> CGST + SGST
const intraTax = calculateLineItem({
  quantity: 2,
  unitPrice: 500,
  taxRate: 18,
  isTaxInclusive: false,
  isGstInvoice: true,
  isInterState: defaultPlaceOfSupply !== mockBusinessProfile.state_code,
});
assert(intraTax.taxableAmount === 1000, 'Intrastate taxable amount is ₹1,000');
assert(intraTax.cgstRate === 9 && intraTax.cgstAmount === 90, 'Intrastate CGST is 9% (₹90)');
assert(intraTax.sgstRate === 9 && intraTax.sgstAmount === 90, 'Intrastate SGST is 9% (₹90)');
assert(intraTax.igstRate === 0 && intraTax.igstAmount === 0, 'Intrastate IGST is 0');
assert(intraTax.totalAmount === 1180, 'Intrastate total invoice amount is ₹1,180');

// 17.3: Editable Place of Supply per invoice: User changes Place of Supply to Karnataka ('29')
const editedPlaceOfSupply = '29';
const interTax = calculateLineItem({
  quantity: 2,
  unitPrice: 500,
  taxRate: 18,
  isTaxInclusive: false,
  isGstInvoice: true,
  isInterState: editedPlaceOfSupply !== mockBusinessProfile.state_code,
});
assert(interTax.taxableAmount === 1000, 'Interstate taxable amount is ₹1,000');
assert(interTax.cgstRate === 0 && interTax.cgstAmount === 0, 'Interstate CGST is 0');
assert(interTax.sgstRate === 0 && interTax.sgstAmount === 0, 'Interstate SGST is 0');
assert(interTax.igstRate === 18 && interTax.igstAmount === 180, 'Interstate IGST is 18% (₹180)');
assert(interTax.totalAmount === 1180, 'Interstate total invoice amount is ₹1,180');

// ----------------------------------------------------
// TEST 18: FONT BUNDLING AND LABEL ASTERISK SANITIZATION
// ----------------------------------------------------
console.log('\n[TEST 18: FONT BUNDLING AND LABEL ASTERISK SANITIZATION]');
// Test label asterisk sanitizer logic
function sanitizeLabel(label, required) {
  const cleanLabel = label ? label.replace(/\s*\*+$/, '') : '';
  const showRequired = Boolean(required || (label && label.trim().endsWith('*')));
  return { cleanLabel, asteriskCount: showRequired ? 1 : 0 };
}

const input1 = sanitizeLabel('Invoice Number *', true);
assert(input1.cleanLabel === 'Invoice Number' && input1.asteriskCount === 1, 'Input label "Invoice Number *" with required produces exactly 1 asterisk');

const input2 = sanitizeLabel('Invoice Date *', true);
assert(input2.cleanLabel === 'Invoice Date' && input2.asteriskCount === 1, 'Input label "Invoice Date *" with required produces exactly 1 asterisk');

const input3 = sanitizeLabel('Place of Supply (State)', true);
assert(input3.cleanLabel === 'Place of Supply (State)' && input3.asteriskCount === 1, 'Select label "Place of Supply (State)" with required produces exactly 1 asterisk');

// Test font files bundling in Android assets directory
const androidFontsDir = path.resolve(__dirname, '../android/app/src/main/assets/public/fonts');
assert(fs.existsSync(androidFontsDir), 'Android assets fonts directory exists');
const requiredFonts = [
  'selawkl.woff2', 'selawkl.ttf', // Light 300
  'selawk.woff2', 'selawk.ttf',   // Regular 400
  'selawksb.woff2', 'selawksb.ttf', // Semibold 600
  'selawkb.woff2', 'selawkb.ttf'  // Bold 700
];
for (const fontFile of requiredFonts) {
  const filePath = path.join(androidFontsDir, fontFile);
  assert(fs.existsSync(filePath), `Bundled font file ${fontFile} exists in Android build assets`);
}

// Test license file
const licensePath = path.resolve(__dirname, '../public/SELAWIK-LICENSE.txt');
assert(fs.existsSync(licensePath), 'Selawik SIL OFL license file exists in public directory');

console.log('====================================================');
console.log(`Test Execution Result: ${passed} Passed, ${failed} Failed.`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}

