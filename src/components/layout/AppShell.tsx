import { useState, type ReactNode } from 'react';
import {
  Activity,
  BookOpen,
  ChevronDown,
  MapPin,
  Map as MapIcon,
  MessageSquareText,
  RefreshCw,
  Wind,
  X,
} from 'lucide-react';
import type {
  AqiStandard,
  CityLocation,
  NavView,
} from '../../types/airQuality';
import {
  formatCitySubtitle,
  formatCoordinates,
  formatLastUpdated,
  getStandardShortLabel,
} from '../../utils/aqiHelpers';
import { CitySearchControl } from './CitySearchControl';

interface AppShellProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  cities: CityLocation[];
  activeCity: CityLocation | null;
  onSelectCity: (city: CityLocation) => void;
  aqiStandard: AqiStandard;
  onChangeAqiStandard: (standard: AqiStandard) => void;
  lastUpdatedIso: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  children: ReactNode;
}

const NAV_ITEMS: Array<{
  id: NavView;
  label: string;
  mobileLabel: string;
  icon: typeof Activity;
}> = [
  { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Dashboard', icon: Activity },
  { id: 'map', label: 'Pollution Map', mobileLabel: 'Map', icon: MapIcon },
  { id: 'assistant', label: 'AI Assistant', mobileLabel: 'Assistant', icon: MessageSquareText },
  { id: 'insights', label: 'Insights', mobileLabel: 'Insights', icon: BookOpen },
];

const VIEW_TITLES: Record<NavView, string> = {
  dashboard: 'Dashboard',
  map: 'Pollution Map',
  assistant: 'AI Assistant',
  insights: 'Insights',
};

export function AppShell({
  activeView,
  onSelectView,
  cities,
  activeCity,
  onSelectCity,
  aqiStandard,
  onChangeAqiStandard,
  lastUpdatedIso,
  isRefreshing,
  onRefresh,
  children,
}: AppShellProps) {
  const [citySheetOpen, setCitySheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#090D12] text-[#F1F5F9] lg:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#14B8A6] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#041312]"
      >
        Skip to main content
      </a>

      {/* Desktop Left Sidebar (256px) */}
      <aside
        aria-label="Primary navigation"
        className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-[#1E2936] lg:bg-[#0D1219] lg:sticky lg:top-0 lg:h-screen"
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-[#1E2936] px-6">
          <Wind className="h-5 w-5 text-[#2DD4BF] shrink-0" aria-hidden="true" />
          <span className="font-display text-base font-bold tracking-tight text-[#F1F5F9] whitespace-nowrap">
            Urban Air Quality
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#15222E] text-[#2DD4BF]'
                    : 'text-[#94A3B8] hover:bg-[#111720] hover:text-[#F1F5F9]'
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#1E2936] px-6 py-4">
          <p className="text-xs font-medium text-[#CBD5E1]">Open-Meteo Air Quality</p>
          <p className="mt-1 text-xs leading-relaxed text-[#8B9BB0]">
            Atmospheric model-based estimates (CAMS &amp; regional grids). Not sourced from CPCB ground stations.
          </p>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact Top Bar (48px mobile / 64px desktop) */}
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-3 border-b border-[#1E2936] bg-[#090D12]/95 px-4 backdrop-blur-md lg:h-16 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <Wind className="h-4 w-4 text-[#2DD4BF] shrink-0 lg:hidden" aria-hidden="true" />
            <span className="truncate font-display text-sm font-semibold text-[#F1F5F9] lg:text-base">
              <span className="lg:hidden">Urban Air Quality</span>
              <span className="hidden lg:inline">{VIEW_TITLES[activeView]}</span>
            </span>
            {activeCity ? (
              <>
                <span className="hidden text-xs text-[#64748B] lg:inline" aria-hidden="true">
                  /
                </span>
                <span className="hidden truncate text-sm text-[#94A3B8] lg:inline">
                  {activeCity.name}, {activeCity.country}
                </span>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCitySheetOpen(true)}
              aria-label={
                activeCity
                  ? `Search or switch city. Current: ${activeCity.name}`
                  : 'Search or select a city'
              }
              className="inline-flex min-h-[40px] max-w-[172px] items-center gap-1.5 rounded-lg border border-[#1E2936] bg-[#111720] px-2.5 text-xs font-medium text-[#E2E8F0] transition-colors duration-150 hover:border-[#2E3F54] lg:hidden cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-[#2DD4BF] shrink-0" aria-hidden="true" />
              <span className="truncate">{activeCity?.name ?? 'Select City'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#8B9BB0] shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing || !activeCity}
              className="hidden lg:inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#253344] bg-[#111720] px-4 py-2 text-xs font-medium text-[#E2E8F0] transition-colors duration-150 hover:border-[#384A61] hover:text-white disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#2DD4BF] ${isRefreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{isRefreshing ? 'Updating...' : 'Refresh Data'}</span>
            </button>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-7"
        >
          {/* Workspace Context, City Search & AQI Standard Toolbar */}
          <div className="mb-6 flex flex-col gap-4 border-b border-[#1E2936] pb-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8B9BB0]">
                  <span>Model-based data · Open-Meteo</span>
                  <span aria-hidden="true">·</span>
                  <span>Standard: {getStandardShortLabel(aqiStandard)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Updated: {formatLastUpdated(lastUpdatedIso)}
                  </span>
                </div>
                <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#F1F5F9] sm:text-[28px]">
                  {activeView === 'dashboard'
                    ? (activeCity?.name ?? 'Select a City')
                    : VIEW_TITLES[activeView]}
                </h1>
                {activeCity ? (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#94A3B8]">
                    <span>{formatCitySubtitle(activeCity)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatCoordinates(activeCity.latitude, activeCity.longitude)}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                {/* Desktop City Search (Open-Meteo Geocoding) */}
                <div className="w-full sm:w-64">
                  <CitySearchControl
                    onSelectCity={onSelectCity}
                    placeholder="Search city (Open-Meteo)..."
                    compact
                  />
                </div>

                {/* AQI Standard Switcher (US AQI | EU AQI) */}
                <div
                  role="group"
                  aria-label="Select AQI standard"
                  className="inline-flex self-start rounded-xl border border-[#1E2936] bg-[#0D1219] p-1 shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => onChangeAqiStandard('us')}
                    aria-pressed={aqiStandard === 'us'}
                    className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      aqiStandard === 'us'
                        ? 'bg-[#1A2634] text-[#F1F5F9]'
                        : 'text-[#8B9BB0] hover:text-[#E2E8F0]'
                    }`}
                  >
                    US AQI
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeAqiStandard('european')}
                    aria-pressed={aqiStandard === 'european'}
                    className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      aqiStandard === 'european'
                        ? 'bg-[#1A2634] text-[#F1F5F9]'
                        : 'text-[#8B9BB0] hover:text-[#E2E8F0]'
                    }`}
                  >
                    EU AQI
                  </button>
                </div>

                {/* Mobile Inline Refresh Trigger */}
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing || !activeCity}
                  aria-label="Refresh air quality data"
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[#253344] bg-[#111720] px-3.5 text-xs font-medium text-[#E2E8F0] transition-colors hover:border-[#384A61] disabled:opacity-50 lg:hidden cursor-pointer"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-[#2DD4BF] ${isRefreshing ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {/* Quick Tracked Cities Strip (Horizontal Scroll on Mobile, Clean Row on Desktop) */}
            <div
              role="region"
              aria-label="Tracked cities"
              className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5"
            >
              {cities.map((city) => {
                const isSelected = activeCity?.id === city.id;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => onSelectCity(city)}
                    aria-pressed={isSelected}
                    className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'border-[#2DD4BF]/70 bg-[#15222E] text-[#2DD4BF]'
                        : 'border-[#1E2936] bg-[#0D1219] text-[#94A3B8] hover:border-[#2E3F54] hover:text-[#E2E8F0]'
                    }`}
                  >
                    {city.name}
                  </button>
                );
              })}
            </div>
          </div>

          {children}

          <footer className="mt-10 border-t border-[#1E2936] pt-5 text-xs text-[#8B9BB0] flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>Urban Air Quality Assistant · Open-Meteo Air Quality &amp; Geocoding APIs</span>
            <span>Atmospheric model-based estimates · Not physical CPCB monitoring stations</span>
          </footer>
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (56px height + safe area; >= 44px touch targets) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1E2936] bg-[#0D1219]/95 backdrop-blur-md pb-safe lg:hidden"
      >
        <div className="grid h-14 grid-cols-4 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 transition-colors duration-150 cursor-pointer ${
                  isActive ? 'text-[#2DD4BF]' : 'text-[#8B9BB0] hover:text-[#E2E8F0]'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-[11px] font-medium leading-none whitespace-nowrap">
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Sheet for City Search & Quick Selection */}
      {citySheetOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="city-sheet-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm lg:hidden"
          onClick={() => setCitySheetOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl border-t border-[#253344] bg-[#111720] px-5 pb-6 pt-3 pb-safe max-h-[85vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#2E3F54]" aria-hidden="true" />
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#1E2936]">
              <div>
                <h2 id="city-sheet-title" className="text-base font-semibold text-[#F1F5F9]">
                  Select or Search City
                </h2>
                <p className="text-xs text-[#8B9BB0]">
                  Powered by Open-Meteo Geocoding API
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCitySheetOpen(false)}
                aria-label="Close city selector"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[#94A3B8] hover:bg-[#1A2634] hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4">
              <CitySearchControl
                onSelectCity={(city) => {
                  onSelectCity(city);
                  setCitySheetOpen(false);
                }}
                placeholder="Search any city worldwide..."
              />
            </div>

            <p className="mt-5 text-xs font-medium text-[#8B9BB0]">Tracked Cities</p>
            <div className="mt-2 divide-y divide-[#1E2936]">
              {cities.map((city) => {
                const isSelected = activeCity?.id === city.id;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      onSelectCity(city);
                      setCitySheetOpen(false);
                    }}
                    className={`flex min-h-[56px] w-full items-center justify-between gap-4 py-3 text-left transition-colors cursor-pointer ${
                      isSelected ? 'text-[#2DD4BF]' : 'text-[#F1F5F9] hover:text-[#2DD4BF]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{city.name}</p>
                      <p className="truncate text-xs text-[#8B9BB0]">
                        {formatCitySubtitle(city)}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-[#8B9BB0] tabular-nums shrink-0">
                      {formatCoordinates(city.latitude, city.longitude)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
