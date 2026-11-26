import { useEffect, useState, type FormEvent } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Code2,
  Info,
  MessageSquareText,
  Send,
  Trash2,
} from 'lucide-react';
import { ASSISTANT_PROMPT_TEMPLATES } from '../../data/demonstrationData';
import {
  buildPlannedAssistantEntry,
  STAGE_2_ENDPOINTS,
} from '../../services/airQualityService';
import type {
  AirQualitySnapshot,
  AssistantThreadEntry,
} from '../../types/airQuality';

interface AiAssistantViewProps {
  snapshot: AirQualitySnapshot;
  initialPrompt?: string;
  onConsumeInitialPrompt: () => void;
}

export function AiAssistantView({
  snapshot,
  initialPrompt,
  onConsumeInitialPrompt,
}: AiAssistantViewProps) {
  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<AssistantThreadEntry[]>([]);
  const [expandedPayloadIds, setExpandedPayloadIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      const nextEntry = buildPlannedAssistantEntry(initialPrompt, snapshot);
      setEntries((prev) => [...prev, nextEntry]);
      onConsumeInitialPrompt();
    }
  }, [initialPrompt, onConsumeInitialPrompt, snapshot]);

  const submitQuestion = (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed) {
      return;
    }
    const nextEntry = buildPlannedAssistantEntry(trimmed, snapshot);
    setEntries((prev) => [...prev, nextEntry]);
    setInput('');
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitQuestion(input);
  };

  const togglePayload = (id: string) => {
    setExpandedPayloadIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Main Conversational Workspace */}
      <section
        aria-labelledby="assistant-workspace-heading"
        className="lg:col-span-8 flex flex-col rounded-2xl border border-[#1E2936] bg-[#111720]"
      >
        {/* Grounded Context Header */}
        <div className="flex flex-col gap-2 border-b border-[#1E2936] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2
              id="assistant-workspace-heading"
              className="font-display text-base font-semibold text-[#F1F5F9]"
            >
              Environmental Guidance Workspace
            </h2>
            <p className="mt-0.5 text-xs text-[#8B9BB0]">
              Context ready: {snapshot.zoneName} · Sample AQI{' '}
              <span className="font-mono text-[#CBD5E1] tabular-nums">
                {snapshot.demoAqi}
              </span>{' '}
              · Dominant {snapshot.dominantPollutant}
            </p>
          </div>

          {entries.length > 0 ? (
            <button
              type="button"
              onClick={() => setEntries([])}
              className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-xl border border-[#253344] bg-[#0D1219] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] transition-colors hover:border-[#384A61] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear Thread</span>
            </button>
          ) : null}
        </div>

        {/* Stage 1 Architecture Notice (Honest, Zero Fake AI) */}
        <div className="border-b border-[#1E2936] bg-[#0D1219] px-5 py-3.5 sm:px-6">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 text-[#2DD4BF] shrink-0" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              <strong className="font-medium text-[#E2E8F0]">Stage 1 Frontend Ready:</strong>{' '}
              No simulated AI responses are generated here. Submitting a prompt previews the exact structured payload prepared for the secure server-side Gemini endpoint (<span className="font-mono text-[#CBD5E1]">{STAGE_2_ENDPOINTS.assistant}</span>) in Stage 2.
            </p>
          </div>
        </div>

        {/* Thread Area */}
        <div className="flex-1 space-y-5 p-5 sm:p-6 min-h-[300px]">
          {entries.length === 0 ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#253344] bg-[#0D1219] text-[#2DD4BF]">
                <MessageSquareText className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#F1F5F9]">
                No prompts drafted yet
              </h3>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#94A3B8]">
                Select a starter question or type your own below to test the assistant layout and inspect the grounded district context contract.
              </p>
            </div>
          ) : (
            <div className="space-y-6" aria-live="polite">
              {entries.map((entry) => {
                const payloadOpen = Boolean(expandedPayloadIds[entry.id]);
                return (
                  <article key={entry.id} className="space-y-3">
                    {/* User Prompt */}
                    <div className="ml-auto max-w-xl rounded-2xl border border-[#253344] bg-[#15222E] px-4 py-3">
                      <p className="text-xs text-[#8B9BB0]">Your Question · {entry.createdAtLabel}</p>
                      <p className="mt-1 text-sm leading-relaxed text-[#F1F5F9]">
                        {entry.question}
                      </p>
                    </div>

                    {/* Honest Stage 1 Integration Notice (No Fabricated AI Text) */}
                    <div className="max-w-2xl rounded-2xl border border-[#1E2936] bg-[#0D1219] p-4 sm:p-5">
                      <p className="text-xs font-medium text-[#2DD4BF]">
                        {entry.noticeTitle}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#CBD5E1]">
                        {entry.noticeBody}
                      </p>

                      <div className="mt-4 border-t border-[#1E2936] pt-3">
                        <button
                          type="button"
                          onClick={() => togglePayload(entry.id)}
                          aria-expanded={payloadOpen}
                          className="inline-flex min-h-[36px] items-center gap-2 text-xs font-medium text-[#94A3B8] transition-colors hover:text-[#F1F5F9] cursor-pointer"
                        >
                          <Code2 className="h-3.5 w-3.5 text-[#2DD4BF]" aria-hidden="true" />
                          <span>
                            {payloadOpen
                              ? 'Hide planned Stage 2 API payload'
                              : 'Inspect planned Stage 2 API payload'}
                          </span>
                          {payloadOpen ? (
                            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </button>

                        {payloadOpen ? (
                          <pre className="mt-3 overflow-x-auto rounded-xl border border-[#1E2936] bg-[#090D12] p-3.5 font-mono text-xs leading-relaxed text-[#CBD5E1]">
                            {JSON.stringify(entry.plannedRequest, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Accessible Prompt Composer */}
        <form
          onSubmit={handleFormSubmit}
          className="border-t border-[#1E2936] p-4 sm:p-5"
        >
          <label htmlFor="assistant-composer-input" className="sr-only">
            Ask an environmental or air quality question
          </label>
          <div className="flex items-center gap-2.5">
            <input
              id="assistant-composer-input"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about pollutants, outdoor timing, or health guidance..."
              className="min-h-[46px] flex-1 rounded-xl border border-[#253344] bg-[#0D1219] px-4 text-sm text-[#F1F5F9] placeholder-[#64748B] focus:border-[#2DD4BF] focus:outline-none"
            />
            <button
              type="submit"
              disabled={input.trim().length === 0}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-4 text-sm font-semibold text-[#041312] transition-colors duration-150 hover:bg-[#2DD4BF] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Preview Prompt</span>
            </button>
          </div>
        </form>
      </section>

      {/* Starter Prompt Library & Integration Architecture Notes */}
      <aside className="lg:col-span-4 space-y-6">
        <section
          aria-labelledby="starter-prompts-heading"
          className="rounded-2xl border border-[#1E2936] bg-[#111720] p-5 sm:p-6"
        >
          <h2
            id="starter-prompts-heading"
            className="font-display text-base font-semibold text-[#F1F5F9]"
          >
            Suggested Prompts
          </h2>
          <p className="mt-1 text-xs text-[#8B9BB0]">
            Tap any question to test prompt framing with current district metadata
          </p>

          <div className="mt-4 divide-y divide-[#1E2936]">
            {ASSISTANT_PROMPT_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => submitQuestion(template.prompt)}
                className="block min-h-[56px] w-full py-3.5 text-left transition-colors hover:text-[#2DD4BF] first:pt-1 last:pb-1 cursor-pointer"
              >
                <p className="text-xs text-[#8B9BB0]">{template.category}</p>
                <p className="mt-0.5 text-sm font-medium text-[#E2E8F0]">
                  {template.label}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#94A3B8]">
                  {template.prompt}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="stage2-contract-heading"
          className="rounded-2xl border border-[#1E2936] bg-[#111720] p-5 sm:p-6"
        >
          <h2
            id="stage2-contract-heading"
            className="font-display text-base font-semibold text-[#F1F5F9]"
          >
            Stage 2 Integration Boundary
          </h2>
          <dl className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-4 border-b border-[#1E2936] pb-2.5">
              <dt className="text-[#8B9BB0]">Planned Assistant Route</dt>
              <dd className="font-mono text-[#E2E8F0]">POST /api/assistant</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-[#1E2936] pb-2.5">
              <dt className="text-[#8B9BB0]">Planned AQI Proxy</dt>
              <dd className="font-mono text-[#E2E8F0]">GET /api/air-quality</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#8B9BB0]">Client API Keys</dt>
              <dd className="font-medium text-[#4ADE80]">None (Server-side only)</dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  );
}
