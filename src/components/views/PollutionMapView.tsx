import { useState } from 'react';
import { ArrowRight, Layers, MapPin, RefreshCw } from 'lucide-react';
import { BASEMAP_TEXTURE_URL } from '../../data/demonstrationData';
import type {
  AqiStandard,
  CityLocation,
  CityMapPoint,
  MapLayerId,
} from '../../types/airQuality';
import {
  formatCitySubtitle,
  formatCoordinates,
  formatModelTimestamp,
  formatPollutantValue,
  getAqiMeta,
  getStandardShortLabel,
} from '../../utils/aqiHelpers';
import {
  EmptyStatePanel,
  ErrorStatePanel,
  ViewLoadingSkeleton,
} from '../common/StateViews';

interface PollutionMapViewProps {
  points: CityMapPoint[];
  activeCityId: string | null;
  aqiStandard: AqiStandard;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectCity: (city: CityLocation) => void;
  onInspectCityOnDashboard: (city: CityLocation) => void;
}

function projectToMapPercent(latitude: number, longitude: number): {
  xPercent: number;
  yPercent: number;
} {
  // Equirectangular projection with gentle edge padding so markers never clip
  const rawX = ((longitude + 180) / 360) * 100;
  const rawY = ((90 - latitude) / 180) * 100;
  return {
    xPercent: Math.max(8, Math.min(92, rawX)),
    yPercent: Math.max(12, Math.min(82, rawY)),
  };
}

function getLayerDisplay(
  point: CityMapPoint,
  layer: MapLayerId,
  standard: AqiStandard
): { valueText: string; unit: string } {
  switch (layer) {
    case 'pm25':
      return {
        valueText: formatPollutantValue(point.pm25),
        unit: point.units.pm25,
      };
    case 'no2':
      return {
        valueText: formatPollutantValue(point.no2),
        unit: point.units.no2,
      };
    case 'o3':
      return {
        valueText: formatPollutantValue(point.o3),
        unit: point.units.o3,
      };
    case 'aqi':
    default: {
      const val = standard === 'european' ? point.europeanAqi : point.usAqi;
      return {
        valueText: val !== null ? String(val) : '—',
        unit: getStandardShortLabel(standard),
      };
    }
  }
}

