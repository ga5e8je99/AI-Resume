import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Payment Cancelled',
    description: 'Your checkout was cancelled and no charges were made.',
    path: '/payment/cancelled',
    noIndex: true,
  });
}

export default function PaymentCancelledLayout({ children }: { children: React.ReactNode }) {
  return children;
}

