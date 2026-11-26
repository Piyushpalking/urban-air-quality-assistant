import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import type { PollutantMetric } from '../../types/airQuality';
import { getAqiMeta } from '../../utils/aqiHelpers';

interface PollutantGridProps {
  pollutants: PollutantMetric[];
}

export function PollutantGrid({ pollutants }: PollutantGridProps) {
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
            Demonstration concentrations compared against WHO 24-hour / 8-hour reference guidelines · Select any pollutant for details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pollutants.map((pollutant) => {
          const meta = getAqiMeta(pollutant.category);
          const ratio = Math.min(
            100,
            Math.round((pollutant.demoValue / (pollutant.guidelineLimit * 2)) * 100)
          );
          const isSelected = selectedId === pollutant.id;

          return (
            <button
              key={pollutant.id}
              type="button"
              onClick={() =>
                setSelectedId((prev) => (prev === pollutant.id ? null : pollutant.id))
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
                <span className="font-mono text-2xl font-semibold text-[#F1F5F9] tabular-nums">
                  {pollutant.demoValue}
                </span>
                <span className="font-mono text-xs text-[#8B9BB0]">
                  {pollutant.unit}
                </span>
              </div>

              <div className="mt-3.5 space-y-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1E2936]">
                  <div
                    className={`h-full rounded-full ${meta.barClass}`}
                    style={{ width: `${Math.max(8, ratio)}%` }}
                  />
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

      {/* Inline Detail Drawer for Selected Pollutant (Single Elevation, Zero Nested Cards) */}
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
                <span>Sample fixture</span>
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
              <p className="text-xs font-medium text-[#CBD5E1]">Health & Exposure Context</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#94A3B8]">
                {selectedPollutant.healthContext}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#CBD5E1]">Common Urban Sources</p>
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
