// GST and Currency Calculation Engine for BizLedger

export interface IndianState {
  code: string;
  name: string;
}

export const INDIAN_STATES: IndianState[] = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh (Old)' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' },
];

export const GST_RATES = [0, 5, 12, 18, 28] as const;

// Decimal rounding helper to avoid floating point errors
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// Format amount to Indian Rupee representation (e.g. ₹ 1,23,456.78)
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹ 0.00';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const [intPart, decPart] = absAmount.toFixed(2).split('.');
  
  // Indian numbering format regex: last 3 digits, then groups of 2
  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  
  return `${isNegative ? '-' : ''}₹ ${formattedInt}.${decPart}`;
}

// Validate GSTIN pattern (2 digits state code + 10 alphanumeric PAN + 1 entity + Z + 1 check digit)
// Optionally validates that the state code prefix matches expectedStateCode
export function validateGSTIN(
  gstin: string,
  expectedStateCode?: string
): { isValid: boolean; message?: string } {
  if (!gstin) return { isValid: true };
  const clean = gstin.trim().toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!gstinRegex.test(clean)) {
    return {
      isValid: false,
      message: 'Format should be 2-digit state code + PAN + 1 + Z + check digit (e.g., 27AAAAA0000A1Z5)',
    };
  }

  if (expectedStateCode) {
    const padded = expectedStateCode.padStart(2, '0');
    const gstinPrefix = clean.substring(0, 2);
    if (gstinPrefix !== padded) {
      return {
        isValid: false,
        message: `GSTIN state code (${gstinPrefix}) does not match selected state code (${padded})`,
      };
    }
  }

  return { isValid: true };
}

// Validate Indian Mobile Number (10 digits, starts with 6, 7, 8, or 9)
export function validateIndianPhone(phone: string): { isValid: boolean; message?: string } {
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


export interface LineCalculationInput {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxRate: number; // e.g. 18
  isTaxInclusive: boolean;
  isGstInvoice: boolean;
  isInterState: boolean; // True if IGST, False if CGST + SGST
}

export interface LineCalculationOutput {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

export function calculateLineItem(input: LineCalculationInput): LineCalculationOutput {
  const qty = Math.max(0, input.quantity || 0);
  const price = Math.max(0, input.unitPrice || 0);
  const rawSubtotal = round2(qty * price);

  // Discount computation
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
    // Reverse calculate: Taxable = Amount / (1 + Rate / 100)
    taxable = round2(discountedAmount / (1 + taxRate / 100));
    taxTotal = round2(discountedAmount - taxable);
  } else {
    // Tax exclusive: Tax = Taxable * Rate / 100
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
      sgstAmount = round2(taxTotal - cgstAmount); // Avoid 1 paisa rounding difference
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

// Convert number to Indian English words for invoices
export function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
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
