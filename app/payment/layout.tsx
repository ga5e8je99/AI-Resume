import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Payment Status',
    description: 'Secure payment verification and order status.',
    path: '/payment',
    noIndex: true,
  });
}

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

