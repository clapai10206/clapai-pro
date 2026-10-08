import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type PaymentMethod = {
  id: string;
  label: string;
  logo: string;
  enabled: boolean;
  mode: 'manual' | 'gateway';
  phone: string;
  accountNumber: string;
  instructions: string;
  apiKeyEncrypted?: string;
};

export type SitePage = {
  slug: 'about' | 'privacy' | 'terms' | 'contact';
  title: string;
  content: string;
};

export type SiteSettings = {
  paymentMethods: PaymentMethod[];
  pages: SitePage[];
};

const settingsPath = join(process.cwd(), '.data', 'site-settings.json');
const defaultSettings: SiteSettings = {
  paymentMethods: [
    { id: 'youcan-pay', label: 'YouCan Pay', logo: 'YouCan', enabled: true, mode: 'gateway', phone: '', accountNumber: '', instructions: '' },
    { id: 'mopay', label: 'MoPay', logo: 'MoPay', enabled: false, mode: 'gateway', phone: '', accountNumber: '', instructions: '' },
    { id: 'wafacash', label: 'Wafacash', logo: 'Wafacash', enabled: false, mode: 'manual', phone: '', accountNumber: '', instructions: '' },
    { id: 'cash-plus', label: 'Cash Plus', logo: 'Cash Plus', enabled: false, mode: 'manual', phone: '', accountNumber: '', instructions: '' },
    { id: 'cash-on-delivery', label: 'الدفع عند الاستلام', logo: 'COD', enabled: false, mode: 'manual', phone: '', accountNumber: '', instructions: '' },
    { id: 'bank-transfer', label: 'تحويل بنكي', logo: 'Bank', enabled: false, mode: 'manual', phone: '', accountNumber: '', instructions: '' },
  ],
  pages: [
    { slug: 'about', title: 'من نحن', content: 'CLAPAI PRO مساعد ذكي لخدمة المجتمع المغربي.' },
    { slug: 'privacy', title: 'سياسة الخصوصية', content: 'نحترم خصوصيتك ونعمل على حماية البيانات التي تشاركها معنا.' },
    { slug: 'terms', title: 'شروط الاستخدام', content: 'باستخدامك للموقع، فإنك توافق على استخدامه بطريقة قانونية ومسؤولة.' },
    { slug: 'contact', title: 'اتصل بنا', content: 'للتواصل معنا، أرسل رسالة إلى فريق CLAPAI PRO.' },
  ],
};

function getEncryptionKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters.');
  }
  return scryptSync(secret, 'clapai-payment-secret-v1', 32);
}

export function encryptPaymentKey(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64url')}:${tag.toString('base64url')}:${ciphertext.toString('base64url')}`;
}

export function decryptPaymentKey(value: string) {
  const [version, iv, tag, ciphertext] = value.split(':');
  if (version !== 'v1' || !iv || !tag || !ciphertext) {
    throw new Error('Saved payment key has an unsupported format.');
  }

  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export async function readSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await readFile(settingsPath, 'utf8');
    const parsed = JSON.parse(raw) as SiteSettings;
    if (!Array.isArray(parsed.paymentMethods) || !Array.isArray(parsed.pages)) {
      throw new Error('Site settings file has an invalid shape.');
    }

    if (parsed.paymentMethods.some((method) => method.id === 'stripe')) {
      const paymentMethods = parsed.paymentMethods.filter((method) => method.id !== 'stripe');
      const youCanPay = paymentMethods.find((method) => method.id === 'youcan-pay');
      if (youCanPay) {
        youCanPay.enabled = true;
      } else {
        paymentMethods.unshift(structuredClone(defaultSettings.paymentMethods[0]));
      }
      const migrated = { ...parsed, paymentMethods };
      await writeSiteSettings(migrated);
      return migrated;
    }

    return parsed;
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      throw error;
    }
    return structuredClone(defaultSettings);
  }
}

export async function writeSiteSettings(settings: SiteSettings) {
  const directory = join(process.cwd(), '.data');
  await mkdir(directory, { recursive: true });
  const temporaryPath = `${settingsPath}.${randomBytes(8).toString('hex')}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(settings, null, 2), { encoding: 'utf8', mode: 0o600 });
  await rename(temporaryPath, settingsPath);
}
