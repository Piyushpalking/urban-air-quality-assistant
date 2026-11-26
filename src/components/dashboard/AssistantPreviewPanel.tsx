import { useState, type FormEvent } from 'react';
import { ArrowUpRight, MessageSquareText, Send } from 'lucide-react';
import { ASSISTANT_PROMPT_TEMPLATES } from '../../data/demonstrationData';
import type { AirQualitySnapshot } from '../../types/airQuality';

interface AssistantPreviewPanelProps {
  snapshot: AirQualitySnapshot;
  onOpenAssistantWithPrompt: (prompt?: string) => void;
}

export function AssistantPreviewPanel({
  snapshot,
  onOpenAssistantWithPrompt,
}: AssistantPreviewPanelProps) {
  const [draft, setDraft] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      onOpenAssistantWithPrompt();
      return;
    }
    setDraft('');
    onOpenAssistantWithPrompt(trimmed);
  };

  return (
    <section
      aria-labelledby="dashboard-assistant-heading"
      className="flex flex-col justify-between rounded-2xl border border-[#1E2936] bg-[#111720] p-5 sm:p-6"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#8B9BB0]">
              <MessageSquareText className="h-3.5 w-3.5 text-[#2DD4BF]" aria-hidden="true" />
              <span>AI Environmental Assistant</span>
              <span aria-hidden="true">·</span>
              <span>Backend pending</span>
            </div>
            <h2
              id="dashboard-assistant-heading"
              className="mt-1.5 font-display text-lg font-semibold text-[#F1F5F9]"
            >
              Ask about {snapshot.district}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onOpenAssistantWithPrompt()}
            className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-[#253344] bg-[#0D1219] px-3 py-1.5 text-xs font-medium text-[#E2E8F0] transition-colors duration-150 hover:border-[#384A61] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Open Full View</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8]">
          Prepared for secure server-side Gemini integration in Stage 2. Prompts attach this district&apos;s air quality context without generating fabricated responses.
        </p>

        {/* Starter Prompt List */}
        <div className="mt-4 divide-y divide-[#1E2936] border-y border-[#1E2936]">
          {ASSISTANT_PROMPT_TEMPLATES.slice(0, 3).map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onOpenAssistantWithPrompt(template.prompt)}
              className="flex min-h-[48px] w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:text-[#2DD4BF] cursor-pointer"
            >
              <div className="min-w-0">
                <p className="text-xs text-[#8B9BB0]">{template.category}</p>
                <p className="mt-0.5 truncate text-sm font-medium text-[#E2E8F0]">
                  {template.label}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[#64748B]" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {/* Quick Prompt Input */}
      <form onSubmit={handleSubmit} className="mt-5">
        <label htmlFor="dashboard-assistant-input" className="sr-only">
          Draft a question for the AI Assistant
        </label>
        <div className="flex items-center gap-2">
          <input
            id="dashboard-assistant-input"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Draft an air quality question..."
            className="min-h-[44px] flex-1 rounded-xl border border-[#253344] bg-[#0D1219] px-3.5 text-sm text-[#F1F5F9] placeholder-[#64748B] focus:border-[#2DD4BF] focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Open prompt in AI Assistant"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6] text-[#041312] transition-colors duration-150 hover:bg-[#2DD4BF] cursor-pointer"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </section>
  );
}
