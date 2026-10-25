import { redirect } from 'next/navigation';

export const metadata = {
  title: 'JobMatch AI | Sign In',
  description: 'Sign in to your account to manage your resumes and ATS diagnostics',
};

export default function AuthPage() {
  redirect('/login');
}