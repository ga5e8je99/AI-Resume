'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';
import PrivacySettingsSection from '@/app/components/PrivacySettingsSection';

export default function SettingsPrivacyPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?returnUrl=/settings/privacy');
    }
  }, [user, isLoading, router]);

  return (
    <AppShell
      breadcrumbs={[
        { label: t('dashboard_title'), href: '/dashboard' },
        { label: t('dashboard_tab_settings'), href: '/dashboard?tab=settings' },
        { label: t('privacy_section_title') },
      ]}
      title={t('privacy_section_title')}
      description={t('privacy_section_desc')}
    >
      <div className="max-w-4xl mx-auto w-full">
        <Card className="p-4 sm:p-6">
          <CardBody className="[&>div]:pt-0 [&>div]:border-t-0">
            <PrivacySettingsSection />
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

