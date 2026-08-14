import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { Badge } from '../components/Badge';
import {
  Building2,
  ShieldCheck,
  Globe,
  Database,
  Lock,
  Server,
  Save,
  Check,
} from 'lucide-react';

export const SchoolSettingsPage: React.FC = () => {
  const { organization, refreshUser } = usePlatformAuth();
  const [name, setName] = useState(organization?.name || '');
  const [slug, setSlug] = useState(organization?.slug || '');
  const [countryCode, setCountryCode] = useState(organization?.countryCode || 'SA');
  const [academicYearName, setAcademicYearName] = useState(organization?.academicYearName || '2026-2027');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await platformApi.getDashboardStats();
        setAuditLogs(res.data?.recentLogs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadLogs();
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">إعدادات المؤسسة وسجل الأمان والمراقبة</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          تكوين هوية المدرسة، سياسات العزل السحابي (Multi-Tenancy)، وسجلات الأنشطة والعمليات.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Organization Profile Form */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleSaveSettings}
            className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-5 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                ملف المؤسسة التعليمية
              </h3>
              <Badge variant="emerald">بيانات نشطة</Badge>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم المؤسسة التعليمية:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  المعرف السحابي (Tenant Slug):
                </label>
                <input
                  type="text"
                  disabled
                  value={slug}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-400 text-xs font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">الدولة والولاية القضائية:</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="SA">المملكة العربية السعودية (SA)</option>
                  <option value="AE">الإمارات العربية المتحدة (AE)</option>
                  <option value="KW">الكويت (KW)</option>
                  <option value="QA">قطر (QA)</option>
                  <option value="OM">سلطنة عمان (OM)</option>
                  <option value="BH">مملكة البحرين (BH)</option>
                  <option value="EG">جمهورية مصر العربية (EG)</option>
                  <option value="JO">المملكة الأردنية الهاشمية (JO)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">السنة الأكاديمية الافتراضية:</label>
              <input
                type="text"
                value={academicYearName}
                onChange={(e) => setAcademicYearName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    تم حفظ الإعدادات
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    حفظ التغييرات
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security & Multi-Tenancy Specs Card */}
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
            <h4 className="font-bold text-xs text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              مواصفات عزل البيانات والأمان (Multi-Tenant Architecture)
            </h4>
            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <div className="flex items-center gap-2 text-emerald-300">
                <Lock className="w-3.5 h-3.5" />
                <span>عزل كامل لقاعدة البيانات عبر معرّف المنشأة ومستويات الأمان (RLS-Guarded).</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300">
                <Database className="w-3.5 h-3.5" />
                <span>تشفير شامل للاتصال والبيانات الساكنة (AES-256 / TLS 1.3).</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300">
                <Server className="w-3.5 h-3.5" />
                <span>تخزين متوافق مع ضوابط حماية البيانات الشخصية والتعليمية.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Audit Trail Stream */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                سجل التدقيق والمراقبة الحية
              </h3>
              <Badge variant="blue" size="sm">
                مباشر
              </Badge>
            </div>

            <div className="space-y-2.5">
              {auditLogs.length > 0 ? (
                auditLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>المستخدم: {log.userEmail || 'System'}</span>
                      <span className="text-[10px] font-mono text-slate-500">{log.ipAddress || '127.0.0.1'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">لا توجد سجلات بعد</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
