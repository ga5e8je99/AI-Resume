'use client';

import React from 'react';
import { BillingCycle } from '@/lib/plans';
import { useLanguage } from '@/app/context/LanguageContext';
import { SegmentedControl } from '@/app/components/ui/SegmentedControl';

export interface BillingToggleProps {
  value: BillingCycle;
  onChange: (value: BillingCycle) => void;
  disabled?: boolean;
}

export function BillingToggle({ value, onChange, disabled = false }: BillingToggleProps) {
  const { t } = useLanguage();

  return (
    <SegmentedControl
      size="sm"
      value={value}
      onChange={(val) => onChange(val as BillingCycle)}
      ariaLabel={t('pricing_period_monthly')}
      options={[
        {
          value: 'monthly',
          label: t('pricing_period_monthly'),
          disabled,
        },
        {
          value: 'annual',
          label: t('pricing_period_yearly'),
          badge: t('pricing_save_22_badge'),
          disabled,
        },
      ]}
    />
  );
}

export default BillingToggle;

