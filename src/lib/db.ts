// IndexedDB Offline Database Engine for BizLedger
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Business,
  Party,
  Item,
  StockMovement,
  Transaction,
  Payment,
  Account,
  AccountTransaction,
  Expense,
  OtherIncome,
  SyncQueueItem,
} from '../types';

interface BizLedgerDB extends DBSchema {
  businesses: {
    key: string;
    value: Business;
  };
  parties: {
    key: string;
    value: Party;
    indexes: { 'by-business': string; 'by-type': string };
  };
  items: {
    key: string;
    value: Item;
    indexes: { 'by-business': string; 'by-barcode': string };
  };
  stock_movements: {
    key: string;
    value: StockMovement;
    indexes: { 'by-business': string; 'by-item': string };
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-business': string; 'by-type': string; 'by-party': string };
  };
  payments: {
    key: string;
    value: Payment;
    indexes: { 'by-business': string; 'by-party': string };
  };
  accounts: {
    key: string;
    value: Account;
    indexes: { 'by-business': string };
  };
  account_transactions: {
    key: string;
    value: AccountTransaction;
    indexes: { 'by-account': string };
  };
  expenses: {
    key: string;
    value: Expense;
    indexes: { 'by-business': string };
  };
  other_income: {
    key: string;
    value: OtherIncome;
    indexes: { 'by-business': string };
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-status': string; 'by-business': string };
  };
  settings: {
    key: string;
    value: { key: string; value: any };
  };
}

const DB_NAME = 'bizledger_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BizLedgerDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<BizLedgerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BizLedgerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Businesses
        if (!db.objectStoreNames.contains('businesses')) {
          db.createObjectStore('businesses', { keyPath: 'id' });
        }
        // Parties
        if (!db.objectStoreNames.contains('parties')) {
          const store = db.createObjectStore('parties', { keyPath: 'id' });
          store.createIndex('by-business', 'business_id');
          store.createIndex('by-type', 'type');
        }
        // Items
        if (!db.objectStoreNames.contains('items')) {
          const store = db.createObjectStore('items', { keyPath: 'id' });
          store.createIndex('by-business', 'business_id');
          store.createIndex('by-barcode', 'barcode');
        }
        // Stock movements
        if (!db.objectStoreNames.contains('stock_movements')) {
          const store = db.createObjectStore('stock_movements', { keyPath: 'id' });
          store.createIndex('by-business', 'business_id');
          store.createIndex('by-item', 'item_id');
        }
        // Transactions
        if (!db.objectStoreNames.contains('transactions')) {
          const store = db.createObjectStore('transactions', { keyPath: 'id' });
          store.createIndex('by-business', 'business_id');
          store.createIndex('by-type', 'document_type');
          store.createIndex('by-party', 'party_id');
        }
        // Payments
        if (!db.objectStoreNames.contains('payments')) {
          const store = db.createObjectStore('payments', { keyPath: 'id' });
          store.createIndex('by-business', 'business_id');
          store.createIndex('by-party', 'party_id');
        }
        // Accounts
        if (!db.objectStoreNames.contains('accounts')) {
          const store = db.createObjectStore('accounts', { keyPath: 'id' });
          store.createIndex('by-business', 'business_id');
        }
        // Account transactions
        if (!db.objectStoreNames.contains('account_transactions')) {
          const store = db.createObjectStore('account_transactions', { keyPath: 'id' });
          store.createIndex('by-account', 'account_id');
        }
        // Expenses
        if (!db.objectStoreNames.contains('expenses')) {
          const store = db.createObjectStore('expenses', { keyPath: 'id' });
          store.createIndex('by-business', 'business_id');
        }
        // Other income
        if (!db.objectStoreNames.contains('other_income')) {
          const store = db.createObjectStore('other_income', { keyPath: 'id' });
          store.createIndex('by-business', 'business_id');
        }
        // Sync queue
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
          store.createIndex('by-status', 'status');
          store.createIndex('by-business', 'business_id');
        }
        // Key-value settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// Local Storage Helper APIs

// Queue a mutation for offline synchronization
export async function queueSyncOperation(
  businessId: string,
  tableName: string,
  action: 'insert' | 'update' | 'delete',
  recordId: string,
  payload: any
): Promise<void> {
  const db = await getDB();
  const queueItem: SyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    business_id: businessId,
    table_name: tableName,
    action,
    record_id: recordId,
    payload,
    created_at: new Date().toISOString(),
    retry_count: 0,
    status: 'pending',
  };
  await db.put('sync_queue', queueItem);
}

