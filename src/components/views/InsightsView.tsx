import { useMemo, useState } from 'react';
import type {
  AirQualitySnapshot,
  AqiStandard,
  InsightCategory,
} from '../../types/airQuality';
import {
  formatModelTimestamp,
  getAqiBandsForStandard,
  getStandardLabel,
} from '../../utils/aqiHelpers';
import { buildDataDrivenInsights } from '../../utils/insightsGenerator';

interface InsightsViewProps {
  snapshot: AirQualitySnapshot;
  aqiStandard: AqiStandard;
}

const FILTER_OPTIONS: Array<{ id: InsightCategory; label: string }> = [
  { id: 'all', label: 'All Topics' },
  { id: 'health', label: 'Health & Exposure' },
  { id: 'drivers', label: 'Pollutant Drivers' },
  { id: 'planning', label: 'Planning' },
];

export function InsightsView({ snapshot, aqiStandard }: InsightsViewProps) {
  const [filter, setFilter] = useState<InsightCategory>('all');

  const computedInsights = useMemo(
    () => buildDataDrivenInsights(snapshot, aqiStandard),
    [snapshot, aqiStandard]
  );

  const visibleInsights =
    filter === 'all'
      ? computedInsights
      : computedInsights.filter((item) => item.category === filter);

  const scaleBands = getAqiBandsForStandard(aqiStandard);

  return (
    <div className="space-y-8">
      {/* Category Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
            Live Model Insights · {snapshot.location.name}
          </h2>
          <p className="text-xs text-[#8B9BB0]">
            Computed directly from Open-Meteo readings ({formatModelTimestamp(snapshot.modelTimeIso, snapshot.timezoneAbbreviation)}) · {getStandardLabel(aqiStandard)}
          </p>
        </div>

        <div
          role="group"
          aria-label="Filter insights by topic"
          className="inline-flex self-start overflow-x-auto no-scrollbar rounded-xl border border-[#1E2936] bg-[#0D1219] p-1"
        >
          {FILTER_OPTIONS.map((option) => {
            const selected = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                aria-pressed={selected}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  selected
                    ? 'bg-[#1A2634] text-[#F1F5F9]'
                    : 'text-[#8B9BB0] hover:text-[#E2E8F0]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data-Driven Insight Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visibleInsights.map((insight) => (
          <article
            key={insight.id}
            className="flex flex-col justify-between rounded-2xl border border-[#1E2936] bg-[#111720] p-5 sm:p-6"
          >
            <div>
              <div className="flex items-center gap-2 text-xs text-[#8B9BB0]">
                <span className="font-medium text-[#2DD4BF]">
                  {insight.categoryLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>Open-Meteo model</span>
              </div>

              <h3 className="mt-2 font-display text-base font-semibold leading-snug text-[#F1F5F9]">
                {insight.title}
              </h3>

              <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8]">
                {insight.summary}
              </p>
            </div>

            <div className="mt-5 space-y-3 border-t border-[#1E2936] pt-4">
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="text-[#8B9BB0]">{insight.referenceLabel}</span>
                <span className="font-mono font-medium text-[#E2E8F0] tabular-nums text-right">
                  {insight.referenceValue}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[#CBD5E1]">
                {insight.actionGuidance}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* Active AQI Standard Reference Table (US EPA or European AQI) */}
      <section
        aria-labelledby="aqi-reference-heading"
        className="rounded-2xl border border-[#1E2936] bg-[#111720] p-5 sm:p-6"
      >
        <div>
          <h2
            id="aqi-reference-heading"
            className="font-display text-base font-semibold text-[#F1F5F9]"
          >
            {getStandardLabel(aqiStandard)} Reference Scale
          </h2>
          <p className="mt-0.5 text-xs text-[#8B9BB0]">
            Standard health categories pairing numeric bands with explicit text labels · Toggle US AQI / EU AQI above to compare scales
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#1E2936] text-xs font-medium text-[#8B9BB0]">
                <th scope="col" className="pb-3 pr-4">Category</th>
                <th scope="col" className="pb-3 pr-4">Index Range</th>
                <th scope="col" className="pb-3">General Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2936]">
              {scaleBands.map((band) => (
                <tr key={band.category}>
                  <td className="py-3.5 pr-4 font-semibold whitespace-nowrap">
                    <span className={band.textClass}>{band.label}</span>
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-xs text-[#E2E8F0] tabular-nums whitespace-nowrap">
                    {band.range}
                  </td>
                  <td className="py-3.5 text-xs leading-relaxed text-[#94A3B8]">
                    {band.guidance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
