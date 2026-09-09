import { useTranslation } from 'react-i18next';
import { BestValueBadge } from '../BestValueBadge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '../../../api/subscription';
import { getErrorMessage } from '../../../utils/subscriptionHelpers';
import InsufficientBalancePrompt from '../../InsufficientBalancePrompt';
import { ChevronRightIcon } from '../../icons';
import type { LteTrafficInfo, PurchaseOptions, Subscription } from '../../../types';

// ──────────────────────────────────────────────────────────────────
// Sheesh LTE/WL traffic top-up sheet. Mirrors TrafficTopupSheet but uses
// the LTE traffic package endpoints (separate x1.7-billed quota). Self-owns
// the LTE package query + purchase mutation; parent passes the selected-gb
// state + currentLteTraffic (for the collapsed used/limit summary).
// ──────────────────────────────────────────────────────────────────

export interface LteTrafficTopupSheetProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  subscription: Subscription;
  subscriptionId: number | undefined;
  currentLteTraffic: LteTrafficInfo;
  selectedLteTrafficGb: number | null;
  onSelectedLteTrafficGbChange: (gb: number | null) => void;
  purchaseOptions: PurchaseOptions | undefined;
  isDark: boolean;
}

export function LteTrafficTopupSheet({
  open,
  onOpen,
  onClose,
  subscription,
  subscriptionId,
  currentLteTraffic,
  selectedLteTrafficGb,
  onSelectedLteTrafficGbChange,
  purchaseOptions,
  isDark,
}: LteTrafficTopupSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const formatPrice = (kopeks: number) => {
    const rubles = kopeks / 100;
    return rubles % 1 === 0 ? `${rubles} ₽` : `${rubles.toFixed(2)} ₽`;
  };

  const { data: lteTrafficPackage } = useQuery({
    queryKey: ['lte-traffic-package', subscriptionId],
    queryFn: () => subscriptionApi.getLteTrafficPackage(subscriptionId),
    enabled: open && !!subscription,
  });

  const purchaseMutation = useMutation({
    mutationFn: (gb: number) => subscriptionApi.purchaseLteTraffic(gb, subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['lte-traffic-package', subscriptionId] });
      onClose();
      onSelectedLteTrafficGbChange(null);
    },
  });

  const packages = lteTrafficPackage?.packages ?? currentLteTraffic.available_packages ?? [];

  if (!open) {
    return (
      <button
        onClick={onOpen}
        className={`w-full rounded-xl border p-4 text-left transition-colors ${isDark ? 'border-dark-700/50 bg-dark-800/50 hover:border-dark-600' : 'border-champagne-300/60 bg-champagne-200/40 hover:border-champagne-400'}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-dark-100">
              {t('subscription.additionalOptions.buyLteTrafficShort')}
            </div>
            <div className="mt-1 text-sm text-dark-400">
              LTE: {currentLteTraffic.traffic_used_gb.toFixed(1)} /{' '}
              {currentLteTraffic.traffic_limit_gb} {t('common.units.gb')}
            </div>
          </div>
          <ChevronRightIcon className="text-dark-400" />
        </div>
      </button>
    );
  }

  return (
    <div
      className={`rounded-xl border p-5 ${isDark ? 'border-dark-700/50 bg-dark-800/50' : 'border-champagne-300/60 bg-champagne-200/40'}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-dark-100">
          {t('subscription.additionalOptions.buyLteTrafficTitle')}
        </h3>
        <button
          onClick={() => {
            onClose();
            onSelectedLteTrafficGbChange(null);
          }}
          className="text-sm text-dark-400 hover:text-dark-200"
          aria-label={t('common.close', 'Close')}
        >
          ✕
        </button>
      </div>

      <div
        className={`mb-4 rounded-lg p-2 text-xs ${isDark ? 'bg-dark-700/30 text-dark-500' : 'bg-champagne-300/40 text-champagne-600'}`}
      >
        ⚠️ {t('subscription.additionalOptions.lteTrafficWarning')}
      </div>

      {packages.length === 0 ? (
        <div className="py-4 text-center text-sm text-dark-400">
          {t('subscription.additionalOptions.trafficUnavailable')}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {packages.map((pkg, i) => {
              // Цена за гигабайт в сетке строго убывает (5.80 -> 2.20), поэтому
              // самый большой ДОСТУПНЫЙ пакет всегда и самый выгодный. Список
              // режется потолком под тариф, значит вычислять нечего — метка
              // всегда на последнем. Ставим только когда есть с чем сравнить.
              const isBest = packages.length > 1 && i === packages.length - 1;
              return (
              <button
                key={pkg.gb}
                onClick={() => onSelectedLteTrafficGbChange(pkg.gb)}
                className={`relative rounded-xl border p-4 text-center transition-all ${
                  selectedLteTrafficGb === pkg.gb
                    ? 'border-accent-500 bg-accent-500/10'
                    : isBest
                      ? 'border-urgent-400'
                      : isDark
                        ? 'border-dark-700/50 bg-dark-800/50 hover:border-dark-600'
                        : 'border-champagne-300/60 bg-champagne-200/40 hover:border-champagne-400'
                }`}
              >
                {isBest && <BestValueBadge className="absolute -top-2 left-1/2 -translate-x-1/2" />}
                <div className="text-lg font-semibold text-dark-100">
                  {pkg.gb} {t('common.units.gb')}
                </div>
                <div className="font-medium text-accent-400">{formatPrice(pkg.price_kopeks)}</div>
              </button>
              );
            })}
          </div>

          {selectedLteTrafficGb !== null &&
            (() => {
              const selectedPkg = packages.find((p) => p.gb === selectedLteTrafficGb);
              const hasEnoughBalance =
                !selectedPkg ||
                !purchaseOptions ||
                selectedPkg.price_kopeks <= purchaseOptions.balance_kopeks;
              const missingAmount =
                selectedPkg && purchaseOptions
                  ? selectedPkg.price_kopeks - purchaseOptions.balance_kopeks
                  : 0;

              return (
                <>
                  {!hasEnoughBalance && missingAmount > 0 && (
                    <InsufficientBalancePrompt
                      missingAmountKopeks={missingAmount}
                      compact
                      className="mb-3"
                      onBeforeTopUp={async () => {
                        await subscriptionApi.saveLteTrafficCart(selectedLteTrafficGb, subscriptionId);
                      }}
                    />
                  )}
                  <button
                    onClick={() => purchaseMutation.mutate(selectedLteTrafficGb)}
                    disabled={purchaseMutation.isPending || !hasEnoughBalance}
                    className="btn-primary w-full py-3"
                  >
                    {purchaseMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      </span>
                    ) : (
                      t('subscription.additionalOptions.buyLteTrafficGb', {
                        gb: selectedLteTrafficGb,
                      })
                    )}
                  </button>
                </>
              );
            })()}

          {purchaseMutation.isError && (
            <div className="text-center text-sm text-error-400">
              {getErrorMessage(purchaseMutation.error)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
