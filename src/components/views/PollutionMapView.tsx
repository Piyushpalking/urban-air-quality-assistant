import { useState } from 'react';
import { ArrowRight, Layers, MapPin } from 'lucide-react';
import { DEMO_BASEMAP_URL } from '../../data/demonstrationData';
import type { MapLayerId, MonitoringZone } from '../../types/airQuality';
import { getAqiMeta } from '../../utils/aqiHelpers';

interface PollutionMapViewProps {
  zones: MonitoringZone[];
  activeZoneId: string;
  onSelectZone: (zoneId: string) => void;
  onInspectZoneOnDashboard: (zoneId: string) => void;
}

const LAYER_OPTIONS: Array<{
  id: MapLayerId;
  label: string;
  unit: string;
}> = [
  { id: 'aqi', label: 'AQI Composite', unit: 'AQI' },
  { id: 'pm25', label: 'PM2.5', unit: 'µg/m³' },
  { id: 'no2', label: 'NO₂', unit: 'µg/m³' },
  { id: 'o3', label: 'O₃', unit: 'µg/m³' },
];

function getLayerValue(zone: MonitoringZone, layer: MapLayerId): string {
  switch (layer) {
    case 'pm25':
      return zone.demoPm25.toFixed(1);
    case 'no2':
      return zone.demoNo2.toFixed(1);
    case 'o3':
      return zone.demoO3.toFixed(1);
    case 'aqi':
    default:
      return String(zone.demoAqi);
  }
}

