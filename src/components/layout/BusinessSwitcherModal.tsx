import React, { useState } from 'react';
import { Building2, Plus, Check, Edit2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface BusinessSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditName: () => void;
}

export const BusinessSwitcherModal: React.FC<BusinessSwitcherModalProps> = ({
  isOpen,
  onClose,
  onOpenEditName,
}) => {
  const { businesses, activeBusiness, setActiveBusiness, createBusiness } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newBizName, setNewBizName] = useState('');

  const handleSelect = (biz: any) => {
    setActiveBusiness(biz);
    onClose();
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;
    const created = await createBusiness({ name: newBizName.trim() });
    setIsCreating(false);
    setNewBizName('');
    setActiveBusiness(created);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Switch Business" size="md">
      <div className="space-y-4">
        {/* List of existing businesses */}
        <div className="space-y-2">
          {businesses.map((biz) => {
            const isActive = biz.id === activeBusiness?.id;
            return (
              <div
                key={biz.id}
                onClick={() => handleSelect(biz)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isActive
                    ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{biz.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      {biz.gst_registered ? `GST: ${biz.gstin || 'Registered'}` : 'Non-GST'} • {biz.state || 'India'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isActive && (
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                  {isActive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        onOpenEditName();
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-white"
                      title="Rename Business"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add business toggle */}
        {!isCreating ? (
          <Button
            variant="outline"
            onClick={() => setIsCreating(true)}
            className="w-full font-bold text-xs"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Business
          </Button>
        ) : (
          <form onSubmit={handleCreateNew} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <Input
              label="New Business Name *"
              placeholder="e.g. Radhe Supermarket"
              value={newBizName}
              onChange={(e) => setNewBizName(e.target.value)}
              autoFocus
              required
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Create & Switch
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
