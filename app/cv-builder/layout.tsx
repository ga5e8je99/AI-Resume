import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Academic & Executive CV Builder',
  description:
    'Design multi-page academic, scientific, and executive CVs with dedicated sections for publications, grants, and research.',
  alternates: {
    canonical: '/cv-builder',
  },
  openGraph: {
    title: 'Academic & Executive CV Builder | JobMatch AI',
    description:
      'Design multi-page academic, scientific, and executive CVs with dedicated sections for publications, grants, and research.',
    url: 'https://ai-resume-rho.vercel.app/cv-builder',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Academic & Executive CV Builder | JobMatch AI',
    description:
      'Design multi-page academic, scientific, and executive CVs with dedicated sections for publications, grants, and research.',
  },
};

export default function CvBuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
