import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserSubscriptionInfo } from '@/api/adminUsers';
import { formatPrice } from '@/utils/format';

// Пакеты LTE — наша надстройка над апстримом. Апстрим переписал вкладку
// «Подписка» на карточки, поэтому блок живёт своей карточкой, а не внутри
// общего списка действий: так следующий мерж его не размажет по чужому файлу.

export interface LteTrafficCardProps {
  sub: UserSubscriptionInfo;
  busy: boolean;
  canManage: boolean;
  onAdd: (gb: number, chargeBalance: boolean) => Promise<boolean>;
  onRemove: (purchaseId: number) => Promise<boolean>;
}

export function LteTrafficCard({ sub, busy, canManage, onAdd, onRemove }: LteTrafficCardProps) {
  const { t } = useTranslation();
  const [selectedGb, setSelectedGb] = useState('');
  const [chargeBalance, setChargeBalance] = useState(false);
  const [confirming, setConfirming] = useState<number | null>(null);

  const lte = sub.lte_traffic;
  if (!lte) return null;

  const purchases = sub.lte_traffic_purchases ?? [];
  const packages = lte.available_packages ?? [];

  return (
    <div className="rounded-xl bg-dark-800/50 p-4" data-role="admin-lte-packages">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-dark-200">
          {t('admin.users.detail.subscription.lteTrafficPackages')}
        </span>
        <span className="text-xs text-dark-400">
          {lte.traffic_used_gb.toFixed(1)} / {lte.traffic_limit_gb.toFixed(0)}{' '}
          {t('common.units.gb')}
        </span>
      </div>

      {purchases.length > 0 && (
        <div className="mb-3 space-y-2">
          {purchases.map((tp) => (
            <div
              key={tp.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                tp.is_expired ? 'bg-dark-700/30 opacity-60' : 'bg-dark-700/50'
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-dark-200">
                <span className="font-medium">
                  {tp.traffic_gb} {t('common.units.gb')}
                </span>
                <span className="text-xs text-dark-400">
                  {tp.is_expired
                    ? t('admin.users.detail.subscription.expired')
                    : `${tp.days_remaining} ${t('admin.users.detail.subscription.daysLeft')}`}
                </span>
                <span className="text-xs text-dark-500">
                  {tp.source === 'admin'
                    ? t('admin.users.detail.subscription.sourceAdmin')
                    : t('admin.users.detail.subscription.sourceUser')}
                </span>
              </div>
              {canManage && !tp.is_expired && (
                <button
                  onClick={() => {
                    // Удаление пакета — деньги: первый клик спрашивает, второй делает.
                    if (confirming === tp.id) {
                      setConfirming(null);
                      void onRemove(tp.id);
                    } else {
                      setConfirming(tp.id);
                    }
                  }}
                  disabled={busy}
                  className={`ml-2 shrink-0 rounded-lg px-2 py-1 text-xs transition-all disabled:opacity-50 ${
                    confirming === tp.id
                      ? 'bg-error-500 text-white'
                      : 'text-dark-500 hover:bg-error-500/15 hover:text-error-400'
                  }`}
                >
                  {confirming === tp.id ? '?' : '×'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && packages.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              value={selectedGb}
              onChange={(e) => setSelectedGb(e.target.value)}
              className="input min-w-0 flex-1"
            >
              <option value="">{t('admin.users.detail.subscription.selectLtePackage')}</option>
              {packages.map((pkg) => (
                <option key={pkg.gb} value={pkg.gb}>
                  {pkg.gb} {t('common.units.gb')} / {formatPrice(pkg.price_kopeks)}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!selectedGb) return;
                void onAdd(Number(selectedGb), chargeBalance).then((ok) => {
                  if (ok) setSelectedGb('');
                });
              }}
              disabled={busy || !selectedGb}
              className="shrink-0 rounded-lg bg-accent-500 px-4 py-2 text-sm text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
            >
              {t('admin.users.detail.subscription.addButton')}
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-dark-400">
            <input
              type="checkbox"
              checked={chargeBalance}
              onChange={(e) => setChargeBalance(e.target.checked)}
            />
            {t('admin.users.detail.subscription.chargeUserBalance')}
          </label>
          <div className="text-xs text-dark-500">
            {t('admin.users.detail.subscription.lteTrafficNote')}
          </div>
        </div>
      )}
    </div>
  );
}
