import React, { useState } from 'react';
import { Wrench, FileSpreadsheet, Upload, Download, Tag, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getLocalItems, getLocalParties, saveLocalItem, saveLocalParty } from '../../lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const UtilitiesPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [importLog, setImportLog] = useState<string | null>(null);

  const handleExportItemsCSV = async () => {
    if (!activeBusiness) return;
    const items = await getLocalItems(activeBusiness.id);
    const headers = 'Name,SKU,Barcode,Category,Unit,SalePrice,PurchasePrice,TaxRate,CurrentStock\n';
    const rows = items
      .map(
        (i) =>
          `"${i.name}","${i.sku || ''}","${i.barcode || ''}","${i.category_name || ''}","${i.unit}",${i.sale_price},${i.purchase_price},${i.tax_rate},${i.current_stock}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bizledger_items_${Date.now()}.csv`;
    a.click();
  };

  const handleExportPartiesCSV = async () => {
    if (!activeBusiness) return;
    const parties = await getLocalParties(activeBusiness.id);
    const headers = 'Name,Type,Phone,GSTIN,State,Balance\n';
    const rows = parties
      .map(
        (p) =>
          `"${p.name}","${p.type}","${p.phone}","${p.gstin || ''}","${p.state}",${p.current_balance}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bizledger_parties_${Date.now()}.csv`;
    a.click();
  };

  const handleImportItemsCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBusiness) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        let imported = 0;

        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
          if (parts[0]) {
            await saveLocalItem({
              id: `item_csv_${Date.now()}_${i}`,
              business_id: activeBusiness.id,
              name: parts[0],
              type: 'product',
              sku: parts[1] || undefined,
              barcode: parts[2] || undefined,
              category_name: parts[3] || 'General',
              unit: parts[4] || 'PCS',
              sale_price: parseFloat(parts[5]) || 0,
              purchase_price: parseFloat(parts[6]) || 0,
              tax_rate: parseInt(parts[7]) || 18,
              is_tax_inclusive: true,
              current_stock: parseFloat(parts[8]) || 0,
              opening_stock: parseFloat(parts[8]) || 0,
              low_stock_alert: 10,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            imported++;
          }
        }
        setImportLog(`Successfully imported ${imported} items from CSV!`);
      } catch (err) {
        setImportLog('Failed to process CSV file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Utilities & Bulk Tools
        </h1>
        <p className="text-xs text-slate-500">
          CSV/Excel import, bulk data export, barcode printing, and migration tools
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CSV Import/Export Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <CardTitle>Catalog & Parties Excel/CSV</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <p className="text-slate-600">
              Bulk download your items or customer lists to Excel/CSV, or upload a spreadsheet to populate products quickly.
            </p>

            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExportItemsCSV}
                leftIcon={<Download className="w-4 h-4 text-brand-600" />}
              >
                Export All Items (CSV)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExportPartiesCSV}
                leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
              >
                Export All Parties (CSV)
              </Button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50 cursor-pointer font-medium text-slate-700">
                <Upload className="w-4 h-4 text-brand-600" />
                <span>Upload Items CSV File</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportItemsCSV}
                />
              </label>
              {importLog && (
                <p className="mt-2 text-xs font-semibold text-emerald-700">{importLog}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Barcode Utility Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              <CardTitle>Barcode Generation & Labels</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-slate-600">
              BizLedger auto-generates EAN-13 and Code-128 barcodes for products. You can print sticky labels on 50x25mm thermal or A4 sticker sheets.
            </p>
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900">
              To print individual labels, open any item in <strong>Items & Inventory</strong> and click the <strong>Label</strong> action icon.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
