import { NextResponse } from 'next/server';
import { isIP } from 'node:net';
import { randomUUID } from 'node:crypto';
import { readPayments } from '@/lib/payments';
import { decryptPaymentKey, readSiteSettings } from '@/lib/site-settings';

type PlanConfig = {
  amount: number;
};

const planMap: Record<string, PlanConfig> = {
  free: { amount: 0 },
  pro: { amount: 9900 },
  business: { amount: 19900 },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getCustomerIp(request: Request) {
  const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  for (const candidate of [forwardedIp, realIp]) {
    if (candidate && isIP(candidate)) return candidate;
  }
  return '127.0.0.1';
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!isRecord(body)) {
      return NextResponse.json({ success: false, message: 'بيانات الطلب ماشي صحيحة.' }, { status: 400 });
    }
    const normalizedPlan = typeof body.plan === 'string' ? body.plan.toLowerCase() : 'pro';
    const paymentMethodId = typeof body.paymentMethod === 'string' ? body.paymentMethod : '';
    const paymentLanguage =
      body.lang === 'EN' ? 'en' : body.lang === 'FR' ? 'fr' : 'ar';
    const planConfig = planMap[normalizedPlan];

    if (!planConfig) {
      return NextResponse.json({ success: false, message: 'الباقة المطلوبة غير موجودة.' }, { status: 400 });
    }

    if (normalizedPlan === 'free') {
      return NextResponse.json({
        success: true,
        url: `/?checkout=success&plan=free`,
        message: 'تم اختيار الباقة المجانية.',
      });
    }

    const [settings, paymentMethods] = await Promise.all([readSiteSettings(), readPayments()]);
    const method = paymentMethods.find((item) => item.id === paymentMethodId);
    if (!method) {
      return NextResponse.json(
        { success: false, message: 'وسيلة الأداء هادي ما مفعّلاش. اختار وسيلة أخرى.' },
        { status: 400 }
      );
    }

    if (method.type === 'manual') {
      return NextResponse.json({
        success: true,
        method: method.id,
        message: method.instructions
          ? `طريقة الأداء: ${method.name}\n${method.instructions}`
          : `طريقة الأداء ${method.name} مختارة. تواصل مع الفريق لإكمال الأداء.`,
      });
    }

    if (method.id !== 'youcan-pay') {
      return NextResponse.json(
        {
          success: false,
          message: `بوابة ${method.name} محفوظة في الإعدادات، لكن خاصها ربط تقني خاص بالمزود قبل قبول أداء إلكتروني مباشر.`,
        },
        { status: 501 }
      );
    }

    const configuredMethod = settings.paymentMethods.find((item) => item.id === method.id);
    if (!configuredMethod?.apiKeyEncrypted) {
      return NextResponse.json(
        { success: false, message: 'دخل private API key ديال YouCan Pay فلوحة التحكم باش يتفعّل الأداء.' },
        { status: 503 }
      );
    }

    let privateKey: string;
    try {
      privateKey = decryptPaymentKey(configuredMethod.apiKeyEncrypted);
    } catch {
      return NextResponse.json(
        { success: false, message: 'تعذر قراءة مفتاح YouCan Pay. عاود حفظه من لوحة التحكم.' },
        { status: 503 }
      );
    }

    const sandbox = process.env.YOUCAN_PAY_SANDBOX !== 'false';
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/+$/, '');
    const orderId = `clapai-${normalizedPlan}-${randomUUID()}`;
    const providerResponse = await fetch(
      `https://youcanpay.com/${sandbox ? 'sandbox/' : ''}api/tokenize`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          pri_key: privateKey,
          amount: String(planConfig.amount),
          currency: 'MAD',
          order_id: orderId,
          customer_ip: getCustomerIp(req),
          success_url: `${appUrl}/?checkout=success&plan=${normalizedPlan}&method=youcan-pay`,
          error_url: `${appUrl}/?checkout=cancel&plan=${normalizedPlan}`,
          customer: {},
          metadata: { plan: normalizedPlan },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!providerResponse.ok) {
      return NextResponse.json(
        { success: false, message: 'YouCan Pay ما قبلش الطلب. تأكد من المفتاح، المبلغ وإعدادات الحساب.' },
        { status: 502 }
      );
    }

    let providerData: unknown;
    try {
      providerData = await providerResponse.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'الجواب ديال YouCan Pay ما كانش صالح. عاود المحاولة من بعد.' },
        { status: 502 }
      );
    }
    const token = isRecord(providerData) && isRecord(providerData.token) ? providerData.token : null;
    if (!token || typeof token.id !== 'string' || !token.id) {
      return NextResponse.json(
        { success: false, message: 'ما قدرناش نوجدّو صفحة الأداء ديال YouCan Pay. عاود المحاولة من بعد.' },
        { status: 502 }
      );
    }

    const paymentUrl = new URL(
      `${sandbox ? 'https://youcanpay.com/sandbox/payment-form/' : 'https://youcanpay.com/payment-form/'}${encodeURIComponent(token.id)}`
    );
    paymentUrl.searchParams.set('lang', paymentLanguage);

    return NextResponse.json({ url: paymentUrl.toString(), success: true, method: method.id });
  } catch (error) {
    console.error('Checkout request failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { success: false, message: 'وقع مشكل فبدء الأداء. عاود المحاولة من بعد.' },
      { status: 500 }
    );
  }
}