export function PollutionMapView({
  points,
  activeCityId,
  aqiStandard,
  isLoading,
  error,
  onRetry,
  onSelectCity,
  onInspectCityOnDashboard,
}: PollutionMapViewProps) {
  const [layer, setLayer] = useState<MapLayerId>('aqi');
  const [basemapFailed, setBasemapFailed] = useState(false);

  if (isLoading && points.length === 0) {
    return <ViewLoadingSkeleton view="map" />;
  }

  if (error && points.length === 0) {
    return (
      <ErrorStatePanel
        title="Unable to load Open-Meteo city comparison map"
        description={error}
        errorCode="OPEN_METEO_MAP_FETCH_FAILED"
        onRetry={onRetry}
      />
    );
  }

  if (points.length === 0) {
    return (
      <EmptyStatePanel
        title="No tracked cities loaded"
        description="Use the city search bar above to look up a city via Open-Meteo Geocoding and inspect modeled air quality coordinates."
        primaryActionLabel="Reload Tracked Cities"
        onPrimaryAction={onRetry}
      />
    );
  }

  const selectedPoint =
    points.find((item) => item.location.id === activeCityId) ?? points[0];
  const selectedCategory =
    aqiStandard === 'european'
      ? selectedPoint.europeanCategory
      : selectedPoint.usCategory;
  const selectedMeta = getAqiMeta(selectedCategory, aqiStandard);
  const selectedDisplay = getLayerDisplay(selectedPoint, layer, aqiStandard);

  const layerOptions: Array<{ id: MapLayerId; label: string }> = [
    { id: 'aqi', label: getStandardShortLabel(aqiStandard) },
    { id: 'pm25', label: 'PM2.5' },
    { id: 'no2', label: 'NO₂' },
    { id: 'o3', label: 'O₃' },
  ];

  const currentLayerLabel =
    layerOptions.find((item) => item.id === layer)?.label ??
    getStandardShortLabel(aqiStandard);

  return (
    <div className="space-y-6">
      {/* Layer Filter & Provenance Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-[#8B9BB0]">
          <Layers className="h-4 w-4 text-[#2DD4BF] shrink-0" aria-hidden="true" />
          <span>
            Modeled city coordinates via Open-Meteo Air Quality API · Not physical ground monitoring stations or CPCB feeds
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Pollutant map layer"
            className="inline-flex overflow-x-auto no-scrollbar rounded-xl border border-[#1E2936] bg-[#0D1219] p-1"
          >
            {layerOptions.map((option) => {
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

          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            aria-label="Refresh map city values"
            className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-[#253344] bg-[#111720] text-[#CBD5E1] transition-colors hover:border-[#384A61] disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <RefreshCw
              className={`h-4 w-4 text-[#2DD4BF] ${isLoading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Coordinate Projection Canvas + Selected City Inspector */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <section
          aria-label="Global coordinate projection of Open-Meteo modeled cities"
          className="lg:col-span-8 flex flex-col overflow-hidden rounded-2xl border border-[#1E2936] bg-[#111720]"
        >
          <div className="relative h-[340px] w-full overflow-hidden bg-[#0B1017] sm:h-[430px] lg:flex-1 lg:min-h-[430px]">
            {!basemapFailed ? (
              <img
                src={BASEMAP_TEXTURE_URL}
                alt="Dark atmospheric cartographic surface background for geographic city coordinates"
                referrerPolicy="no-referrer"
                onError={() => setBasemapFailed(true)}
                className="h-full w-full object-cover opacity-35"
              />
            ) : (
              <div
                aria-hidden="true"
                className="h-full w-full bg-[radial-gradient(circle_at_50%_50%,#172230_0%,#0B1017_75%)]"
              />
            )}

            {/* Latitude / Longitude Equirectangular Reference Graticule */}
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              {[25, 50, 75].map((y) => (
                <line
                  key={`lat-${y}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="#253344"
                  strokeWidth="0.25"
                  strokeDasharray={y === 50 ? '1 1' : undefined}
                />
              ))}
              {[20, 40, 50, 60, 80].map((x) => (
                <line
                  key={`lon-${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="#253344"
                  strokeWidth="0.25"
                  strokeDasharray={x === 50 ? '1 1' : undefined}
                />
              ))}
            </svg>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090D12]/85 via-[#090D12]/25 to-[#090D12]/40"
            />

            {/* Coordinate Labels */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-2.5 font-mono text-[10px] text-[#64748B]"
            >
              Equirectangular Lat/Lon View
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#64748B]"
            >
              0° Eq
            </span>

            {/* Real City Coordinate Markers */}
            {points.map((point) => {
              const category =
                aqiStandard === 'european'
                  ? point.europeanCategory
                  : point.usCategory;
              const meta = getAqiMeta(category, aqiStandard);
              const isSelected = point.location.id === selectedPoint.location.id;
              const display = getLayerDisplay(point, layer, aqiStandard);
              const { xPercent, yPercent } = projectToMapPercent(
                point.location.latitude,
                point.location.longitude
              );

              return (
                <button
                  key={point.location.id}
                  type="button"
                  onClick={() => onSelectCity(point.location)}
                  aria-pressed={isSelected}
                  aria-label={`${point.location.name}, ${currentLayerLabel} ${display.valueText} ${display.unit}, ${meta.label}`}
                  style={{
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[54px] flex-col items-center justify-center rounded-xl border px-2.5 py-1.5 backdrop-blur-md transition-transform duration-150 cursor-pointer ${
                    isSelected
                      ? 'z-20 scale-105 border-[#2DD4BF] bg-[#0D1620]/95 shadow-lg shadow-black/60'
                      : 'z-10 border-[#2B3B4E] bg-[#0D1219]/90 hover:scale-105 hover:border-[#475F7C]'
                  }`}
                >
                  <span className="font-mono text-xs font-semibold text-[#F1F5F9] tabular-nums leading-none">
                    {display.valueText}
                  </span>
                  <span
                    className={`mt-1 text-[10px] font-medium leading-none whitespace-nowrap ${meta.textClass}`}
                  >
                    {point.location.name}
                  </span>
                </button>
              );
            })}

            {/* Bottom Map Legend Strip */}
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-[#1E2936]/80 bg-[#090D12]/85 px-4 py-2.5 text-xs backdrop-blur-md">
              <span className="text-[#CBD5E1]">
                Layer:{' '}
                <strong className="font-medium text-[#F1F5F9]">
                  {currentLayerLabel}
                </strong>{' '}
                ({selectedDisplay.unit})
              </span>
              <span className="text-[#8B9BB0]">
                {points.length} tracked cities · Open-Meteo model grid
              </span>
            </div>
          </div>
        </section>

        {/* Selected City Inspector */}
        <aside
          aria-labelledby="selected-city-heading"
          className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-[#1E2936] bg-[#111720] p-5 sm:p-6"
        >
          <div>
            <div className="flex items-center gap-2 text-xs text-[#8B9BB0]">
              <MapPin className="h-3.5 w-3.5 text-[#2DD4BF]" aria-hidden="true" />
              <span>Modeled City Point</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {formatCoordinates(
                  selectedPoint.location.latitude,
                  selectedPoint.location.longitude
                )}
              </span>
            </div>

            <h2
              id="selected-city-heading"
              className="mt-2 font-display text-xl font-bold text-[#F1F5F9]"
            >
              {selectedPoint.location.name}
            </h2>
            <p className="mt-0.5 text-xs text-[#94A3B8]">
              {formatCitySubtitle(selectedPoint.location)}
            </p>

            <div className="mt-5 flex items-baseline gap-3 border-t border-[#1E2936] pt-4">
              <span className="font-mono text-4xl font-semibold text-[#F1F5F9] tabular-nums">
                {selectedDisplay.valueText}
              </span>
              <div>
                <p className={`text-sm font-semibold ${selectedMeta.textClass}`}>
                  {selectedMeta.label}
                </p>
                <p className="font-mono text-xs text-[#8B9BB0]">
                  {currentLayerLabel} ({selectedDisplay.unit})
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 border-t border-[#1E2936] pt-4 text-xs">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#8B9BB0]">US EPA AQI</dt>
                <dd className="font-mono font-medium text-[#E2E8F0] tabular-nums">
                  {selectedPoint.usAqi ?? 'Unavailable'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#8B9BB0]">European AQI</dt>
                <dd className="font-mono font-medium text-[#E2E8F0] tabular-nums">
                  {selectedPoint.europeanAqi ?? 'Unavailable'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#8B9BB0]">PM2.5</dt>
                <dd className="font-mono font-medium text-[#E2E8F0] tabular-nums">
                  {formatPollutantValue(selectedPoint.pm25)}{' '}
                  {selectedPoint.pm25 !== null ? selectedPoint.units.pm25 : ''}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#8B9BB0]">NO₂</dt>
                <dd className="font-mono font-medium text-[#E2E8F0] tabular-nums">
                  {formatPollutantValue(selectedPoint.no2)}{' '}
                  {selectedPoint.no2 !== null ? selectedPoint.units.no2 : ''}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#8B9BB0]">O₃</dt>
                <dd className="font-mono font-medium text-[#E2E8F0] tabular-nums">
                  {formatPollutantValue(selectedPoint.o3)}{' '}
                  {selectedPoint.o3 !== null ? selectedPoint.units.o3 : ''}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#8B9BB0]">Model Time</dt>
                <dd className="font-mono font-medium text-[#E2E8F0] tabular-nums">
                  {formatModelTimestamp(selectedPoint.modelTimeIso)}
                </dd>
              </div>
            </dl>
          </div>

          <button
            type="button"
            onClick={() => onInspectCityOnDashboard(selectedPoint.location)}
            className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-[#041312] transition-colors duration-150 hover:bg-[#2DD4BF] whitespace-nowrap cursor-pointer"
          >
            <span>Open City on Dashboard</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </aside>
      </div>

      {/* Accessible Multi-City Comparison Table */}
      <section
        aria-labelledby="city-table-heading"
        className="rounded-2xl border border-[#1E2936] bg-[#111720] p-5 sm:p-6"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="city-table-heading"
              className="font-display text-base font-semibold text-[#F1F5F9]"
            >
              Tracked Cities · Open-Meteo Model Comparison
            </h2>
            <p className="text-xs text-[#8B9BB0]">
              Grid-modeled values fetched by city latitude &amp; longitude · Search above to add any city
            </p>
          </div>
          <span className="text-xs text-[#8B9BB0]">
            {points.length} cities loaded
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#1E2936] text-xs font-medium text-[#8B9BB0]">
                <th scope="col" className="pb-3 pr-4">City</th>
                <th scope="col" className="pb-3 pr-4">Category ({getStandardShortLabel(aqiStandard)})</th>
                <th scope="col" className="pb-3 pr-4 text-right">US AQI</th>
                <th scope="col" className="pb-3 pr-4 text-right">EU AQI</th>
                <th scope="col" className="pb-3 pr-4 text-right">PM2.5</th>
                <th scope="col" className="pb-3 pr-4 text-right">NO₂</th>
                <th scope="col" className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2936]">
              {points.map((point) => {
                const category =
                  aqiStandard === 'european'
                    ? point.europeanCategory
                    : point.usCategory;
                const meta = getAqiMeta(category, aqiStandard);
                const isSelected = point.location.id === selectedPoint.location.id;

                return (
                  <tr
                    key={point.location.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-[#15222E]/60' : 'hover:bg-[#0D1219]/70'
                    }`}
                  >
                    <td className="py-3.5 pr-4">
                      <p className="font-medium text-[#F1F5F9]">
                        {point.location.name}
                      </p>
                      <p className="font-mono text-xs text-[#8B9BB0] tabular-nums">
                        {formatCoordinates(
                          point.location.latitude,
                          point.location.longitude
                        )}
                      </p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`text-xs font-semibold ${meta.textClass}`}>
                        {meta.shortLabel}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-right font-mono font-semibold text-[#F1F5F9] tabular-nums">
                      {point.usAqi ?? '—'}
                    </td>
                    <td className="py-3.5 pr-4 text-right font-mono text-xs text-[#CBD5E1] tabular-nums">
                      {point.europeanAqi ?? '—'}
                    </td>
                    <td className="py-3.5 pr-4 text-right font-mono text-xs text-[#CBD5E1] tabular-nums">
                      {formatPollutantValue(point.pm25)}{' '}
                      {point.pm25 !== null ? point.units.pm25 : ''}
                    </td>
                    <td className="py-3.5 pr-4 text-right font-mono text-xs text-[#CBD5E1] tabular-nums">
                      {formatPollutantValue(point.no2)}{' '}
                      {point.no2 !== null ? point.units.no2 : ''}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectCity(point.location)}
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
