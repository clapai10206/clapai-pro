import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/admin-auth';
import { readPayments, writePayments, type PaymentEntry } from '@/lib/payments';

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
    return NextResponse.json({ payments: await readPayments() }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'تعذر تحميل وسائل الدفع.' }, { status: 500 });
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
    const body: unknown = await request.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      !('payments' in body) ||
      !Array.isArray(body.payments) ||
      body.payments.length > 40
    ) {
      return NextResponse.json({ error: 'لائحة وسائل الدفع غير صالحة.' }, { status: 400 });
    }

    const ids = new Set<string>();
    const payments: PaymentEntry[] = [];
    for (const payment of body.payments) {
      if (
        typeof payment !== 'object' ||
        payment === null ||
        !('id' in payment) ||
        typeof payment.id !== 'string' ||
        !/^[a-z0-9][a-z0-9-]{0,39}$/.test(payment.id) ||
        ids.has(payment.id) ||
        !('name' in payment) ||
        typeof payment.name !== 'string' ||
        !payment.name.trim() ||
        payment.name.length > 80 ||
        !('icon' in payment) ||
        typeof payment.icon !== 'string' ||
        payment.icon.length > 200 ||
        (payment.icon !== '' &&
          !/^\/payment-methods\/[a-zA-Z0-9._-]+\.(svg|png|webp|jpe?g)$/.test(payment.icon)) ||
        !('instructions' in payment) ||
        typeof payment.instructions !== 'string' ||
        payment.instructions.length > 3000 ||
        !('type' in payment) ||
        (payment.type !== 'manual' && payment.type !== 'gateway') ||
        !('whatsapp' in payment) ||
        typeof payment.whatsapp !== 'string' ||
        !/^[0-9+()\s-]{0,30}$/.test(payment.whatsapp)
      ) {
        return NextResponse.json({ error: 'راجع بيانات وسيلة الدفع وحاول مجددًا.' }, { status: 400 });
      }
      ids.add(payment.id);
      payments.push({
        id: payment.id,
        name: payment.name.trim(),
        icon: payment.icon,
        instructions: payment.instructions.trim(),
        type: payment.type,
        whatsapp: payment.whatsapp.trim(),
      });
    }

    await writePayments(payments);
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Could not save payment methods:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'تعذر حفظ وسائل الدفع.' }, { status: 500 });
  }
}