// Businesses
export async function getLocalBusinesses(): Promise<Business[]> {
  const db = await getDB();
  return db.getAll('businesses');
}

export async function saveLocalBusiness(business: Business): Promise<void> {
  const db = await getDB();
  await db.put('businesses', business);
}

// Parties
export async function getLocalParties(businessId: string): Promise<Party[]> {
  const db = await getDB();
  return db.getAllFromIndex('parties', 'by-business', businessId);
}

export async function getLocalPartyById(id: string): Promise<Party | undefined> {
  const db = await getDB();
  return db.get('parties', id);
}

export async function saveLocalParty(party: Party): Promise<void> {
  const db = await getDB();
  await db.put('parties', party);
  await queueSyncOperation(party.business_id, 'parties', 'update', party.id, party);
}

// Items
export async function getLocalItems(businessId: string): Promise<Item[]> {
  const db = await getDB();
  return db.getAllFromIndex('items', 'by-business', businessId);
}

export async function getLocalItemById(id: string): Promise<Item | undefined> {
  const db = await getDB();
  return db.get('items', id);
}

export async function saveLocalItem(item: Item): Promise<void> {
  const db = await getDB();
  await db.put('items', item);
  await queueSyncOperation(item.business_id, 'items', 'update', item.id, item);
}

// Stock Movements
export async function getLocalStockMovements(businessId: string): Promise<StockMovement[]> {
  const db = await getDB();
  return db.getAllFromIndex('stock_movements', 'by-business', businessId);
}

export async function saveLocalStockMovement(movement: StockMovement): Promise<void> {
  const db = await getDB();
  await db.put('stock_movements', movement);
  await queueSyncOperation(movement.business_id, 'stock_movements', 'insert', movement.id, movement);
}

// Transactions (Invoices, Orders, Bills, etc.)
export async function getLocalTransactions(businessId: string): Promise<Transaction[]> {
  const db = await getDB();
  const txs = await db.getAllFromIndex('transactions', 'by-business', businessId);
  return txs.sort((a, b) => new Date(b.document_date).getTime() - new Date(a.document_date).getTime());
}

export async function getLocalTransactionById(id: string): Promise<Transaction | undefined> {
  const db = await getDB();
  return db.get('transactions', id);
}

export async function saveLocalTransaction(transaction: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', transaction);
  await queueSyncOperation(transaction.business_id, 'transactions', 'update', transaction.id, transaction);
}

// Payments
export async function getLocalPayments(businessId: string): Promise<Payment[]> {
  const db = await getDB();
  return db.getAllFromIndex('payments', 'by-business', businessId);
}

export async function saveLocalPayment(payment: Payment): Promise<void> {
  const db = await getDB();
  await db.put('payments', payment);
  await queueSyncOperation(payment.business_id, 'payments', 'update', payment.id, payment);
}

// Accounts
export async function getLocalAccounts(businessId: string): Promise<Account[]> {
  const db = await getDB();
  return db.getAllFromIndex('accounts', 'by-business', businessId);
}

export async function saveLocalAccount(account: Account): Promise<void> {
  const db = await getDB();
  await db.put('accounts', account);
  await queueSyncOperation(account.business_id, 'accounts', 'update', account.id, account);
}

// Expenses
export async function getLocalExpenses(businessId: string): Promise<Expense[]> {
  const db = await getDB();
  return db.getAllFromIndex('expenses', 'by-business', businessId);
}

export async function saveLocalExpense(expense: Expense): Promise<void> {
  const db = await getDB();
  await db.put('expenses', expense);
  await queueSyncOperation(expense.business_id, 'expenses', 'update', expense.id, expense);
}

// Other Income
export async function getLocalOtherIncome(businessId: string): Promise<OtherIncome[]> {
  const db = await getDB();
  return db.getAllFromIndex('other_income', 'by-business', businessId);
}

export async function saveLocalOtherIncome(income: OtherIncome): Promise<void> {
  const db = await getDB();
  await db.put('other_income', income);
  await queueSyncOperation(income.business_id, 'other_income', 'update', income.id, income);
}

// Sync Queue Operations
export async function getPendingSyncItems(businessId: string): Promise<SyncQueueItem[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('sync_queue', 'by-business', businessId);
  return all.filter((item) => item.status === 'pending' || item.status === 'failed');
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sync_queue', id);
}

export async function updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
  const db = await getDB();
  await db.put('sync_queue', item);
}
