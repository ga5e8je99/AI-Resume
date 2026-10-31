import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Template Preview',
    description: 'Live template rendering preview.',
    path: '/preview-template',
    noIndex: true,
  });
}

export default function PreviewTemplateLayout({ children }: { children: React.ReactNode }) {
  return children;
}

