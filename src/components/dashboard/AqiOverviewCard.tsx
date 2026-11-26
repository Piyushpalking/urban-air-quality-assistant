import { Compass, Droplets, Wind } from 'lucide-react';
import type { AirQualitySnapshot } from '../../types/airQuality';
import { EPA_AQI_BANDS, getAqiMeta, getAqiPercentOfScale } from '../../utils/aqiHelpers';

interface AqiOverviewCardProps {
  snapshot: AirQualitySnapshot;
}

export function AqiOverviewCard({ snapshot }: AqiOverviewCardProps) {
  const meta = getAqiMeta(snapshot.category);
  const scalePercent = getAqiPercentOfScale(snapshot.demoAqi);

  // Semicircular SVG arc gauge (radius = 66, circumference = 2 * pi * 66)
  const radius = 64;
  const halfCircumference = Math.PI * radius;
  const progressLength = (scalePercent / 100) * halfCircumference;

  return (
    <section
      aria-labelledby="aqi-overview-heading"
      className="rounded-2xl border border-[#1E2936] bg-[#111720] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Primary Reading & Accessible Category Context */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8B9BB0]">
            <span id="aqi-overview-heading" className="font-medium text-[#CBD5E1]">
              Air Quality Index Overview
            </span>
            <span aria-hidden="true">·</span>
            <span>Demonstration fixture</span>
            <span aria-hidden="true">·</span>
            <span>US EPA 0–500 scale</span>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p
              className="font-mono text-5xl font-semibold tracking-tight text-[#F1F5F9] tabular-nums sm:text-6xl"
              aria-label={`Demonstration AQI ${snapshot.demoAqi}, category ${meta.label}`}
            >
              {snapshot.demoAqi}
            </p>
            <div className="min-w-0">
              <p className={`text-lg font-semibold ${meta.textClass}`}>
                {meta.label}
              </p>
              <p className="text-xs text-[#94A3B8]">
                Band {meta.range} · Dominant pollutant:{' '}
                <span className="font-mono font-medium text-[#E2E8F0]">
                  {snapshot.dominantPollutant}
                </span>
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#CBD5E1]">
            {snapshot.advisorySummary}
          </p>

          {/* Meteorological Context Strip (Unboxed structured metadata) */}
          <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-[#1E2936] pt-4 sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <Wind className="mt-0.5 h-4 w-4 text-[#8B9BB0] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs text-[#8B9BB0]">Surface Wind</dt>
                <dd className="mt-0.5 font-mono text-xs font-medium text-[#E2E8F0] tabular-nums">
                  {snapshot.meteorology.windLabel}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Droplets className="mt-0.5 h-4 w-4 text-[#8B9BB0] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs text-[#8B9BB0]">Relative Humidity</dt>
                <dd className="mt-0.5 font-mono text-xs font-medium text-[#E2E8F0] tabular-nums">
                  {snapshot.meteorology.humidityLabel}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Compass className="mt-0.5 h-4 w-4 text-[#8B9BB0] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs text-[#8B9BB0]">Atmospheric Mixing</dt>
                <dd className="mt-0.5 text-xs font-medium text-[#E2E8F0]">
                  {snapshot.meteorology.dispersionNote}
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
              aria-label={`AQI gauge showing ${snapshot.demoAqi} in the ${meta.label} band`}
            >
              {/* Background Track */}
              <path
                d="M 16 84 A 64 64 0 0 1 144 84"
                fill="none"
                stroke="#1E2936"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Active Arc */}
              <path
                d="M 16 84 A 64 64 0 0 1 144 84"
                fill="none"
                stroke={meta.accentHex}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${progressLength} ${halfCircumference}`}
              />
            </svg>
            <div className="absolute inset-x-0 bottom-1 text-center">
              <p className="font-mono text-xs text-[#8B9BB0] tabular-nums">
                {scalePercent}% of 300 ref
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

      {/* Linear Multi-Band EPA Scale Bar with explicit labels (no hue-only signaling) */}
      <div className="mt-6 border-t border-[#1E2936] pt-4">
        <div className="flex items-center justify-between text-xs text-[#8B9BB0]">
          <span>Reference Scale Bands</span>
          <span className="font-mono tabular-nums">0 — 300+</span>
        </div>
        <div className="mt-2.5 grid grid-cols-6 gap-1.5" aria-hidden="true">
          {EPA_AQI_BANDS.map((band) => {
            const isCurrent = band.category === snapshot.category;
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
