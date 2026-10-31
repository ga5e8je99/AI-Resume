import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Plans & Pricing',
    description:
      'Flexible pricing for job seekers. Starter free plan with 3 AI generations, Pro unlimited monthly/annual plans, and Pay-As-You-Go credits.',
    path: '/pricing',
  });
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
