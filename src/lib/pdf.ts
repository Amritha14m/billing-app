// PDF, Print and Native Share Utility for BizLedger
import { Share } from '@capacitor/share';
import { Transaction, Business, Party } from '../types';
import { formatCurrency, numberToWordsIndian } from './gst';

export async function shareInvoice(
  transaction: Transaction,
  business: Business,
  party?: Party
): Promise<void> {
  const invoiceTitle = transaction.document_type === 'sales_invoice' ? 'Tax Invoice' : 'Bill';
  const textMessage = `Dear ${party?.name || 'Customer'},\n\nYour ${invoiceTitle} #${transaction.document_number} from ${business.name} for ${formatCurrency(transaction.total_amount)} has been generated.\n\nDate: ${transaction.document_date}\nBalance Due: ${formatCurrency(transaction.balance_amount)}\n\nThank you for your business!`;

  try {
    const canShare = await Share.canShare();
    if (canShare.value) {
      await Share.share({
        title: `${invoiceTitle} #${transaction.document_number}`,
        text: textMessage,
        dialogTitle: `Share ${invoiceTitle}`,
      });
      return;
    }
  } catch {
    // Fallback to Web Share or WhatsApp web
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: `${invoiceTitle} #${transaction.document_number}`,
        text: textMessage,
      });
      return;
    } catch {
      // User cancelled or unsupported
    }
  }

  // Fallback to WhatsApp link
  shareViaWhatsApp(party?.phone || '', textMessage);
}

export function shareViaWhatsApp(phone: string, text: string): void {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

export function triggerBrowserPrint(): void {
  window.print();
}
