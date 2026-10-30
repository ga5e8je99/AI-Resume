import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plans & Pricing',
  description:
    'Flexible pricing for job seekers. Starter free plan with 3 AI generations, Pro unlimited monthly/annual plans, and Pay-As-You-Go credits.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Plans & Pricing | JobMatch AI',
    description:
      'Flexible pricing for job seekers. Starter free plan with 3 AI generations, Pro unlimited monthly/annual plans, and Pay-As-You-Go credits.',
    url: 'https://ai-resume-rho.vercel.app/pricing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plans & Pricing | JobMatch AI',
    description:
      'Flexible pricing for job seekers. Starter free plan with 3 AI generations, Pro unlimited monthly/annual plans, and Pay-As-You-Go credits.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
