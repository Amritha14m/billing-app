import React, { useState, useEffect, useRef } from 'react';
import { Camera, Search, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { getLocalItems } from '../../lib/db';
import { Item } from '../../types';
import { formatCurrency } from '../../lib/gst';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemSelect?: (item: Item) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onItemSelect,
}) => {
  const { activeBusiness } = useAuth();
  const [manualCode, setManualCode] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [foundItem, setFoundItem] = useState<Item | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && activeBusiness) {
      getLocalItems(activeBusiness.id).then(setItems);
      setFoundItem(null);
      setManualCode('');
      setCameraError(null);
    } else {
      stopCamera();
    }
  }, [isOpen, activeBusiness]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError('Camera access denied or unavailable. You can enter or scan barcode via USB/Bluetooth reader.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleSearchCode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    const match = items.find(
      (i) => i.barcode === trimmed || i.sku?.toLowerCase() === trimmed.toLowerCase()
    );
    if (match) {
      setFoundItem(match);
    } else {
      setFoundItem(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="Barcode & SKU Scanner"
      description="Scan with device camera or enter barcode / SKU"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Camera Viewfinder */}
        <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-slate-700">
          {isCameraActive ? (
            <video ref={videoRef} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-6 text-slate-400">
              <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Camera preview inactive</p>
              <Button
                variant="outline"
                size="sm"
                onClick={startCamera}
                className="mt-3 bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Start Camera
              </Button>
            </div>
          )}

          {isCameraActive && (
            <div className="absolute inset-0 border-2 border-brand-400/70 m-8 rounded-lg pointer-events-none flex items-center justify-center">
              <div className="w-full h-0.5 bg-red-500 animate-pulse shadow-[0_0_8px_red]"></div>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Manual Input or Hardware Scanner */}
        <div className="flex gap-2">
          <Input
            placeholder="Type barcode or scan with USB scanner..."
            value={manualCode}
            onChange={(e) => {
              setManualCode(e.target.value);
              handleSearchCode(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchCode(manualCode);
            }}
            autoFocus
          />
          <Button
            variant="secondary"
            onClick={() => handleSearchCode(manualCode)}
            leftIcon={<Search className="w-4 h-4" />}
          >
            Find
          </Button>
        </div>

        {/* Found Product Result */}
        {foundItem ? (
          <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between animate-in fade-in">
            <div>
              <div className="flex items-center gap-1.5 text-brand-800 font-semibold text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                {foundItem.name}
              </div>
              <p className="text-xs text-brand-700 mt-0.5">
                Barcode: <span className="font-mono">{foundItem.barcode}</span> | Stock: {foundItem.current_stock} {foundItem.unit}
              </p>
              <p className="text-xs font-bold text-slate-900 mt-1">
                Price: {formatCurrency(foundItem.sale_price)} ({foundItem.is_tax_inclusive ? 'Incl. GST' : '+ GST'})
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (onItemSelect) onItemSelect(foundItem);
                stopCamera();
                onClose();
              }}
            >
              Select
            </Button>
          </div>
        ) : manualCode.trim().length > 3 ? (
          <div className="p-3 bg-slate-100 rounded-lg text-center text-xs text-slate-500">
            No item matching barcode/SKU <span className="font-mono font-semibold">"{manualCode}"</span>.
          </div>
        ) : null}

        {/* Sample Barcodes helper */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium mb-1.5">Quick Demo Barcodes:</p>
          <div className="flex flex-wrap gap-1.5">
            {items.filter(i => i.barcode).slice(0, 3).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setManualCode(item.barcode || '');
                  handleSearchCode(item.barcode || '');
                }}
                className="text-[11px] font-mono bg-slate-100 hover:bg-brand-100 text-slate-700 hover:text-brand-700 px-2 py-0.5 rounded transition-colors"
              >
                {item.barcode} ({item.name.substring(0, 15)}...)
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