export function PollutionMapView({
  zones,
  activeZoneId,
  onSelectZone,
  onInspectZoneOnDashboard,
}: PollutionMapViewProps) {
  const [layer, setLayer] = useState<MapLayerId>('aqi');
  const [basemapFailed, setBasemapFailed] = useState(false);

  const selectedZone =
    zones.find((zone) => zone.id === activeZoneId) ?? zones[0];
  const selectedMeta = getAqiMeta(selectedZone.category);
  const currentLayerOption =
    LAYER_OPTIONS.find((item) => item.id === layer) ?? LAYER_OPTIONS[0];

  return (
    <div className="space-y-6">
      {/* Layer Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-[#8B9BB0]">
          <Layers className="h-4 w-4 text-[#2DD4BF] shrink-0" aria-hidden="true" />
          <span>Demonstration spatial layout · Static urban basemap awaiting live map tiles &amp; sensor feeds</span>
        </div>

        <div
          role="group"
          aria-label="Pollutant map layer"
          className="inline-flex self-start overflow-x-auto no-scrollbar rounded-xl border border-[#1E2936] bg-[#0D1219] p-1"
        >
          {LAYER_OPTIONS.map((option) => {
            const isSelected = layer === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setLayer(option.id)}
                aria-pressed={isSelected}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
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

      {/* Map Canvas + Selected Station Inspector */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Interactive Basemap Surface */}
        <section
          aria-label="Urban air quality demonstration map"
          className="lg:col-span-8 flex flex-col overflow-hidden rounded-2xl border border-[#1E2936] bg-[#111720]"
        >
          <div className="relative h-[340px] w-full overflow-hidden bg-[#0B1017] sm:h-[430px] lg:flex-1 lg:min-h-[430px]">
            {!basemapFailed ? (
              <img
                src={DEMO_BASEMAP_URL}
                alt="Dark architectural urban street and river topography demonstration basemap"
                referrerPolicy="no-referrer"
                onError={() => setBasemapFailed(true)}
                className="h-full w-full object-cover opacity-75"
              />
            ) : (
              <div
                aria-hidden="true"
                className="h-full w-full bg-[radial-gradient(circle_at_50%_50%,#172230_0%,#0B1017_75%)]"
              />
            )}

            {/* Measured dark contrast scrim so station markers stay crisp */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090D12]/80 via-[#090D12]/25 to-[#090D12]/40"
            />

            {/* Interactive Monitoring Station Markers */}
            {zones.map((zone) => {
              const meta = getAqiMeta(zone.category);
              const isSelected = zone.id === selectedZone.id;
              const displayValue = getLayerValue(zone, layer);

              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => onSelectZone(zone.id)}
                  aria-pressed={isSelected}
                  aria-label={`${zone.name}, ${currentLayerOption.label} sample ${displayValue} ${currentLayerOption.unit}, ${meta.label}`}
                  style={{
                    left: `${zone.xPercent}%`,
                    top: `${zone.yPercent}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl border px-2.5 py-1.5 backdrop-blur-md transition-transform duration-150 cursor-pointer ${
                    isSelected
                      ? 'z-20 scale-105 border-[#2DD4BF] bg-[#0D1620]/95 shadow-lg shadow-black/50'
                      : 'z-10 border-[#2B3B4E] bg-[#0D1219]/90 hover:scale-105 hover:border-[#475F7C]'
                  }`}
                >
                  <span className="font-mono text-xs font-semibold text-[#F1F5F9] tabular-nums leading-none">
                    {displayValue}
                  </span>
                  <span
                    className={`mt-1 text-[10px] font-medium leading-none whitespace-nowrap ${meta.textClass}`}
                  >
                    {meta.shortLabel}
                  </span>
                </button>
              );
            })}

            {/* Bottom Map Legend Strip */}
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-[#1E2936]/80 bg-[#090D12]/85 px-4 py-2.5 text-xs backdrop-blur-md">
              <span className="text-[#CBD5E1]">
                Layer: <strong className="font-medium text-[#F1F5F9]">{currentLayerOption.label}</strong> ({currentLayerOption.unit})
              </span>
              <span className="text-[#8B9BB0]">
                Sample markers · Select a station to inspect
              </span>
            </div>
          </div>
        </section>

        {/* Station Inspector Panel */}
        <aside
          aria-labelledby="selected-station-heading"
          className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-[#1E2936] bg-[#111720] p-5 sm:p-6"
        >
          <div>
            <div className="flex items-center gap-2 text-xs text-[#8B9BB0]">
              <MapPin className="h-3.5 w-3.5 text-[#2DD4BF]" aria-hidden="true" />
              <span>Selected Sample Zone</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{selectedZone.coordinatesLabel}</span>
            </div>

            <h2
              id="selected-station-heading"
              className="mt-2 font-display text-xl font-bold text-[#F1F5F9]"
            >
              {selectedZone.name}
            </h2>
            <p className="mt-0.5 text-xs text-[#94A3B8]">
              {selectedZone.district} · {selectedZone.environmentType}
            </p>

            <div className="mt-5 flex items-baseline gap-3 border-t border-[#1E2936] pt-4">
              <span className="font-mono text-4xl font-semibold text-[#F1F5F9] tabular-nums">
                {getLayerValue(selectedZone, layer)}
              </span>
              <div>
                <p className={`text-sm font-semibold ${selectedMeta.textClass}`}>
                  {selectedMeta.label}
                </p>
                <p className="font-mono text-xs text-[#8B9BB0]">
                  {currentLayerOption.label} ({currentLayerOption.unit}) · Sample
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 border-t border-[#1E2936] pt-4 text-xs">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#8B9BB0]">Dominant Pollutant</dt>
                <dd className="font-mono font-medium text-[#E2E8F0]">
                  {selectedZone.dominantPollutant}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#8B9BB0]">Sample PM2.5</dt>
                <dd className="font-mono font-medium text-[#E2E8F0] tabular-nums">
                  {selectedZone.demoPm25.toFixed(1)} µg/m³
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#8B9BB0]">Sample NO₂</dt>
                <dd className="font-mono font-medium text-[#E2E8F0] tabular-nums">
                  {selectedZone.demoNo2.toFixed(1)} µg/m³
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#8B9BB0]">Sample O₃</dt>
                <dd className="font-mono font-medium text-[#E2E8F0] tabular-nums">
                  {selectedZone.demoO3.toFixed(1)} µg/m³
                </dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-[#1E2936] pt-4">
              <p className="text-xs font-medium text-[#CBD5E1]">Primary Urban Driver</p>
              <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">
                {selectedZone.primarySource}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onInspectZoneOnDashboard(selectedZone.id)}
            className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#041312] transition-colors duration-150 hover:bg-[#2DD4BF] whitespace-nowrap cursor-pointer"
          >
            <span>Open Zone on Dashboard</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </aside>
      </div>

      {/* Accessible District Comparison Table */}
      <section
        aria-labelledby="station-table-heading"
        className="rounded-2xl border border-[#1E2936] bg-[#111720] p-5 sm:p-6"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="station-table-heading"
              className="font-display text-base font-semibold text-[#F1F5F9]"
            >
              Sample Monitoring Zones
            </h2>
            <p className="text-xs text-[#8B9BB0]">
              Compare demonstration fixtures across urban corridors
            </p>
          </div>
          <span className="text-xs text-[#8B9BB0]">
            5 sample districts
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#1E2936] text-xs font-medium text-[#8B9BB0]">
                <th scope="col" className="pb-3 pr-4">District</th>
                <th scope="col" className="pb-3 pr-4">Category</th>
                <th scope="col" className="pb-3 pr-4 text-right">Sample AQI</th>
                <th scope="col" className="pb-3 pr-4 text-right">PM2.5</th>
                <th scope="col" className="pb-3 pr-4 text-right">NO₂</th>
                <th scope="col" className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2936]">
              {zones.map((zone) => {
                const meta = getAqiMeta(zone.category);
                const isSelected = zone.id === selectedZone.id;
                return (
                  <tr
                    key={zone.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-[#15222E]/60' : 'hover:bg-[#0D1219]/70'
                    }`}
                  >
                    <td className="py-3.5 pr-4">
                      <p className="font-medium text-[#F1F5F9]">{zone.name}</p>
                      <p className="text-xs text-[#8B9BB0]">{zone.environmentType}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`text-xs font-semibold ${meta.textClass}`}>
                        {meta.shortLabel}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-right font-mono font-semibold text-[#F1F5F9] tabular-nums">
                      {zone.demoAqi}
                    </td>
                    <td className="py-3.5 pr-4 text-right font-mono text-xs text-[#CBD5E1] tabular-nums">
                      {zone.demoPm25.toFixed(1)} µg/m³
                    </td>
                    <td className="py-3.5 pr-4 text-right font-mono text-xs text-[#CBD5E1] tabular-nums">
                      {zone.demoNo2.toFixed(1)} µg/m³
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectZone(zone.id)}
                        className="inline-flex min-h-[36px] items-center rounded-lg border border-[#253344] bg-[#0D1219] px-3 py-1 text-xs font-medium text-[#E2E8F0] transition-colors hover:border-[#2DD4BF] hover:text-[#2DD4BF] whitespace-nowrap cursor-pointer"
                      >
                        {isSelected ? 'Selected' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
