import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getLocalTransactionById, getLocalPartyById } from '../../lib/db';
import { Transaction, Party } from '../../types';
import { InvoicePrintView } from '../../components/invoice/InvoicePrintView';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { activeBusiness } = useAuth();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [party, setParty] = useState<Party | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getLocalTransactionById(id).then(async (tx) => {
      if (tx) {
        setTransaction(tx);
        if (tx.party_id && tx.party_id !== 'cash_customer') {
          const pt = await getLocalPartyById(tx.party_id);
          setParty(pt);
        }
      }
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400 text-sm">Loading invoice details...</div>;
  }

  if (!transaction || !activeBusiness) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-2">Invoice not found.</p>
        <button
          onClick={() => navigate('/sales')}
          className="text-brand-600 font-semibold text-xs"
        >
          ← Return to sales list
        </button>
      </div>
    );
  }

  return (
    <InvoicePrintView
      transaction={transaction}
      business={activeBusiness}
      party={party}
      onBack={() => navigate('/sales')}
    />
  );
};
