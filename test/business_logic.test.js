// Automated Unit Tests for BizLedger Critical Business Logic

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

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

console.log('--- Running BizLedger Business Logic Tests ---');

// Test 1: Intra-state 18% GST Exclusive
const test1 = calculateLineItem({
  quantity: 10,
  unitPrice: 1000,
  discountPercent: 10, // 10% disc = ₹1000, discounted = ₹9000
  taxRate: 18,
  isTaxInclusive: false,
  isGstInvoice: true,
  isInterState: false, // Intra-state => CGST 9% (₹810) + SGST 9% (₹810)
});
assert(test1.subtotal === 10000, 'Subtotal should be 10000');
assert(test1.discountAmount === 1000, 'Discount amount should be 1000');
assert(test1.taxableAmount === 9000, 'Taxable amount should be 9000');
assert(test1.cgstRate === 9 && test1.sgstRate === 9, 'CGST and SGST rates should both be 9%');
assert(test1.cgstAmount === 810, 'CGST amount should be 810');
assert(test1.sgstAmount === 810, 'SGST amount should be 810');
assert(test1.igstAmount === 0, 'IGST amount should be 0');
assert(test1.totalAmount === 10620, 'Total amount should be 10620 (9000 + 1620)');

// Test 2: Inter-state 18% GST Exclusive
const test2 = calculateLineItem({
  quantity: 5,
  unitPrice: 2000,
  discountPercent: 0,
  taxRate: 18,
  isTaxInclusive: false,
  isGstInvoice: true,
  isInterState: true, // Inter-state => IGST 18%
});
assert(test2.taxableAmount === 10000, 'Taxable amount should be 10000');
assert(test2.igstRate === 18, 'IGST rate should be 18%');
assert(test2.igstAmount === 1800, 'IGST amount should be 1800');
assert(test2.cgstAmount === 0 && test2.sgstAmount === 0, 'Intra-state taxes should be 0');
assert(test2.totalAmount === 11800, 'Total amount should be 11800');

// Test 3: Tax Inclusive Pricing (e.g. ₹118 retail price with 18% GST)
const test3 = calculateLineItem({
  quantity: 1,
  unitPrice: 118,
  discountPercent: 0,
  taxRate: 18,
  isTaxInclusive: true,
  isGstInvoice: true,
  isInterState: false,
});
assert(test3.taxableAmount === 100, 'Tax-inclusive taxable amount for ₹118 @ 18% should be 100');
assert(test3.totalTax === 18, 'Total tax for ₹118 inclusive should be 18');
assert(test3.totalAmount === 118, 'Total amount should equal retail inclusive price 118');

// Test 4: Non-GST Invoice
const test4 = calculateLineItem({
  quantity: 4,
  unitPrice: 250,
  discountPercent: 0,
  taxRate: 18,
  isTaxInclusive: false,
  isGstInvoice: false,
  isInterState: false,
});
assert(test4.taxableAmount === 1000, 'Non-GST taxable amount should equal subtotal');
assert(test4.totalTax === 0, 'Non-GST tax should be 0');
assert(test4.totalAmount === 1000, 'Non-GST total should be 1000');

console.log(`\nTest Summary: ${passed} Passed, ${failed} Failed.`);
if (failed > 0) process.exit(1);
