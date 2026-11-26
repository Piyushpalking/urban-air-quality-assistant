import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  getAirQualitySnapshot,
  getMonitoringZones,
  STAGE_2_ENDPOINTS,
} from './services/airQualityService';
import type { DataViewState, NavView } from './types/airQuality';

export default function App() {
  const zones = useMemo(() => getMonitoringZones(), []);
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [activeZoneId, setActiveZoneId] = useState<string>(zones[0].id);
  const [viewState, setViewState] = useState<DataViewState>('demo');
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>(undefined);
  const timerRef = useRef<number | null>(null);

  const activeZone = useMemo(
    () => zones.find((zone) => zone.id === activeZoneId) ?? zones[0],
    [activeZoneId, zones]
  );

  const snapshot = useMemo(
    () => getAirQualitySnapshot(activeZone.id),
    [activeZone.id]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerLoadingPreview = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setViewState('loading');
    timerRef.current = window.setTimeout(() => {
      setViewState('demo');
      timerRef.current = null;
    }, 650);
  }, []);

  const handleOpenAssistantWithPrompt = useCallback((prompt?: string) => {
    if (prompt) {
      setPendingPrompt(prompt);
    }
    setActiveView('assistant');
    setViewState('demo');
  }, []);

  const handleConsumeInitialPrompt = useCallback(() => {
    setPendingPrompt(undefined);
  }, []);

  const handleInspectZoneOnDashboard = useCallback((zoneId: string) => {
    setActiveZoneId(zoneId);
    setActiveView('dashboard');
    setViewState('demo');
  }, []);

  const renderActiveContent = () => {
    if (viewState === 'loading') {
      return <ViewLoadingSkeleton view={activeView} />;
    }

    if (viewState === 'empty') {
      const emptyCopy: Record<
        NavView,
        { title: string; description: string }
      > = {
        dashboard: {
          title: 'No live AQI provider connected',
          description: `Stage 1 does not fabricate live telemetry. Connect a real air quality API at ${STAGE_2_ENDPOINTS.airQuality} in Stage 2, or load the labeled demonstration fixtures to inspect the dashboard layout.`,
        },
        map: {
          title: 'No live monitoring stations configured',
          description: `Real-time spatial layers and station pins will populate once ${STAGE_2_ENDPOINTS.monitoringZones} is connected in Stage 2. Switch back to the demonstration layout to review map controls.`,
        },
        assistant: {
          title: 'AI Assistant awaiting backend setup',
          description: `Server-side Gemini integration (${STAGE_2_ENDPOINTS.assistant}) is scheduled for Stage 2. Load the demonstration workspace to preview starter prompts and inspect the request payload structure.`,
        },
        insights: {
          title: 'No personalized district insights yet',
          description:
            'Location-specific trends require historical AQI records from a connected data provider. Load the demonstration layout to review reference briefings and the EPA scale guide.',
        },
      };

      return (
        <EmptyStatePanel
          title={emptyCopy[activeView].title}
          description={emptyCopy[activeView].description}
          primaryActionLabel="Load Demonstration Layout"
          onPrimaryAction={() => setViewState('demo')}
          secondaryActionLabel="Preview Loading State"
          onSecondaryAction={triggerLoadingPreview}
        />
      );
    }

    if (viewState === 'error') {
      return (
        <ErrorStatePanel
          title="Unable to reach environmental data service"
          description={`Simulated error state for UI verification. In production, this state handles network timeouts, rate limits, or upstream unavailability from ${STAGE_2_ENDPOINTS.airQuality} without crashing the interface.`}
          errorCode="AQI_PROVIDER_UNREACHABLE_PREVIEW"
          onRetry={triggerLoadingPreview}
          onShowDemo={() => setViewState('demo')}
        />
      );
    }

    switch (activeView) {
      case 'map':
        return (
          <PollutionMapView
            zones={zones}
            activeZoneId={activeZone.id}
            onSelectZone={setActiveZoneId}
            onInspectZoneOnDashboard={handleInspectZoneOnDashboard}
          />
        );
      case 'assistant':
        return (
          <AiAssistantView
            snapshot={snapshot}
            initialPrompt={pendingPrompt}
            onConsumeInitialPrompt={handleConsumeInitialPrompt}
          />
        );
      case 'insights':
        return <InsightsView />;
      case 'dashboard':
      default:
        return (
          <DashboardView
            snapshot={snapshot}
            onOpenAssistantWithPrompt={handleOpenAssistantWithPrompt}
          />
        );
    }
  };

  return (
    <AppShell
      activeView={activeView}
      onSelectView={(view) => {
        setActiveView(view);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      zones={zones}
      activeZone={activeZone}
      onSelectZone={setActiveZoneId}
      viewState={viewState}
      onChangeViewState={setViewState}
      onSimulateRefresh={triggerLoadingPreview}
    >
      {renderActiveContent()}
    </AppShell>
  );
}
