import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  ScanBarcode,
  AlertTriangle,
  ArrowUpDown,
  History,
  Tag,
  Printer,
  Edit2,
  Boxes,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getLocalItems,
  saveLocalItem,
  getLocalStockMovements,
  saveLocalStockMovement,
} from '../../lib/db';
import { Item, ItemType, StockMovement } from '../../types';
import { formatCurrency, GST_RATES } from '../../lib/gst';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { BarcodeScannerModal } from '../../components/barcode/BarcodeScannerModal';

export const ItemListPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState<Item[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filterType, setFilterType] = useState<'all' | 'product' | 'service'>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(
    searchParams.get('filter') === 'low_stock'
  );

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState<ItemType>('product');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryName, setCategoryName] = useState('General');
  const [hsnCode, setHsnCode] = useState('');
  const [unit, setUnit] = useState('PCS');
  const [salePrice, setSalePrice] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [mrp, setMrp] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [isTaxInclusive, setIsTaxInclusive] = useState<boolean>(true);
  const [openingStock, setOpeningStock] = useState<number>(0);
  const [lowStockAlert, setLowStockAlert] = useState<number>(10);

  // Stock Adjustment Modal
  const [adjustItem, setAdjustItem] = useState<Item | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Physical Stock Count');

  // Barcode Print Modal
  const [barcodePrintItem, setBarcodePrintItem] = useState<Item | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (!activeBusiness) return;
    getLocalItems(activeBusiness.id).then(setItems);
    getLocalStockMovements(activeBusiness.id).then(setStockMovements);

    if (searchParams.get('add') === 'item') {
      openAddModal();
    }
  }, [activeBusiness, searchParams]);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setType('product');
    setSku('');
    setBarcode('');
    setCategoryName('General');
    setHsnCode('');
    setUnit('PCS');
    setSalePrice(0);
    setPurchasePrice(0);
    setMrp(0);
    setTaxRate(18);
    setIsTaxInclusive(true);
    setOpeningStock(0);
    setLowStockAlert(10);
    setIsModalOpen(true);
  };

  const openEditModal = (i: Item) => {
    setEditingItem(i);
    setName(i.name);
    setType(i.type);
    setSku(i.sku || '');
    setBarcode(i.barcode || '');
    setCategoryName(i.category_name || 'General');
    setHsnCode(i.hsn_code || '');
    setUnit(i.unit);
    setSalePrice(i.sale_price);
    setPurchasePrice(i.purchase_price);
    setMrp(i.mrp || 0);
    setTaxRate(i.tax_rate);
    setIsTaxInclusive(i.is_tax_inclusive);
    setOpeningStock(i.opening_stock);
    setLowStockAlert(i.low_stock_alert);
    setIsModalOpen(true);
  };

  const handleSaveItem = async () => {
    if (!name.trim() || !activeBusiness) return;

    const itemData: Item = {
      id: editingItem ? editingItem.id : `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      business_id: activeBusiness.id,
      name: name.trim(),
      type,
      sku: sku.trim() || undefined,
      barcode: barcode.trim() || undefined,
      category_name: categoryName.trim() || 'General',
      hsn_code: hsnCode.trim() || undefined,
      unit,
      sale_price: salePrice,
      purchase_price: purchasePrice,
      mrp: mrp > 0 ? mrp : undefined,
      tax_rate: taxRate,
      is_tax_inclusive: isTaxInclusive,
      current_stock: editingItem ? editingItem.current_stock : openingStock,
      opening_stock: openingStock,
      low_stock_alert: lowStockAlert,
      created_at: editingItem ? editingItem.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveLocalItem(itemData);

    // If new item with opening stock > 0, record opening movement
    if (!editingItem && openingStock > 0) {
      const movement: StockMovement = {
        id: `sm_${Date.now()}`,
        business_id: activeBusiness.id,
        item_id: itemData.id,
        item_name: itemData.name,
        movement_type: 'opening',
        quantity: openingStock,
        unit_price: purchasePrice,
        reason: 'Opening Inventory Balance',
        created_at: new Date().toISOString(),
      };
      await saveLocalStockMovement(movement);
    }

    setItems((prev) => {
      const exists = prev.some((it) => it.id === itemData.id);
      return exists ? prev.map((it) => (it.id === itemData.id ? itemData : it)) : [...prev, itemData];
    });

    setIsModalOpen(false);
  };

  const handleSaveStockAdjustment = async () => {
    if (!adjustItem || !activeBusiness || adjustmentQty === 0) return;

    const newStock = Math.max(0, adjustItem.current_stock + adjustmentQty);
    const updatedItem = {
      ...adjustItem,
      current_stock: newStock,
      updated_at: new Date().toISOString(),
    };

    await saveLocalItem(updatedItem);

    const movement: StockMovement = {
      id: `sm_${Date.now()}`,
      business_id: activeBusiness.id,
      item_id: adjustItem.id,
      item_name: adjustItem.name,
      movement_type: 'adjustment',
      quantity: adjustmentQty,
      unit_price: adjustItem.purchase_price,
      reason: adjustReason,
      created_at: new Date().toISOString(),
    };
    await saveLocalStockMovement(movement);

    setItems((prev) => prev.map((it) => (it.id === updatedItem.id ? updatedItem : it)));
    setAdjustItem(null);
    setAdjustmentQty(0);
  };

  const filteredItems = items.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesLowStock = !showLowStockOnly || (item.type === 'product' && item.current_stock <= item.low_stock_alert);
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.barcode && item.barcode.includes(searchQuery)) ||
      (item.hsn_code && item.hsn_code.includes(searchQuery));

    return matchesType && matchesLowStock && matchesSearch;
  });

  const totalStockValue = items
    .filter((i) => i.type === 'product')
    .reduce((sum, i) => sum + i.current_stock * i.purchase_price, 0);

  const lowStockCount = items.filter(
    (i) => i.type === 'product' && i.current_stock <= i.low_stock_alert
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Items & Inventory
          </h1>
          <p className="text-xs text-slate-500">
            Products, services, barcodes, stock movements, and valuation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsScannerOpen(true)}
            leftIcon={<ScanBarcode className="w-4 h-4 text-brand-600" />}
          >
            Scan Barcode
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={openAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Item
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle border-l-4 border-l-brand-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Stock Valuation
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 block">
            {formatCurrency(totalStockValue)}
          </span>
          <span className="text-[11px] text-slate-400">At purchase cost rate</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle border-l-4 border-l-indigo-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Active Catalog Items
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 block">
            {items.length} Items
          </span>
          <span className="text-[11px] text-slate-400">
            {items.filter((i) => i.type === 'product').length} products, {items.filter((i) => i.type === 'service').length} services
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Low Stock Alerts
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-1 block">
            {lowStockCount} Products
          </span>
          <span className="text-[11px] text-slate-400">Below minimum safety threshold</span>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, SKU, HSN, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('product')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  filterType === 'product'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setFilterType('service')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  filterType === 'service'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Services
              </button>
              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium transition-colors ${
                  showLowStockOnly
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Stock ({lowStockCount})</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">HSN/SAC</th>
                <th className="py-3 px-4 text-right">Sale Price (₹)</th>
                <th className="py-3 px-4 text-right">Purchase (₹)</th>
                <th className="py-3 px-4 text-center">Tax %</th>
                <th className="py-3 px-4 text-right">Current Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No items found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.type === 'product' && item.current_stock <= item.low_stock_alert;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{item.type} • {item.category_name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {item.barcode ? (
                          <span className="block font-semibold text-slate-800">{item.barcode}</span>
                        ) : null}
                        {item.sku ? <span className="text-slate-400">{item.sku}</span> : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{item.hsn_code || '-'}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(item.sale_price)}
                        <span className="text-[9px] font-normal text-slate-400 block">
                          {item.is_tax_inclusive ? 'Incl. GST' : '+ GST'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatCurrency(item.purchase_price)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="blue" size="sm">{item.tax_rate}%</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.type === 'service' ? (
                          <span className="text-slate-400 italic">Service</span>
                        ) : (
                          <div>
                            <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                              {item.current_stock} {item.unit}
                            </span>
                            {isLow && (
                              <Badge variant="red" size="sm" className="ml-1 text-[10px]">
                                Low
                              </Badge>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.type === 'product' && (
                            <button
                              onClick={() => setAdjustItem(item)}
                              className="p-1 rounded text-slate-500 hover:text-brand-600 hover:bg-slate-100"
                              title="Adjust Stock"
                            >
                              <Boxes className="w-4 h-4" />
                            </button>
                          )}
                          {item.barcode && (
                            <button
                              onClick={() => setBarcodePrintItem(item)}
                              className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                              title="Print Barcode Label"
                            >
                              <Tag className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="Edit Item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Item' : 'Add New Product or Service'}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Item Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Copper Wire 1.5mm"
              required
            />
            <Select
              label="Item Type *"
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              options={[
                { value: 'product', label: 'Product (Stock tracked)' },
                { value: 'service', label: 'Service' },
              ]}
            />
            <Input
              label="SKU Code"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. ELEC-001"
            />
            <Input
              label="Barcode (EAN/UPC)"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. 8901234567890"
            />
            <Input
              label="HSN / SAC Code"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
              placeholder="e.g. 85444990"
            />
            <Select
              label="Unit of Measurement *"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              options={[
                { value: 'PCS', label: 'Pieces (PCS)' },
                { value: 'BOX', label: 'Boxes (BOX)' },
                { value: 'KG', label: 'Kilograms (KG)' },
                { value: 'MTR', label: 'Meters (MTR)' },
                { value: 'LTR', label: 'Liters (LTR)' },
                { value: 'HOURS', label: 'Hours (HOURS)' },
                { value: 'SET', label: 'Sets (SET)' },
              ]}
            />
          </div>

          {/* Pricing & GST */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Input
              label="Sale Price (₹) *"
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
              required
            />
            <Input
              label="Purchase Price (₹)"
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
            />
            <Select
              label="GST Tax Rate *"
              value={taxRate}
              onChange={(e) => setTaxRate(parseInt(e.target.value) || 0)}
              options={GST_RATES.map((r) => ({
                value: r,
                label: `${r}% GST`,
              }))}
            />
            <div className="sm:col-span-3 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="inclusiveCheckbox"
                checked={isTaxInclusive}
                onChange={(e) => setIsTaxInclusive(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <label htmlFor="inclusiveCheckbox" className="text-xs font-semibold text-slate-700">
                Sale Price Includes GST (Tax-Inclusive Pricing)
              </label>
            </div>
          </div>

          {/* Stock Tracking (only for products) */}
          {type === 'product' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Opening Stock"
                type="number"
                disabled={Boolean(editingItem)}
                value={openingStock}
                onChange={(e) => setOpeningStock(parseFloat(e.target.value) || 0)}
                helperText={editingItem ? 'Use Stock Adjustment to change live stock.' : 'Initial quantity on hand.'}
              />
              <Input
                label="Low Stock Alert Threshold"
                type="number"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(parseFloat(e.target.value) || 0)}
                helperText="Triggers warning when stock drops to or below this level."
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveItem}>
              {editingItem ? 'Update Item' : 'Save Item'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stock Adjustment Modal */}
      {adjustItem && (
        <Modal
          isOpen={Boolean(adjustItem)}
          onClose={() => setAdjustItem(null)}
          title={`Adjust Stock: ${adjustItem.name}`}
          description={`Current Stock: ${adjustItem.current_stock} ${adjustItem.unit}`}
          maxWidth="sm"
        >
          <div className="space-y-3">
            <Input
              label="Adjustment Quantity (+ to add, - to reduce) *"
              type="number"
              value={adjustmentQty}
              onChange={(e) => setAdjustmentQty(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 5 or -2"
              autoFocus
            />
            <Input
              label="Reason for Adjustment *"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Physical stock count / Damaged goods"
            />
            <div className="p-2.5 bg-slate-50 rounded-lg text-xs flex justify-between font-semibold">
              <span>New Stock Quantity:</span>
              <span className="text-brand-700 font-bold">
                {Math.max(0, adjustItem.current_stock + adjustmentQty)} {adjustItem.unit}
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setAdjustItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveStockAdjustment}>
                Confirm Adjustment
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Barcode Printable Label Modal */}
      {barcodePrintItem && (
        <Modal
          isOpen={Boolean(barcodePrintItem)}
          onClose={() => setBarcodePrintItem(null)}
          title={`Print Barcode Label: ${barcodePrintItem.name}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-center">
            <div className="p-4 bg-white border-2 border-slate-900 rounded-xl max-w-[220px] mx-auto shadow-sm">
              <p className="text-[10px] font-bold uppercase truncate">{activeBusiness?.name}</p>
              <p className="text-xs font-extrabold text-slate-900 mt-0.5 truncate">{barcodePrintItem.name}</p>
              {/* Emulated SVG Barcode */}
              <div className="my-2 flex justify-center items-center h-12 bg-white">
                <div className="flex gap-[2px] h-10 items-center">
                  {[1,2,1,3,1,2,3,1,1,2,1,3,2,1,2,1,3,1,2].map((w, idx) => (
                    <div key={idx} className={`h-full bg-black`} style={{ width: `${w * 1.5}px` }}></div>
                  ))}
                </div>
              </div>
              <p className="font-mono text-xs font-bold tracking-widest">{barcodePrintItem.barcode}</p>
              <p className="text-sm font-extrabold text-slate-900 mt-1">
                MRP: {formatCurrency(barcodePrintItem.mrp || barcodePrintItem.sale_price)}
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Label
            </Button>
          </div>
        </Modal>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onItemSelect={(it) => {
          setSearchQuery(it.name);
        }}
      />
    </div>
  );
};
