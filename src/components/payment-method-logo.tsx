import Image from 'next/image';

const paymentLogos: Record<string, { src: string; alt: string }> = {
  'youcan-pay': { src: '/payment-methods/youcan-pay.svg', alt: 'YouCan Pay' },
  wafacash: { src: '/payment-methods/wafacash.webp', alt: 'Wafacash' },
  'cash-plus': { src: '/payment-methods/cash-plus.png', alt: 'Cash Plus' },
  'cash-on-delivery': { src: '/payment-methods/cash-on-delivery.svg', alt: 'Cash on delivery' },
  'bank-transfer': { src: '/payment-methods/bank-transfer.svg', alt: 'Bank transfer' },
};

type PaymentMethodLogoProps = {
  id: string;
  label: string;
  logo: string;
  icon?: string;
  className?: string;
};

export function PaymentMethodLogo({ id, label, logo, icon, className = '' }: PaymentMethodLogoProps) {
  const image = icon
    ? { src: icon, alt: label }
    : paymentLogos[id];
  if (!image?.src) {
    return <span className={className}>{logo || label}</span>;
  }

  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={128}
      height={64}
      className={`object-contain ${className}`}
    />
  );
}
