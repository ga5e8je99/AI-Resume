import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Payment Confirmation',
    description: 'Confirming your JobMatch AI subscription or credit purchase.',
    path: '/payment/success',
    noIndex: true,
  });
}

export default function PaymentSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}

