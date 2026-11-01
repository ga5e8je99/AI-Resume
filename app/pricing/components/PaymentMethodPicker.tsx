'use client';

import React from 'react';
import { CurrencyCode } from '@/lib/plans';
import { useLanguage } from '@/app/context/LanguageContext';
import { SegmentedControl } from '@/app/components/ui/SegmentedControl';

export interface PaymentMethodPickerProps {
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  disabled?: boolean;
  enabledCurrencies?: CurrencyCode[];
}

export function PaymentMethodPicker({
  value,
  onChange,
  disabled = false,
  enabledCurrencies,
}: PaymentMethodPickerProps) {
  const { t } = useLanguage();

  const allOptions: { value: CurrencyCode; label: string; disabled: boolean }[] = [
    {
      value: 'USD',
      label: t('pricing_curr_usd'),
      disabled,
    },
    {
      value: 'EGP',
      label: t('pricing_curr_egp'),
      disabled,
    },
  ];

  const visibleOptions =
    enabledCurrencies && enabledCurrencies.length > 0
      ? allOptions.filter((opt) => enabledCurrencies.includes(opt.value))
      : allOptions;

  if (visibleOptions.length === 0) {
    return null;
  }

  const hintText =
    value === 'EGP'
      ? t('pricing_method_egp_hint')
      : t('pricing_method_usd_hint');

  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <SegmentedControl
        size="sm"
        value={value}
        onChange={(val) => onChange(val as CurrencyCode)}
        ariaLabel={t('pricing_method_label')}
        options={visibleOptions}
      />
      <span className="text-[11px] font-mono text-ink-3">{hintText}</span>
    </div>
  );
}

export default PaymentMethodPicker;
