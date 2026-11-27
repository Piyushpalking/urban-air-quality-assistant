import { useCallback, useEffect, useState } from 'react';
import {
  EmptyStatePanel,
  ErrorStatePanel,
  ViewLoadingSkeleton,
} from './components/common/StateViews';
import { AppShell } from './components/layout/AppShell';
import { AiAssistantView } from './components/views/AiAssistantView';
import { DashboardView } from './components/views/DashboardView';
import { InsightsView } from './components/views/InsightsView';
import { PollutionMapView } from './components/views/PollutionMapView';
import {
  AirQualityServiceError,
  DEFAULT_CITIES,
  fetchAirQualityForLocation,
  fetchCityMapPoints,
} from './services/airQualityService';
import type {
  AirQualitySnapshot,
  AqiStandard,
  CityLocation,
  CityMapPoint,
  NavView,
} from './types/airQuality';

export default function App() {
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [aqiStandard, setAqiStandard] = useState<AqiStandard>('us');
  const [trackedCities, setTrackedCities] = useState<CityLocation[]>(DEFAULT_CITIES);
  const [activeCity, setActiveCity] = useState<CityLocation | null>(DEFAULT_CITIES[0]);

  const [snapshot, setSnapshot] = useState<AirQualitySnapshot | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState<boolean>(true);
  const [snapshotError, setSnapshotError] = useState<{
    message: string;
    code?: string;
  } | null>(null);
  const [lastUpdatedIso, setLastUpdatedIso] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);

  // Lazy-loaded batch city comparison state for Pollution Map view
  const [mapPoints, setMapPoints] = useState<CityMapPoint[]>([]);
  const [isLoadingMap, setIsLoadingMap] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapRefreshNonce, setMapRefreshNonce] = useState<number>(0);

  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>(undefined);

  // Fetch active city's real Open-Meteo Air Quality snapshot
  useEffect(() => {
    if (!activeCity) {
      setSnapshot(null);
      setIsLoadingSnapshot(false);
      setSnapshotError(null);
      return;
    }

    const controller = new AbortController();
    const forceRefresh = refreshNonce > 0;

    setIsLoadingSnapshot(true);
    setSnapshotError(null);

    fetchAirQualityForLocation(activeCity, {
      forceRefresh,
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setSnapshot(result);
        setLastUpdatedIso(result.fetchedAtIso);
        setSnapshotError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof AirQualityServiceError) {
          if (error.code === 'ABORTED') return;
          setSnapshotError({ message: error.message, code: error.code });
        } else {
          setSnapshotError({
            message: 'Unable to load air quality data from Open-Meteo.',
            code: 'UNKNOWN_ERROR',
          });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingSnapshot(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [activeCity, refreshNonce]);

  // Lazy-load real Open-Meteo batch data for tracked cities ONLY when user visits Pollution Map
  useEffect(() => {
    if (activeView !== 'map') {
      return;
    }

    const controller = new AbortController();
    const forceRefresh = mapRefreshNonce > 0;

    setIsLoadingMap(true);
    setMapError(null);

    fetchCityMapPoints(trackedCities, {
      forceRefresh,
      signal: controller.signal,
    })
      .then((points) => {
        if (controller.signal.aborted) return;
        setMapPoints(points);
        if (points[0]?.fetchedAtIso) {
          setLastUpdatedIso(points[0].fetchedAtIso);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof AirQualityServiceError && error.code === 'ABORTED') {
          return;
        }
        setMapError(
          error instanceof Error
            ? error.message
            : 'Unable to load tracked city comparisons from Open-Meteo.'
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingMap(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [activeView, trackedCities, mapRefreshNonce]);

  const handleSelectCity = useCallback((city: CityLocation) => {
    setTrackedCities((prev) => {
      const exists = prev.some(
        (item) =>
          item.id === city.id ||
          (Math.abs(item.latitude - city.latitude) < 0.01 &&
            Math.abs(item.longitude - city.longitude) < 0.01)
      );
      if (exists) {
        return prev;
      }
      // Keep list concise (max 8 tracked cities) so batch map lookups stay fast
      return [city, ...prev].slice(0, 8);
    });
    setActiveCity(city);
    setRefreshNonce(0);
  }, []);

  const handleManualRefresh = useCallback(() => {
    setRefreshNonce((prev) => prev + 1);
    if (activeView === 'map') {
      setMapRefreshNonce((prev) => prev + 1);
    }
  }, [activeView]);

  const handleOpenAssistantWithPrompt = useCallback((prompt?: string) => {
    if (prompt) {
      setPendingPrompt(prompt);
    }
    setActiveView('assistant');
  }, []);

  const handleConsumeInitialPrompt = useCallback(() => {
    setPendingPrompt(undefined);
  }, []);

  const handleInspectCityOnDashboard = useCallback(
    (city: CityLocation) => {
      handleSelectCity(city);
      setActiveView('dashboard');
    },
    [handleSelectCity]
  );

  const renderActiveContent = () => {
    if (activeView === 'map') {
      return (
        <PollutionMapView
          points={mapPoints}
          activeCityId={activeCity?.id ?? null}
          aqiStandard={aqiStandard}
          isLoading={isLoadingMap}
          error={mapError}
          onRetry={() => setMapRefreshNonce((prev) => prev + 1)}
          onSelectCity={handleSelectCity}
          onInspectCityOnDashboard={handleInspectCityOnDashboard}
        />
      );
    }

    if (!activeCity) {
      return (
        <EmptyStatePanel
          title="No city selected"
          description="Search for any city using Open-Meteo Geocoding above or select a default city to load model-based air quality metrics."
          primaryActionLabel="Load Default City"
          onPrimaryAction={() => setActiveCity(DEFAULT_CITIES[0])}
        />
      );
    }

    if (isLoadingSnapshot && !snapshot) {
      return <ViewLoadingSkeleton view={activeView} />;
    }

    if (snapshotError && !snapshot) {
      return (
        <ErrorStatePanel
          title={`Unable to load air quality data for ${activeCity.name}`}
          description={snapshotError.message}
          errorCode={snapshotError.code}
          onRetry={handleManualRefresh}
        />
      );
    }

    if (!snapshot) {
      return (
        <EmptyStatePanel
          title="No air quality snapshot available"
          description="Open-Meteo returned no readable model snapshot for this location. Try refreshing or selecting another city."
          primaryActionLabel="Retry Fetch"
          onPrimaryAction={handleManualRefresh}
        />
      );
    }

    return (
      <div className="space-y-4">
        {snapshotError ? (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EF4444]/35 bg-[#1B1217] px-4 py-3 text-xs text-[#FCA5A5]"
          >
            <span>
              Refresh failed ({snapshotError.message}). Displaying last cached snapshot for {snapshot.location.name}.
            </span>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="font-semibold text-[#F1F5F9] underline underline-offset-2 hover:text-[#2DD4BF] cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : null}

        {activeView === 'assistant' ? (
          <AiAssistantView
            snapshot={snapshot}
            aqiStandard={aqiStandard}
            initialPrompt={pendingPrompt}
            onConsumeInitialPrompt={handleConsumeInitialPrompt}
          />
        ) : activeView === 'insights' ? (
          <InsightsView snapshot={snapshot} aqiStandard={aqiStandard} />
        ) : (
          <DashboardView
            snapshot={snapshot}
            aqiStandard={aqiStandard}
            onOpenAssistantWithPrompt={handleOpenAssistantWithPrompt}
          />
        )}
      </div>
    );
  };

  return (
    <AppShell
      activeView={activeView}
      onSelectView={(view) => {
        setActiveView(view);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      cities={trackedCities}
      activeCity={activeCity}
      onSelectCity={handleSelectCity}
      aqiStandard={aqiStandard}
      onChangeAqiStandard={setAqiStandard}
      lastUpdatedIso={lastUpdatedIso}
      isRefreshing={isLoadingSnapshot || (activeView === 'map' && isLoadingMap)}
      onRefresh={handleManualRefresh}
    >
      {renderActiveContent()}
    </AppShell>
  );
}
