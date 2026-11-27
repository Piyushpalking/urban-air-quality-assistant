import { useEffect, useState } from 'react';
import type {
  AqiStandard,
  DailyForecastSlot,
  HourlyForecastSlot,
} from '../../types/airQuality';
import {
  formatPollutantValue,
  getAqiMeta,
  getStandardShortLabel,
} from '../../utils/aqiHelpers';

interface ForecastSectionProps {
  hourlyForecast: HourlyForecastSlot[];
  dailyForecast: DailyForecastSlot[];
  aqiStandard: AqiStandard;
  timezoneAbbreviation: string;
}

export function ForecastSection({
  hourlyForecast,
  dailyForecast,
  aqiStandard,
  timezoneAbbreviation,
}: ForecastSectionProps) {
  const [mode, setMode] = useState<'hourly' | 'daily'>('hourly');
  const [selectedHourId, setSelectedHourId] = useState<string>(
    hourlyForecast[0]?.id ?? ''
  );

  useEffect(() => {
    if (
      hourlyForecast.length > 0 &&
      !hourlyForecast.some((slot) => slot.id === selectedHourId)
    ) {
      setSelectedHourId(hourlyForecast[0].id);
    }
  }, [hourlyForecast, selectedHourId]);

  const activeHour =
    hourlyForecast.find((slot) => slot.id === selectedHourId) ??
    hourlyForecast[0] ??
    null;

  const standardShort = getStandardShortLabel(aqiStandard);

  const hourlyValues = hourlyForecast
    .map((slot) => (aqiStandard === 'european' ? slot.europeanAqi : slot.usAqi))
    .filter((v): v is number => typeof v === 'number');

  const maxHourlyAqi = Math.max(
    aqiStandard === 'european' ? 80 : 120,
    ...hourlyValues
  );

  const dailyMaxCeiling = Math.max(
    aqiStandard === 'european' ? 100 : 160,
    ...dailyForecast
      .map((day) =>
        aqiStandard === 'european' ? day.europeanMaxAqi : day.usMaxAqi
      )
      .filter((v): v is number => typeof v === 'number')
  );

  return (
    <section
      aria-labelledby="forecast-heading"
      className="rounded-2xl border border-[#1E2936] bg-[#111720] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="forecast-heading"
            className="font-display text-lg font-semibold text-[#F1F5F9]"
          >
            Air Quality Forecast
          </h2>
          <p className="text-xs text-[#8B9BB0]">
            Open-Meteo model forecast · {standardShort} · Local time ({timezoneAbbreviation})
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Forecast timeframe"
          className="inline-flex self-start rounded-xl border border-[#1E2936] bg-[#0D1219] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'hourly'}
            onClick={() => setMode('hourly')}
            className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'hourly'
                ? 'bg-[#1A2634] text-[#F1F5F9]'
                : 'text-[#8B9BB0] hover:text-[#E2E8F0]'
            }`}
          >
            Next 24 Hours
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'daily'}
            onClick={() => setMode('daily')}
            className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'daily'
                ? 'bg-[#1A2634] text-[#F1F5F9]'
                : 'text-[#8B9BB0] hover:text-[#E2E8F0]'
            }`}
          >
            5-Day Outlook
          </button>
        </div>
      </div>

      {mode === 'hourly' ? (
        hourlyForecast.length === 0 ? (
          <div className="mt-5 rounded-xl border border-[#1E2936] bg-[#0D1219] p-6 text-center text-sm text-[#94A3B8]">
            Hourly forecast values are currently unavailable from Open-Meteo for this location.
          </div>
        ) : (
          <div className="mt-5">
            {/* Horizontal touch-scrollable 24-hour forecast strip */}
            <div
              role="listbox"
              aria-label="Next 24 hours forecast"
              className="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
            >
              {hourlyForecast.map((slot) => {
                const aqi =
                  aqiStandard === 'european' ? slot.europeanAqi : slot.usAqi;
                const category =
                  aqiStandard === 'european'
                    ? slot.europeanCategory
                    : slot.usCategory;
                const meta = getAqiMeta(category, aqiStandard);
                const isSelected = activeHour?.id === slot.id;
                const barHeight =
                  aqi !== null
                    ? Math.max(16, Math.round((aqi / maxHourlyAqi) * 100))
                    : 8;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => setSelectedHourId(slot.id)}
                    className={`flex min-h-[152px] w-[62px] shrink-0 flex-col items-center justify-end rounded-xl border px-1.5 py-3 transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-[#2DD4BF] bg-[#15222E]'
                        : 'border-[#1E2936] bg-[#0D1219] hover:border-[#2E3F54]'
                    }`}
                  >
                    <span className="font-mono text-xs font-semibold text-[#F1F5F9] tabular-nums">
                      {aqi !== null ? aqi : '—'}
                    </span>
                    <div className="my-2.5 flex h-20 w-full items-end justify-center">
                      <div
                        className={`w-4 rounded-t-md ${meta.barClass} ${
                          aqi === null
                            ? 'opacity-30'
                            : isSelected
                              ? 'opacity-100'
                              : 'opacity-70'
                        }`}
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] font-medium text-[#CBD5E1] tabular-nums whitespace-nowrap">
                      {slot.timeLabel}
                    </span>
                    <span className="mt-0.5 text-[10px] text-[#8B9BB0] truncate max-w-full">
                      {slot.dominantPollutant ?? '—'}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeHour ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-[#1E2936] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-[#CBD5E1]">
                    {activeHour.dateLabel} · {activeHour.timeLabel}{' '}
                    {timezoneAbbreviation} ·{' '}
                    <span
                      className={
                        getAqiMeta(
                          aqiStandard === 'european'
                            ? activeHour.europeanCategory
                            : activeHour.usCategory,
                          aqiStandard
                        ).textClass
                      }
                    >
                      {
                        getAqiMeta(
                          aqiStandard === 'european'
                            ? activeHour.europeanCategory
                            : activeHour.usCategory,
                          aqiStandard
                        ).label
                      }
                    </span>
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-[#94A3B8] tabular-nums">
                    US AQI: {activeHour.usAqi ?? '—'} · EU AQI:{' '}
                    {activeHour.europeanAqi ?? '—'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[#94A3B8] tabular-nums">
                  <span>PM2.5: {formatPollutantValue(activeHour.pm25)} µg/m³</span>
                  <span aria-hidden="true">·</span>
                  <span>NO₂: {formatPollutantValue(activeHour.no2)} µg/m³</span>
                  <span aria-hidden="true">·</span>
                  <span>O₃: {formatPollutantValue(activeHour.o3)} µg/m³</span>
                </div>
              </div>
            ) : null}
          </div>
        )
      ) : dailyForecast.length === 0 ? (
        <div className="mt-5 rounded-xl border border-[#1E2936] bg-[#0D1219] p-6 text-center text-sm text-[#94A3B8]">
          5-day forecast data is currently unavailable from Open-Meteo for this location.
        </div>
      ) : (
        <div className="mt-5 divide-y divide-[#1E2936]">
          {dailyForecast.map((day) => {
            const minAqi =
              aqiStandard === 'european' ? day.europeanMinAqi : day.usMinAqi;
            const maxAqi =
              aqiStandard === 'european' ? day.europeanMaxAqi : day.usMaxAqi;
            const category =
              aqiStandard === 'european'
                ? day.europeanCategory
                : day.usCategory;
            const meta = getAqiMeta(category, aqiStandard);

            const hasRange = minAqi !== null && maxAqi !== null;
            const leftPct = hasRange
              ? Math.min(80, Math.round((minAqi / dailyMaxCeiling) * 100))
              : 0;
            const widthPct = hasRange
              ? Math.max(
                  10,
                  Math.min(
                    100 - leftPct,
                    Math.round(((maxAqi - minAqi) / dailyMaxCeiling) * 100)
                  )
                )
              : 0;

            return (
              <div
                key={day.id}
                className="flex flex-col gap-2.5 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5"
              >
                <div className="min-w-0 sm:w-40 sm:shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#F1F5F9]">
                      {day.dayLabel}
                    </span>
                    <span className="text-xs text-[#8B9BB0]">{day.dateLabel}</span>
                  </div>
                  <p className={`mt-0.5 text-xs font-medium ${meta.textClass}`}>
                    {meta.shortLabel}
                    {day.dominantPollutant ? ` · ${day.dominantPollutant}` : ''}
                  </p>
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 font-mono text-xs text-[#8B9BB0] tabular-nums">
                      {minAqi !== null ? minAqi : '—'}
                    </span>
                    <div className="relative h-1.5 flex-1 rounded-full bg-[#1E2936]">
                      {hasRange ? (
                        <div
                          className={`absolute top-0 h-full rounded-full ${meta.barClass}`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        />
                      ) : null}
                    </div>
                    <span className="w-8 text-right font-mono text-xs font-semibold text-[#F1F5F9] tabular-nums">
                      {maxAqi !== null ? maxAqi : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8]">{day.summary}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
