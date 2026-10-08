import { NextResponse } from 'next/server';
import { readPayments } from '@/lib/payments';
import { readSiteSettings } from '@/lib/site-settings';

export async function GET() {
  try {
    const [settings, payments] = await Promise.all([readSiteSettings(), readPayments()]);
    return NextResponse.json(
      {
        paymentMethods: payments.map(({ id, name, icon, instructions, type, whatsapp }) => ({
            id,
            label: name,
            logo: name,
            icon,
            mode: type,
            instructions,
            whatsapp,
          })),
        pages: settings.pages,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ error: 'تعذر تحميل إعدادات الموقع.' }, { status: 500 });
  }
}
