'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { PaymentMethodLogo } from '@/components/payment-method-logo';

type PaymentEntry = {
  id: string;
  name: string;
  icon: string;
  instructions: string;
  type: 'manual' | 'gateway';
  whatsapp: string;
};

const inputClass =
  'mt-1 w-full rounded-xl border border-[#ded9e6] bg-white px-3 py-2.5 text-sm text-[#24202b] outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/15';
const emptyPayment: PaymentEntry = {
  id: '',
  name: '',
  icon: '',
  instructions: '',
  type: 'manual',
  whatsapp: '',
};

export default function AdminPaymentsPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [form, setForm] = useState<PaymentEntry>(emptyPayment);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function loadPayments() {
    const response = await fetch('/api/admin/payments', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'تعذر تحميل وسائل الدفع.');
    setPayments(data.payments);
  }

  useEffect(() => {
    fetch('/api/admin/session', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.authenticated) return;
        setAuthenticated(true);
        await loadPayments();
      })
      .catch(() => setError('تعذر الاتصال بالخادم.'))
      .finally(() => setChecking(false));
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
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
      await loadPayments();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تسجيل الدخول.');
    } finally {
      setBusy(false);
    }
  }

  function beginEdit(payment: PaymentEntry) {
    setEditingId(payment.id);
    setForm({ ...payment });
    setNotice('');
    setError('');
  }

  function saveToList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    const id =
      editingId ??
      `${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'payment'}-${crypto.randomUUID().slice(0, 6)}`;
    const entry = { ...form, id, name };
    setPayments((current) =>
      editingId
        ? current.map((payment) => (payment.id === editingId ? entry : payment))
        : [...current, entry]
    );
    setForm(emptyPayment);
    setEditingId(null);
    setNotice('تبدلات اللائحة محليًا. اضغط حفظ وسائل الدفع لتطبيقها على الموقع.');
    setError('');
  }

  async function savePayments() {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payments }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر حفظ وسائل الدفع.');
      setPayments(data.payments);
      setNotice('تحفظات وسائل الدفع بنجاح.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر حفظ وسائل الدفع.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    setAuthenticated(false);
    setPayments([]);
  }

  if (checking) {
    return <main className="grid min-h-screen place-items-center bg-[#f7f7f7] p-6 text-[#5c5c60]">كنتحقق من الدخول...</main>;
  }

  if (!authenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f7] p-5">
        <form onSubmit={login} className="w-full max-w-md rounded-[26px] border border-[#e7e2ec] bg-white p-7 shadow-[0_24px_55px_rgba(40,24,60,0.12)] sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c3aed]">CLAPAI PRO</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#1d1d1f]">إدارة وسائل الدفع</h1>
          <label className="mt-6 block text-sm font-bold text-[#37323d]" htmlFor="admin-payments-password">كلمة المرور</label>
          <input id="admin-payments-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
          {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="mt-5 w-full rounded-full bg-[#7c3aed] px-5 py-3 font-bold text-white disabled:opacity-60">
            {busy ? 'جاري الدخول...' : 'دخول آمن'}
          </button>
          <Link href="/admin" className="mt-5 block text-center text-sm font-semibold text-[#6d2ee6]">الرجوع للوحة التحكم</Link>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] px-4 py-5 text-[#1d1d1f] sm:px-7 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[#e7e2ec] bg-white p-5 shadow-sm sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c3aed]">CLAPAI PRO</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">إدارة وسائل الدفع</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="rounded-full border border-[#ded9e6] px-4 py-2 text-sm font-bold">لوحة التحكم</Link>
            <Link href="/" className="rounded-full border border-[#ded9e6] px-4 py-2 text-sm font-bold">عرض الموقع</Link>
            <button type="button" onClick={logout} className="rounded-full bg-[#1b1225] px-4 py-2 text-sm font-bold text-white">خروج</button>
          </div>
        </header>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={saveToList} className="h-fit rounded-2xl border border-[#e7e2ec] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">{editingId ? 'تعديل وسيلة الدفع' : 'إضافة وسيلة دفع'}</h2>
            <label className="mt-4 block text-sm font-semibold">الاسم
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} maxLength={80} />
            </label>
            <label className="mt-4 block text-sm font-semibold">مسار الأيقونة
              <input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} placeholder="/payment-methods/logo.svg" className={inputClass} maxLength={200} />
              <span className="mt-1 block text-xs text-[#77717e]">استعمل صورة داخل public/payment-methods، بدون رقم هاتف أو بيانات حساب.</span>
            </label>
            <label className="mt-4 block text-sm font-semibold">تعليمات الأداء
              <textarea value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} className={`${inputClass} min-h-24 resize-y`} maxLength={3000} />
            </label>
            <label className="mt-4 block text-sm font-semibold">نوع الأداء
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as PaymentEntry['type'] })} className={inputClass}>
                <option value="manual">يدوي</option>
                <option value="gateway">بوابة إلكترونية</option>
              </select>
            </label>
            <label className="mt-4 block text-sm font-semibold">رقم واتساب (اختياري)
              <input type="tel" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} placeholder="اتركه فارغًا إذا ما متوفرش" className={inputClass} maxLength={30} />
            </label>
            <div className="mt-5 flex gap-2">
              <button type="submit" className="flex-1 rounded-full bg-[#7c3aed] px-4 py-3 text-sm font-bold text-white">{editingId ? 'تحديث اللائحة' : 'إضافة للائحة'}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyPayment); }} className="rounded-full border border-[#ded9e6] px-4 py-3 text-sm font-bold">إلغاء</button>}
            </div>
          </form>

          <section className="rounded-2xl border border-[#e7e2ec] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">وسائل الدفع فالموقع</h2>
                <p className="mt-1 text-sm text-[#67616e]">التعليمات ورقم واتساب اختياريين، ويمكنك تركهم فارغين.</p>
              </div>
              <button type="button" onClick={savePayments} disabled={busy} className="rounded-full bg-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {busy ? 'جاري الحفظ...' : 'حفظ وسائل الدفع'}
              </button>
            </div>
            {(notice || error) && <p role={error ? 'alert' : 'status'} className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>{error || notice}</p>}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-right text-sm">
                <thead><tr className="border-b border-[#eeeaf2] text-[#67616e]"><th className="p-3">الأيقونة</th><th className="p-3">الاسم</th><th className="p-3">النوع</th><th className="p-3">الإجراءات</th></tr></thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-[#f0edf3] last:border-0">
                      <td className="p-3"><PaymentMethodLogo id={payment.id} label={payment.name} logo={payment.name} icon={payment.icon} className="h-8 w-14" /></td>
                      <td className="p-3 font-bold">{payment.name}</td>
                      <td className="p-3">{payment.type === 'manual' ? 'يدوي' : 'إلكتروني'}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => beginEdit(payment)} className="rounded-lg bg-[#f1eaff] px-3 py-1.5 font-bold text-[#6128c4]">تعديل</button>
                          <button type="button" onClick={() => setPayments((current) => current.filter((item) => item.id !== payment.id))} className="rounded-lg bg-red-50 px-3 py-1.5 font-bold text-red-600">حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-[#77717e]">ما كايناش وسائل دفع؛ زيد وحدة من الفورم.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
