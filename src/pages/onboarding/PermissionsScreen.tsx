import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Camera, FolderArchive, ShieldCheck, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/ui/Button';

export const PermissionsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const permissions = [
    {
      icon: Bell,
      title: t('perm_notifications'),
      reason: t('perm_notifications_desc'),
      color: 'bg-blue-50 text-brand-600',
    },
    {
      icon: Camera,
      title: t('perm_camera'),
      reason: t('perm_camera_desc'),
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: FolderArchive,
      title: t('perm_storage'),
      reason: t('perm_storage_desc'),
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
      {/* Top Header */}
      <div className="pt-6 sm:pt-10">
        <div className="flex items-center gap-2 text-brand-600 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Device Access & Privacy</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('allow_permissions')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          {t('permissions_notice')}
        </p>
      </div>

      {/* Permissions List */}
      <div className="space-y-3.5 my-6">
        {permissions.map((perm, idx) => {
          const Icon = perm.icon;
          return (
            <div
              key={idx}
              className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-subtle flex items-start gap-3.5"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${perm.color}`}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">{perm.title}</h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{perm.reason}</p>
              </div>
            </div>
          );
        })}

        {/* Honest Privacy Guarantee Card */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-bold">
            ✓
          </div>
          <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">
            {t('no_sms_policy')}
          </p>
        </div>
      </div>

      {/* Footer & Action */}
      <div className="pb-6 pt-2 space-y-3">
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/login')}
          className="w-full text-base font-bold shadow-lg py-3.5"
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          {t('continue')}
        </Button>

        <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
          <Link to="/privacy-policy" className="hover:text-brand-600 underline">
            {t('privacy_policy')}
          </Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-brand-600 underline">
            {t('terms_of_service')}
          </Link>
        </div>
      </div>
    </div>
  );
};
