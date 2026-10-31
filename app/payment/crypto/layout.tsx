import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Crypto Payment Verification',
    description: 'Verify your USDT cryptocurrency payment for JobMatch AI.',
    path: '/payment/crypto',
    noIndex: true,
  });
}

export default function PaymentCryptoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

