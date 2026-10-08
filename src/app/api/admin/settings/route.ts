import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/admin-auth';
import {
  encryptPaymentKey,
  readSiteSettings,
  writeSiteSettings,
  type PaymentMethod,
  type SitePage,
} from '@/lib/site-settings';

function getSafeAdminSettings(settings: Awaited<ReturnType<typeof readSiteSettings>>) {
  return {
    paymentMethods: settings.paymentMethods.map(({ apiKeyEncrypted, ...method }) => ({
      ...method,
      hasApiKey: Boolean(apiKeyEncrypted),
    })),
    pages: settings.pages,
  };
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const requestHost =
      request.headers.get('x-forwarded-host') ??
      request.headers.get('host') ??
      new URL(request.url).host;
    return new URL(origin).host === requestHost;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'يلزم تسجيل الدخول.' }, { status: 401 });
  }
  try {
    return NextResponse.json(getSafeAdminSettings(await readSiteSettings()), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'تعذر تحميل الإعدادات المحلية.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'يلزم تسجيل الدخول.' }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'الطلب مرفوض.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body.paymentMethods) || !Array.isArray(body.pages)) {
      return NextResponse.json({ error: 'بيانات الإعدادات غير صالحة.' }, { status: 400 });
    }
    if (body.paymentMethods.length > 40 || body.pages.length !== 4) {
      return NextResponse.json({ error: 'عدد وسائل الدفع أو الصفحات غير صالح.' }, { status: 400 });
    }

    const current = await readSiteSettings();
    const existingById = new Map(current.paymentMethods.map((method) => [method.id, method]));
    const ids = new Set<string>();
    const paymentMethods: PaymentMethod[] = [];

    for (const item of body.paymentMethods) {
      if (
        typeof item.id !== 'string' ||
        !/^[a-z0-9][a-z0-9-]{0,39}$/.test(item.id) ||
        item.id === 'stripe' ||
        ids.has(item.id) ||
        typeof item.label !== 'string' ||
        !item.label.trim() ||
        item.label.length > 80 ||
        typeof item.logo !== 'string' ||
        item.logo.length > 40 ||
        typeof item.enabled !== 'boolean' ||
        (item.mode !== 'manual' && item.mode !== 'gateway') ||
        typeof item.phone !== 'string' ||
        item.phone.length > 120 ||
        typeof item.accountNumber !== 'string' ||
        item.accountNumber.length > 160 ||
        typeof item.instructions !== 'string' ||
        item.instructions.length > 3000 ||
        (item.apiKey !== undefined && (typeof item.apiKey !== 'string' || item.apiKey.length > 4000))
      ) {
        return NextResponse.json({ error: 'راجع بيانات وسيلة الدفع وحاول مجددًا.' }, { status: 400 });
      }

      ids.add(item.id);
      const previous = existingById.get(item.id);
      let apiKeyEncrypted = item.clearApiKey ? undefined : previous?.apiKeyEncrypted;
      if (typeof item.apiKey === 'string' && item.apiKey.trim()) {
        apiKeyEncrypted = encryptPaymentKey(item.apiKey.trim());
      }
      paymentMethods.push({
        id: item.id,
        label: item.label.trim(),
        logo: item.logo.trim() || item.label.trim().slice(0, 12),
        enabled: item.enabled,
        mode: item.mode,
        phone: item.phone.trim(),
        accountNumber: item.accountNumber.trim(),
        instructions: item.instructions.trim(),
        ...(apiKeyEncrypted ? { apiKeyEncrypted } : {}),
      });
    }

    const pages: SitePage[] = [];
    const expectedSlugs = ['about', 'privacy', 'terms', 'contact'];
    for (const slug of expectedSlugs) {
      const page = body.pages.find((item: SitePage) => item.slug === slug);
      if (
        !page ||
        typeof page.title !== 'string' ||
        !page.title.trim() ||
        page.title.length > 100 ||
        typeof page.content !== 'string' ||
        page.content.length > 20000
      ) {
        return NextResponse.json({ error: 'راجع عناوين ومحتوى الصفحات الأربعة.' }, { status: 400 });
      }
      pages.push({ slug: slug as SitePage['slug'], title: page.title.trim(), content: page.content });
    }

    const settings = { paymentMethods, pages };
    await writeSiteSettings(settings);
    return NextResponse.json(getSafeAdminSettings(settings));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'تعذر حفظ الإعدادات.' },
      { status: 500 }
    );
  }
}
