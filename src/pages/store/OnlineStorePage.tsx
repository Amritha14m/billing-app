import React, { useState, useEffect } from 'react';
import { Globe, Copy, Check, ExternalLink, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getLocalItems } from '../../lib/db';
import { Item } from '../../types';
import { formatCurrency } from '../../lib/gst';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const OnlineStorePage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeBusiness) return;
    getLocalItems(activeBusiness.id).then(setItems);
  }, [activeBusiness]);

  const storeSlug = activeBusiness?.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'mystore';
  const storefrontUrl = `https://store.bizledger.app/${storeSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storefrontUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Online Storefront
        </h1>
        <p className="text-xs text-slate-500">
          Share your online catalogue with customers to receive wholesale & retail digital orders
        </p>
      </div>

      {/* Store Link Card */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Shareable Storefront URL
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Globe className="w-4 h-4 text-brand-600" />
              <span className="font-mono text-sm font-bold text-slate-900">{storefrontUrl}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Customers can view products, retail prices, and place online orders directly.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCopyLink}
            leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Link Copied!' : 'Copy Store Link'}
          </Button>
        </CardContent>
      </Card>

      {/* Products in Online Store */}
      <Card>
        <CardHeader>
          <CardTitle>Catalog Products in Online Store ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <div key={item.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-slate-900">{item.name}</h4>
                  <Badge variant="green" size="sm">Online</Badge>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">{item.category_name}</p>
                <div className="flex justify-between items-baseline mt-3">
                  <span className="font-bold text-slate-900 text-sm">{formatCurrency(item.sale_price)}</span>
                  <span className="text-slate-400 text-[10px]">Stock: {item.current_stock} {item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
