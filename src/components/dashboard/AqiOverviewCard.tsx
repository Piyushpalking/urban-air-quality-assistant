import { Clock, Globe, Layers } from 'lucide-react';
import type { AirQualitySnapshot, AqiStandard } from '../../types/airQuality';
import {
  formatLastUpdated,
  formatModelTimestamp,
  getAqiBandsForStandard,
  getAqiMeta,
  getAqiPercentOfScale,
  getStandardLabel,
  getStandardScaleRange,
  getStandardShortLabel,
} from '../../utils/aqiHelpers';

interface AqiOverviewCardProps {
  snapshot: AirQualitySnapshot;
  aqiStandard: AqiStandard;
}

export function AqiOverviewCard({
  snapshot,
  aqiStandard,
}: AqiOverviewCardProps) {
  const activeAqi =
    aqiStandard === 'european' ? snapshot.europeanAqi : snapshot.usAqi;
  const activeCategory =
    aqiStandard === 'european'
      ? snapshot.europeanCategory
      : snapshot.usCategory;

  const secondaryStandard: AqiStandard =
    aqiStandard === 'european' ? 'us' : 'european';
  const secondaryAqi =
    secondaryStandard === 'european' ? snapshot.europeanAqi : snapshot.usAqi;
  const secondaryCategory =
    secondaryStandard === 'european'
      ? snapshot.europeanCategory
      : snapshot.usCategory;

  const meta = getAqiMeta(activeCategory, aqiStandard);
  const secondaryMeta = getAqiMeta(secondaryCategory, secondaryStandard);
  const scaleBands = getAqiBandsForStandard(aqiStandard);
  const scalePercent = getAqiPercentOfScale(activeAqi, aqiStandard);

  const radius = 64;
  const halfCircumference = Math.PI * radius;
  const progressLength = (scalePercent / 100) * halfCircumference;
  const refMaxLabel = aqiStandard === 'european' ? '120 ref' : '300 ref';

  return (
    <section
      aria-labelledby="aqi-overview-heading"
      className="rounded-2xl border border-[#1E2936] bg-[#111720] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Primary Reading & Standard Context */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8B9BB0]">
            <span id="aqi-overview-heading" className="font-medium text-[#CBD5E1]">
              {getStandardLabel(aqiStandard)} Overview
            </span>
            <span aria-hidden="true">·</span>
            <span>Model-based data</span>
            <span aria-hidden="true">·</span>
            <span>Scale {getStandardScaleRange(aqiStandard)}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p
              className="font-mono text-5xl font-semibold tracking-tight text-[#F1F5F9] tabular-nums sm:text-6xl"
              aria-label={
                activeAqi !== null
                  ? `${getStandardLabel(aqiStandard)} ${activeAqi}, category ${meta.label}`
                  : `${getStandardLabel(aqiStandard)} unavailable`
              }
            >
              {activeAqi !== null ? activeAqi : '—'}
            </p>
            <div className="min-w-0">
              <p className={`text-lg font-semibold ${meta.textClass}`}>
                {meta.label}
              </p>
              <p className="text-xs text-[#94A3B8]">
                Band {meta.range} · Dominant pollutant:{' '}
                <span className="font-mono font-medium text-[#E2E8F0]">
                  {snapshot.dominantPollutant ?? 'Unavailable'}
                </span>
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#CBD5E1]">
            {snapshot.advisorySummary}
          </p>

          {/* Model Metadata & Cross-Standard Strip */}
          <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-[#1E2936] pt-4 sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <Layers className="mt-0.5 h-4 w-4 text-[#8B9BB0] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs text-[#8B9BB0]">
                  {getStandardShortLabel(secondaryStandard)} Reference
                </dt>
                <dd className="mt-0.5 font-mono text-xs font-medium text-[#E2E8F0] tabular-nums">
                  {secondaryAqi !== null ? secondaryAqi : 'Unavailable'}{' '}
                  <span className={`font-sans ${secondaryMeta.textClass}`}>
                    ({secondaryMeta.shortLabel})
                  </span>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 text-[#8B9BB0] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs text-[#8B9BB0]">Model Timestamp</dt>
                <dd className="mt-0.5 font-mono text-xs font-medium text-[#E2E8F0] tabular-nums">
                  {formatModelTimestamp(
                    snapshot.modelTimeIso,
                    snapshot.timezoneAbbreviation
                  )}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Globe className="mt-0.5 h-4 w-4 text-[#8B9BB0] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs text-[#8B9BB0]">Data Provenance</dt>
                <dd className="mt-0.5 text-xs font-medium text-[#E2E8F0]">
                  Open-Meteo CAMS / regional model · Synced{' '}
                  <span className="font-mono tabular-nums">
                    {formatLastUpdated(snapshot.fetchedAtIso)}
                  </span>
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Crisp Radial Arc Gauge */}
        <div className="flex flex-col items-center justify-center border-t border-[#1E2936] pt-5 lg:w-56 lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="relative h-[108px] w-[176px]">
            <svg
              viewBox="0 0 160 96"
              className="h-full w-full overflow-visible"
              role="img"
              aria-label={
                activeAqi !== null
                  ? `${getStandardLabel(aqiStandard)} gauge showing ${activeAqi} in the ${meta.label} band`
                  : `${getStandardLabel(aqiStandard)} gauge unavailable`
              }
            >
              <path
                d="M 16 84 A 64 64 0 0 1 144 84"
                fill="none"
                stroke="#1E2936"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {activeAqi !== null ? (
                <path
                  d="M 16 84 A 64 64 0 0 1 144 84"
                  fill="none"
                  stroke={meta.accentHex}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${progressLength} ${halfCircumference}`}
                />
              ) : null}
            </svg>
            <div className="absolute inset-x-0 bottom-1 text-center">
              <p className="font-mono text-xs text-[#8B9BB0] tabular-nums">
                {activeAqi !== null ? `${scalePercent}% of ${refMaxLabel}` : 'No reading'}
              </p>
              <p className={`mt-0.5 text-xs font-semibold ${meta.textClass}`}>
                {meta.shortLabel}
              </p>
            </div>
          </div>
          <p className="mt-2 text-center text-xs leading-relaxed text-[#8B9BB0]">
            {meta.guidance}
          </p>
        </div>
      </div>

      {/* Linear Multi-Band Scale Bar dynamically matching US EPA or European AQI */}
      <div className="mt-6 border-t border-[#1E2936] pt-4">
        <div className="flex items-center justify-between text-xs text-[#8B9BB0]">
          <span>{getStandardLabel(aqiStandard)} Reference Bands</span>
          <span className="font-mono tabular-nums">
            {getStandardScaleRange(aqiStandard)}
          </span>
        </div>
        <div className="mt-2.5 grid grid-cols-6 gap-1.5" aria-hidden="true">
          {scaleBands.map((band) => {
            const isCurrent = band.category === activeCategory;
            return (
              <div key={band.category} className="space-y-1.5">
                <div
                  className={`h-1.5 rounded-full transition-opacity ${band.barClass} ${
                    isCurrent ? 'opacity-100' : 'opacity-30'
                  }`}
                />
                <p
                  className={`truncate text-[11px] font-mono tabular-nums ${
                    isCurrent ? 'font-semibold text-[#F1F5F9]' : 'text-[#8B9BB0]'
                  }`}
                >
                  {band.range}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
