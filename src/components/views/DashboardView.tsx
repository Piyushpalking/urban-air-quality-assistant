import type { AirQualitySnapshot } from '../../types/airQuality';
import { AqiOverviewCard } from '../dashboard/AqiOverviewCard';
import { AssistantPreviewPanel } from '../dashboard/AssistantPreviewPanel';
import { ForecastSection } from '../dashboard/ForecastSection';
import { PollutantGrid } from '../dashboard/PollutantGrid';

interface DashboardViewProps {
  snapshot: AirQualitySnapshot;
  onOpenAssistantWithPrompt: (prompt?: string) => void;
}

export function DashboardView({
  snapshot,
  onOpenAssistantWithPrompt,
}: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <AqiOverviewCard snapshot={snapshot} />

      <PollutantGrid pollutants={snapshot.pollutants} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-7">
          <ForecastSection
            hourlyForecast={snapshot.hourlyForecast}
            dailyForecast={snapshot.dailyForecast}
          />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex-1">
            <AssistantPreviewPanel
              snapshot={snapshot}
              onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
