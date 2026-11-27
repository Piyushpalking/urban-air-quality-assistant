import type { AirQualitySnapshot, AqiStandard } from '../../types/airQuality';
import { AqiOverviewCard } from '../dashboard/AqiOverviewCard';
import { AssistantPreviewPanel } from '../dashboard/AssistantPreviewPanel';
import { ForecastSection } from '../dashboard/ForecastSection';
import { PollutantGrid } from '../dashboard/PollutantGrid';

interface DashboardViewProps {
  snapshot: AirQualitySnapshot;
  aqiStandard: AqiStandard;
  onOpenAssistantWithPrompt: (prompt?: string) => void;
}

export function DashboardView({
  snapshot,
  aqiStandard,
  onOpenAssistantWithPrompt,
}: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <AqiOverviewCard snapshot={snapshot} aqiStandard={aqiStandard} />

      <PollutantGrid
        pollutants={snapshot.pollutants}
        missingCount={snapshot.missingPollutantCount}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-7">
          <ForecastSection
            hourlyForecast={snapshot.hourlyForecast}
            dailyForecast={snapshot.dailyForecast}
            aqiStandard={aqiStandard}
            timezoneAbbreviation={snapshot.timezoneAbbreviation}
          />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <AssistantPreviewPanel
            snapshot={snapshot}
            aqiStandard={aqiStandard}
            onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
          />
        </div>
      </div>
    </div>
  );
}
