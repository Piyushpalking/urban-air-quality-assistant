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
import type { DataViewState, MonitoringZone, NavView } from '../../types/airQuality';

interface AppShellProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  zones: MonitoringZone[];
  activeZone: MonitoringZone;
  onSelectZone: (zoneId: string) => void;
  viewState: DataViewState;
  onChangeViewState: (state: DataViewState) => void;
  onSimulateRefresh: () => void;
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

const STATE_OPTIONS: Array<{ id: DataViewState; label: string }> = [
  { id: 'demo', label: 'Demo Data' },
  { id: 'loading', label: 'Loading' },
  { id: 'empty', label: 'Empty' },
  { id: 'error', label: 'Error' },
];

export function AppShell({
  activeView,
  onSelectView,
  zones,
  activeZone,
  onSelectZone,
  viewState,
  onChangeViewState,
  onSimulateRefresh,
  children,
}: AppShellProps) {
  const [zoneSheetOpen, setZoneSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#090D12] text-[#F1F5F9] lg:flex">
      {/* Skip to content link for keyboard and screen reader accessibility */}
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
          <p className="text-xs font-medium text-[#CBD5E1]">Stage 1 Layout Preview</p>
          <p className="mt-1 text-xs leading-relaxed text-[#8B9BB0]">
            Demonstration fixtures only. Live AQI APIs and server-side Gemini responses connect in Stage 2.
          </p>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Compact Top App Bar (48px height, keeps sticky total <= 15% on Android viewports) */}
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-3 border-b border-[#1E2936] bg-[#090D12]/95 px-4 backdrop-blur-md lg:h-16 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <Wind className="h-4 w-4 text-[#2DD4BF] shrink-0 lg:hidden" aria-hidden="true" />
            <span className="truncate font-display text-sm font-semibold text-[#F1F5F9] lg:text-base">
              <span className="lg:hidden">Urban Air Quality</span>
              <span className="hidden lg:inline">{VIEW_TITLES[activeView]}</span>
            </span>
            <span className="hidden text-xs text-[#64748B] lg:inline" aria-hidden="true">
              /
            </span>
            <span className="hidden truncate text-sm text-[#94A3B8] lg:inline">
              {activeZone.name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setZoneSheetOpen(true)}
              aria-label={`Select monitoring district. Current: ${activeZone.name}`}
              className="inline-flex min-h-[40px] max-w-[168px] items-center gap-1.5 rounded-lg border border-[#1E2936] bg-[#111720] px-2.5 text-xs font-medium text-[#E2E8F0] transition-colors duration-150 hover:border-[#2E3F54] lg:hidden cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-[#2DD4BF] shrink-0" aria-hidden="true" />
              <span className="truncate">{activeZone.district}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#8B9BB0] shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onSimulateRefresh}
              className="hidden lg:inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#253344] bg-[#111720] px-4 py-2 text-xs font-medium text-[#E2E8F0] transition-colors duration-150 hover:border-[#384A61] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#2DD4BF]" aria-hidden="true" />
              <span>Preview Loading</span>
            </button>
          </div>
        </header>

        {/* Scrollable Viewport Content */}
        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-7"
        >
          {/* Workspace Context & State Preview Toolbar */}
          <div className="mb-6 flex flex-col gap-4 border-b border-[#1E2936] pb-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8B9BB0]">
                <span>Demonstration Mode</span>
                <span aria-hidden="true">·</span>
                <span>Static sample fixtures (not live sensor data)</span>
              </div>
              <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#F1F5F9] sm:text-[28px]">
                {activeView === 'dashboard'
                  ? activeZone.name
                  : VIEW_TITLES[activeView]}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#94A3B8]">
                <span>{activeZone.district}</span>
                <span aria-hidden="true">·</span>
                <span>{activeZone.regionLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{activeZone.coordinatesLabel}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Desktop District Selector */}
              <div className="hidden lg:flex items-center gap-2">
                <label htmlFor="desktop-zone-select" className="sr-only">
                  Sample monitoring district
                </label>
                <div className="relative">
                  <MapPin
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2DD4BF]"
                    aria-hidden="true"
                  />
                  <select
                    id="desktop-zone-select"
                    value={activeZone.id}
                    onChange={(event) => onSelectZone(event.target.value)}
                    className="min-h-[40px] appearance-none rounded-xl border border-[#253344] bg-[#111720] pl-9 pr-9 text-xs font-medium text-[#E2E8F0] transition-colors hover:border-[#384A61] cursor-pointer"
                  >
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id} className="bg-[#111720] text-[#F1F5F9]">
                        {zone.name} (Sample)
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B9BB0]"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Interactive UI State Segmented Control (Demo / Loading / Empty / Error) */}
              <div
                role="group"
                aria-label="Preview interface state"
                className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-xl border border-[#1E2936] bg-[#0D1219] p-1"
              >
                {STATE_OPTIONS.map((option) => {
                  const selected = viewState === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onChangeViewState(option.id)}
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
          </div>

          {children}

          <footer className="mt-10 border-t border-[#1E2936] pt-5 text-xs text-[#8B9BB0] flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>Urban Air Quality Assistant · Frontend Architecture (Stage 1)</span>
            <span>All displayed metrics are clearly labeled demonstration fixtures.</span>
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

      {/* Mobile Bottom Sheet for Sample District Selection */}
      {zoneSheetOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="district-sheet-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm lg:hidden"
          onClick={() => setZoneSheetOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl border-t border-[#253344] bg-[#111720] px-5 pb-6 pt-3 pb-safe"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#2E3F54]" aria-hidden="true" />
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#1E2936]">
              <div>
                <h2 id="district-sheet-title" className="text-base font-semibold text-[#F1F5F9]">
                  Select Sample District
                </h2>
                <p className="text-xs text-[#8B9BB0]">
                  Demonstration locations for layout preview
                </p>
              </div>
              <button
                type="button"
                onClick={() => setZoneSheetOpen(false)}
                aria-label="Close district selector"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[#94A3B8] hover:bg-[#1A2634] hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-[#1E2936]">
              {zones.map((zone) => {
                const isSelected = zone.id === activeZone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      onSelectZone(zone.id);
                      setZoneSheetOpen(false);
                    }}
                    className={`flex min-h-[56px] w-full items-center justify-between gap-4 py-3 text-left transition-colors cursor-pointer ${
                      isSelected ? 'text-[#2DD4BF]' : 'text-[#F1F5F9] hover:text-[#2DD4BF]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{zone.name}</p>
                      <p className="truncate text-xs text-[#8B9BB0]">
                        {zone.district} · {zone.environmentType}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-semibold tabular-nums">
                        {zone.demoAqi}
                      </p>
                      <p className="text-[11px] text-[#8B9BB0]">Sample AQI</p>
                    </div>
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
