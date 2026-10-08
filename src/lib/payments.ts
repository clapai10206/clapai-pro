import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type PaymentEntry = {
  id: string;
  name: string;
  icon: string;
  instructions: string;
  type: 'manual' | 'gateway';
  whatsapp: string;
};

const paymentsPath = join(process.cwd(), 'src', 'data', 'payments.json');

export async function readPayments(): Promise<PaymentEntry[]> {
  const payments = JSON.parse(await readFile(paymentsPath, 'utf8')) as unknown;
  if (
    !Array.isArray(payments) ||
    payments.some(
      (payment) =>
        !payment ||
        typeof payment.id !== 'string' ||
        typeof payment.name !== 'string' ||
        typeof payment.icon !== 'string' ||
        typeof payment.instructions !== 'string' ||
        (payment.type !== 'manual' && payment.type !== 'gateway') ||
        typeof payment.whatsapp !== 'string'
    )
  ) {
    throw new Error('ملف وسائل الدفع فيه بيانات غير صالحة.');
  }
  return payments;
}

export async function writePayments(payments: PaymentEntry[]) {
  const temporaryPath = `${paymentsPath}.${randomUUID()}.tmp`;
  await mkdir(join(process.cwd(), 'src', 'data'), { recursive: true });
  try {
    await writeFile(temporaryPath, JSON.stringify(payments, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
    await rename(temporaryPath, paymentsPath);
  } catch (error) {
    await import('node:fs/promises').then(({ unlink }) => unlink(temporaryPath).catch(() => undefined));
    throw error;
  }
}
