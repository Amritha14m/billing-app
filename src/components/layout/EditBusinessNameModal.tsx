import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface EditBusinessNameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditBusinessNameModal: React.FC<EditBusinessNameModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeBusiness, updateActiveBusiness } = useAuth();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeBusiness) {
      setName(activeBusiness.name || '');
    }
  }, [activeBusiness, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await updateActiveBusiness({ name: name.trim() });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Business Name" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Company / Business Name *"
          placeholder="Enter business name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSaving || !name.trim()}>
            {isSaving ? 'Saving...' : 'Save Name'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
