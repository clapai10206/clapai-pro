'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { PaymentMethodLogo } from '@/components/payment-method-logo';

type PaymentMethod = {
  id: string;
  label: string;
  logo: string;
  enabled: boolean;
  mode: 'manual' | 'gateway';
  phone: string;
  accountNumber: string;
  instructions: string;
  hasApiKey: boolean;
  apiKey: string;
  clearApiKey: boolean;
};

type SitePage = {
  slug: 'about' | 'privacy' | 'terms' | 'contact';
  title: string;
  content: string;
};

type AdminSettings = {
  paymentMethods: PaymentMethod[];
  pages: SitePage[];
};

const pageLabels: Record<SitePage['slug'], string> = {
  about: 'من نحن',
  privacy: 'سياسة الخصوصية',
  terms: 'شروط الاستخدام',
  contact: 'اتصل بنا',
};

const inputClass =
  'mt-1 w-full rounded-xl border border-[#ded9e6] bg-white px-3 py-2.5 text-sm text-[#24202b] outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/15';

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [settings, setSettings] = useState<AdminSettings>({ paymentMethods: [], pages: [] });
  const [tab, setTab] = useState<'payments' | 'pages'>('payments');
  const [newLabel, setNewLabel] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadSettings() {
    const response = await fetch('/api/admin/settings', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'تعذر تحميل إعدادات لوحة التحكم.');
    setSettings({
      paymentMethods: data.paymentMethods.map((method: Omit<PaymentMethod, 'apiKey' | 'clearApiKey'>) => ({
        ...method,
        apiKey: '',
        clearApiKey: false,
      })),
      pages: data.pages,
    });
  }

  useEffect(() => {
    fetch('/api/admin/session', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.authenticated) return;
        setAuthenticated(true);
        await loadSettings();
      })
      .catch(() => setError('تعذر الاتصال بالخادم.'))
      .finally(() => setChecking(false));
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر تسجيل الدخول.');
      setAuthenticated(true);
      setPassword('');
      await loadSettings();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تسجيل الدخول.');
    } finally {
      setBusy(false);
    }
  }

  function updatePayment(id: string, patch: Partial<PaymentMethod>) {
    setSettings((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.map((method) =>
        method.id === id ? { ...method, ...patch } : method
      ),
    }));
  }

  function addPaymentMethod() {
    const label = newLabel.trim();
    if (!label) return;
    const baseId =
      label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 28) || 'payment';
    const id = `${baseId}-${crypto.randomUUID().slice(0, 6)}`;
    setSettings((current) => ({
      ...current,
      paymentMethods: [
        ...current.paymentMethods,
        {
          id,
          label,
          logo: label.slice(0, 12),
          enabled: false,
          mode: 'manual',
          phone: '',
          accountNumber: '',
          instructions: '',
          hasApiKey: false,
          apiKey: '',
          clearApiKey: false,
        },
      ],
    }));
    setNewLabel('');
    setNotice('تزادت وسيلة الدفع. حفظ التغييرات باش تبقى.');
  }

  function updatePage(slug: SitePage['slug'], patch: Partial<SitePage>) {
    setSettings((current) => ({
      ...current,
      pages: current.pages.map((page) => (page.slug === slug ? { ...page, ...patch } : page)),
    }));
  }

  async function saveSettings() {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر حفظ الإعدادات.');
      setSettings({
        paymentMethods: data.paymentMethods.map((method: Omit<PaymentMethod, 'apiKey' | 'clearApiKey'>) => ({
          ...method,
          apiKey: '',
          clearApiKey: false,
        })),
        pages: data.pages,
      });
      setNotice('تحفظات الإعدادات بنجاح.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر حفظ الإعدادات.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    setAuthenticated(false);
    setSettings({ paymentMethods: [], pages: [] });
  }

  if (checking) {
    return <main className="grid min-h-screen place-items-center bg-[#f7f7f7] p-6 text-[#5c5c60]">كنتحقق من الدخول...</main>;
  }

  if (!authenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f7] p-5">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-[26px] border border-[#e7e2ec] bg-white p-7 shadow-[0_24px_55px_rgba(40,24,60,0.12)] sm:p-9"
        >
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#7c3aed] text-xl text-white">◉</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c3aed]">CLAPAI PRO</p>
              <h1 className="text-2xl font-black tracking-tight text-[#1d1d1f]">لوحة التحكم</h1>
            </div>
          </div>
          <label className="block text-sm font-bold text-[#37323d]" htmlFor="admin-password">كلمة المرور</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
          {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-full bg-[#7c3aed] px-5 py-3 font-bold text-white shadow-[0_10px_20px_rgba(124,58,237,0.24)] disabled:opacity-60"
          >
            {busy ? 'جاري الدخول...' : 'دخول آمن'}
          </button>
          <Link href="/" className="mt-5 block text-center text-sm font-semibold text-[#6d2ee6]">الرجوع للموقع</Link>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] px-4 py-5 text-[#1d1d1f] sm:px-7 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[#e7e2ec] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#7c3aed] text-xl text-white">◉</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c3aed]">CLAPAI PRO</p>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">لوحة التحكم</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/payments" className="rounded-full border border-[#ded9e6] px-4 py-2 text-sm font-bold">إدارة وسائل الدفع</Link>
            <Link href="/" className="rounded-full border border-[#ded9e6] px-4 py-2 text-sm font-bold">عرض الموقع</Link>
            <button type="button" onClick={logout} className="rounded-full bg-[#1b1225] px-4 py-2 text-sm font-bold text-white">خروج</button>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex rounded-full border border-[#e7e2ec] bg-white p-1 shadow-sm" aria-label="أقسام لوحة التحكم">
            <button
              type="button"
              onClick={() => setTab('payments')}
              className={`rounded-full px-5 py-2.5 text-sm font-bold ${tab === 'payments' ? 'bg-[#7c3aed] text-white' : 'text-[#55515b]'}`}
            >
              وسائل الدفع
            </button>
            <button
              type="button"
              onClick={() => setTab('pages')}
              className={`rounded-full px-5 py-2.5 text-sm font-bold ${tab === 'pages' ? 'bg-[#7c3aed] text-white' : 'text-[#55515b]'}`}
            >
              صفحات الموقع
            </button>
          </nav>
          <button
            type="button"
            onClick={saveSettings}
            disabled={busy}
            className="rounded-full bg-[#7c3aed] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_18px_rgba(124,58,237,0.22)] disabled:opacity-60"
          >
            {busy ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>

        {(notice || error) && (
          <p role={error ? 'alert' : 'status'} className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
            {error || notice}
          </p>
        )}

        {tab === 'payments' ? (
          <section className="mt-5 space-y-4">
            <div className="rounded-2xl border border-[#e7e2ec] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black">وسائل الأداء المغربية</h2>
              <p className="mt-1 text-sm leading-6 text-[#67616e]">فعّل الطرق اللي كتستعمل، وأضف معلومات الأداء. مفاتيح API كتتخزن مشفّرة وما كيبانوش من بعد الحفظ. بالنسبة لـ YouCan Pay استعمل private API key.</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={newLabel}
                  onChange={(event) => setNewLabel(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addPaymentMethod(); } }}
                  placeholder="اسم وسيلة الأداء الجديدة"
                  className={`${inputClass} mt-0 flex-1`}
                  maxLength={80}
                />
                <button type="button" onClick={addPaymentMethod} className="rounded-xl border border-[#d8c9f2] bg-[#f5efff] px-5 py-2.5 text-sm font-bold text-[#6128c4]">+ إضافة وسيلة</button>
              </div>
            </div>

            {settings.paymentMethods.map((method) => (
              <article key={method.id} className="rounded-2xl border border-[#e7e2ec] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 min-w-11 place-items-center rounded-xl bg-[#f1eaff] px-2 text-xs font-black text-[#6d2ee6]">
                      <PaymentMethodLogo
                        id={method.id}
                        label={method.label}
                        logo={method.logo}
                        className={method.id === 'cash-plus' ? 'h-7 w-7' : method.id === 'bank-transfer' || method.id === 'cash-on-delivery' ? 'h-7 w-10' : 'h-7 w-14'}
                      />
                    </span>
                    <div>
                      <h3 className="font-black">{method.label}</h3>
                      <p className="text-xs text-[#77717e]">{method.hasApiKey ? 'مفتاح API محفوظ ومشفّر' : 'ما كاين حتى مفتاح API محفوظ'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-bold">
                      <input
                        type="checkbox"
                        checked={method.enabled}
                        onChange={(event) => updatePayment(method.id, { enabled: event.target.checked })}
                        className="h-4 w-4 accent-[#7c3aed]"
                      />
                      مفعّلة
                    </label>
                    <button
                      type="button"
                      onClick={() => setSettings((current) => ({ ...current, paymentMethods: current.paymentMethods.filter((item) => item.id !== method.id) }))}
                      className="rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="text-sm font-semibold">اسم الوسيلة
                    <input value={method.label} onChange={(event) => updatePayment(method.id, { label: event.target.value })} className={inputClass} maxLength={80} />
                  </label>
                  <label className="text-sm font-semibold">النص/الشعار الظاهر
                    <input value={method.logo} onChange={(event) => updatePayment(method.id, { logo: event.target.value })} className={inputClass} maxLength={40} />
                  </label>
                  <label className="text-sm font-semibold">طريقة التفعيل
                    <select value={method.mode} onChange={(event) => updatePayment(method.id, { mode: event.target.value as PaymentMethod['mode'] })} className={inputClass}>
                      <option value="manual">يدوي / معلومات تحويل</option>
                      <option value="gateway">بوابة أداء إلكترونية</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">رقم الهاتف
                    <input value={method.phone} onChange={(event) => updatePayment(method.id, { phone: event.target.value })} className={inputClass} maxLength={120} />
                  </label>
                  <label className="text-sm font-semibold">رقم الحساب / التاجر
                    <input value={method.accountNumber} onChange={(event) => updatePayment(method.id, { accountNumber: event.target.value })} className={inputClass} maxLength={160} />
                  </label>
                  <label className="text-sm font-semibold">{method.id === 'youcan-pay' ? 'Private API key ديال YouCan Pay' : 'مفتاح API'} {method.hasApiKey && <span className="text-emerald-700">(محفوظ)</span>}
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={method.apiKey}
                      onChange={(event) => updatePayment(method.id, { apiKey: event.target.value, clearApiKey: false })}
                      placeholder={method.hasApiKey ? 'اتركه فارغًا للإبقاء على المفتاح' : 'اختياري'}
                      className={inputClass}
                    />
                    {method.hasApiKey && (
                      <button type="button" onClick={() => updatePayment(method.id, { clearApiKey: true, apiKey: '', hasApiKey: false })} className="mt-1 text-xs font-bold text-red-600">
                        إزالة المفتاح المحفوظ
                      </button>
                    )}
                  </label>
                  <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">تعليمات الأداء للزبون
                    <textarea value={method.instructions} onChange={(event) => updatePayment(method.id, { instructions: event.target.value })} className={`${inputClass} min-h-24 resize-y`} maxLength={3000} />
                  </label>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            {settings.pages.map((page) => (
              <article key={page.slug} className="rounded-2xl border border-[#e7e2ec] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black">{pageLabels[page.slug]}</h2>
                  <Link href={`/pages/${page.slug}`} target="_blank" className="text-sm font-bold text-[#6d2ee6]">معاينة ↗</Link>
                </div>
                <label className="text-sm font-semibold">العنوان
                  <input value={page.title} onChange={(event) => updatePage(page.slug, { title: event.target.value })} className={inputClass} maxLength={100} />
                </label>
                <label className="mt-4 block text-sm font-semibold">المحتوى
                  <textarea value={page.content} onChange={(event) => updatePage(page.slug, { content: event.target.value })} className={`${inputClass} min-h-52 resize-y leading-6`} maxLength={20000} />
                </label>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
