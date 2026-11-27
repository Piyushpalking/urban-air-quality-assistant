import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import type { PollutantMetric } from '../../types/airQuality';
import { formatPollutantValue, getAqiMeta } from '../../utils/aqiHelpers';

interface PollutantGridProps {
  pollutants: PollutantMetric[];
  missingCount: number;
}

export function PollutantGrid({
  pollutants,
  missingCount,
}: PollutantGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedPollutant =
    pollutants.find((item) => item.id === selectedId) ?? null;

  return (
    <section aria-labelledby="pollutants-heading" className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="pollutants-heading"
            className="font-display text-lg font-semibold text-[#F1F5F9]"
          >
            Primary Pollutants
          </h2>
          <p className="text-xs text-[#8B9BB0]">
            Open-Meteo model concentrations compared against WHO reference guidelines · Select any pollutant for details
            {missingCount > 0
              ? ` · ${missingCount} unavailable`
              : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pollutants.map((pollutant) => {
          const meta = getAqiMeta(pollutant.category, 'us');
          const hasValue = pollutant.value !== null;
          const ratio = hasValue
            ? Math.min(
                100,
                Math.round(
                  ((pollutant.value as number) / (pollutant.guidelineLimit * 2)) *
                    100
                )
              )
            : 0;
          const isSelected = selectedId === pollutant.id;

          return (
            <button
              key={pollutant.id}
              type="button"
              onClick={() =>
                setSelectedId((prev) =>
                  prev === pollutant.id ? null : pollutant.id
                )
              }
              aria-expanded={isSelected}
              className={`group flex flex-col justify-between rounded-2xl border p-5 text-left transition-colors duration-150 cursor-pointer ${
                isSelected
                  ? 'border-[#2DD4BF] bg-[#141E2A]'
                  : 'border-[#1E2936] bg-[#111720] hover:border-[#2E3F54]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-semibold text-[#F1F5F9]">
                      {pollutant.symbol}
                    </span>
                    <span className="text-xs text-[#64748B]" aria-hidden="true">
                      ·
                    </span>
                    <span className={`text-xs font-medium ${meta.textClass}`}>
                      {meta.shortLabel}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#8B9BB0]">
                    {pollutant.name}
                  </p>
                </div>
                <ChevronRight
                  className={`mt-0.5 h-4 w-4 shrink-0 text-[#64748B] transition-transform duration-150 group-hover:text-[#CBD5E1] ${
                    isSelected ? 'rotate-90 text-[#2DD4BF]' : ''
                  }`}
                  aria-hidden="true"
                />
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span
                  className={`font-mono text-2xl font-semibold tabular-nums ${
                    hasValue ? 'text-[#F1F5F9]' : 'text-[#64748B]'
                  }`}
                >
                  {hasValue ? formatPollutantValue(pollutant.value) : 'Unavailable'}
                </span>
                {hasValue ? (
                  <span className="font-mono text-xs text-[#8B9BB0]">
                    {pollutant.unit}
                  </span>
                ) : null}
              </div>

              <div className="mt-3.5 space-y-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1E2936]">
                  {hasValue ? (
                    <div
                      className={`h-full rounded-full ${meta.barClass}`}
                      style={{ width: `${Math.max(6, ratio)}%` }}
                    />
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#8B9BB0]">
                  <span className="truncate">{pollutant.shortNote}</span>
                  <span className="font-mono text-[11px] tabular-nums shrink-0">
                    Ref {pollutant.guidelineLimit}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedPollutant ? (
        <div
          role="region"
          aria-label={`${selectedPollutant.name} details`}
          className="rounded-2xl border border-[#253344] bg-[#0D1219] p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8B9BB0]">
                <span className="font-mono font-semibold text-[#2DD4BF]">
                  {selectedPollutant.symbol}
                </span>
                <span aria-hidden="true">·</span>
                <span>{selectedPollutant.guidelineLabel}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {selectedPollutant.value !== null
                    ? `Current model value: ${formatPollutantValue(selectedPollutant.value)} ${selectedPollutant.unit}`
                    : 'Current value unavailable from API'}
                </span>
              </div>
              <h3 className="mt-1 font-display text-base font-semibold text-[#F1F5F9]">
                {selectedPollutant.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label={`Close ${selectedPollutant.name} details`}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[#94A3B8] hover:bg-[#1A2634] hover:text-white shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-5 border-t border-[#1E2936] pt-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-[#CBD5E1]">
                Health &amp; Exposure Context
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#94A3B8]">
                {selectedPollutant.healthContext}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#CBD5E1]">
                Common Urban Sources
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#94A3B8]">
                {selectedPollutant.primarySources}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
