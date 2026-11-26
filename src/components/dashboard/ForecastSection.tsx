import { useState } from 'react';
import type {
  DailyForecastSlot,
  HourlyForecastSlot,
} from '../../types/airQuality';
import { getAqiMeta } from '../../utils/aqiHelpers';

interface ForecastSectionProps {
  hourlyForecast: HourlyForecastSlot[];
  dailyForecast: DailyForecastSlot[];
}

export function ForecastSection({
  hourlyForecast,
  dailyForecast,
}: ForecastSectionProps) {
  const [mode, setMode] = useState<'hourly' | 'daily'>('hourly');
  const [selectedHourId, setSelectedHourId] = useState<string>(
    hourlyForecast[0]?.id ?? 'h-01'
  );

  const activeHour =
    hourlyForecast.find((slot) => slot.id === selectedHourId) ??
    hourlyForecast[0];

  const maxHourlyAqi = Math.max(
    120,
    ...hourlyForecast.map((slot) => slot.demoAqi)
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
            Demonstration trajectory · Ready for hourly model feeds
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
            24-Hour Outlook
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
        <div className="mt-5">
          {/* Touch-scrollable horizontal bar chart for Android & desktop */}
          <div
            role="listbox"
            aria-label="Hourly sample forecast slots"
            className="grid grid-cols-6 gap-2 overflow-x-auto pb-2 no-scrollbar min-w-[340px]"
          >
            {hourlyForecast.map((slot) => {
              const meta = getAqiMeta(slot.category);
              const isSelected = activeHour?.id === slot.id;
              const barHeight = Math.max(
                22,
                Math.round((slot.demoAqi / maxHourlyAqi) * 100)
              );

              return (
                <button
                  key={slot.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => setSelectedHourId(slot.id)}
                  className={`flex min-h-[152px] flex-col items-center justify-end rounded-xl border px-2 py-3 transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-[#2DD4BF] bg-[#15222E]'
                      : 'border-[#1E2936] bg-[#0D1219] hover:border-[#2E3F54]'
                  }`}
                >
                  <span className="font-mono text-xs font-semibold text-[#F1F5F9] tabular-nums">
                    {slot.demoAqi}
                  </span>
                  <div className="my-2.5 flex h-20 w-full items-end justify-center">
                    <div
                      className={`w-5 rounded-t-md ${meta.barClass} ${
                        isSelected ? 'opacity-100' : 'opacity-70'
                      }`}
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] font-medium text-[#CBD5E1] tabular-nums whitespace-nowrap">
                    {slot.timeLabel}
                  </span>
                  <span className="mt-0.5 text-[10px] text-[#8B9BB0] truncate max-w-full">
                    {slot.dominantPollutant}
                  </span>
                </button>
              );
            })}
          </div>

          {activeHour ? (
            <div className="mt-4 flex flex-col gap-2 border-t border-[#1E2936] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-[#CBD5E1]">
                  {activeHour.periodLabel} ({activeHour.timeLabel}) ·{' '}
                  <span className={getAqiMeta(activeHour.category).textClass}>
                    {getAqiMeta(activeHour.category).label}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-[#94A3B8]">
                  {activeHour.windDispersion}
                </p>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs text-[#94A3B8] tabular-nums">
                <span>Dominant: {activeHour.dominantPollutant}</span>
                <span aria-hidden="true">·</span>
                <span>Humidity: {activeHour.humidityPercent}%</span>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 divide-y divide-[#1E2936]">
          {dailyForecast.map((day) => {
            const meta = getAqiMeta(day.category);
            const leftPct = Math.min(75, Math.round((day.demoMinAqi / 160) * 100));
            const widthPct = Math.max(
              14,
              Math.min(100 - leftPct, Math.round(((day.demoMaxAqi - day.demoMinAqi) / 160) * 100))
            );

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
                    {meta.shortLabel} · {day.dominantPollutant}
                  </p>
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="w-7 font-mono text-xs text-[#8B9BB0] tabular-nums">
                      {day.demoMinAqi}
                    </span>
                    <div className="relative h-1.5 flex-1 rounded-full bg-[#1E2936]">
                      <div
                        className={`absolute top-0 h-full rounded-full ${meta.barClass}`}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-xs font-semibold text-[#F1F5F9] tabular-nums">
                      {day.demoMaxAqi}
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
