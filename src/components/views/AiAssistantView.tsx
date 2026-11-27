import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Code2,
  Info,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import { ASSISTANT_PROMPT_TEMPLATES } from '../../data/demonstrationData';
import {
  askAirQualityAssistant,
  AssistantClientError,
  buildAssistantRequestPayload,
} from '../../services/assistantService';
import type {
  AirQualitySnapshot,
  AqiStandard,
  AssistantThreadEntry,
} from '../../types/airQuality';
import {
  formatLastUpdated,
  formatModelTimestamp,
  getStandardLabel,
  getStandardShortLabel,
} from '../../utils/aqiHelpers';

interface AiAssistantViewProps {
  snapshot: AirQualitySnapshot;
  aqiStandard: AqiStandard;
  initialPrompt?: string;
  onConsumeInitialPrompt: () => void;
}

const MAX_QUESTION_CHARS = 600;

/**
 * Safely renders plain-text assistant responses into semantic paragraphs and bullet lists
 * without using dangerouslySetInnerHTML or raw HTML injection.
 */
function SafeAssistantText({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-[#E2E8F0]">
      {blocks.map((block, blockIndex) => {
        const lines = block
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

        const isBulletList =
          lines.length > 0 && lines.every((line) => /^[-*•]\s+/.test(line));

        if (isBulletList) {
          return (
            <ul
              key={`block-${blockIndex}`}
              className="list-disc space-y-1.5 pl-5 text-[#CBD5E1]"
            >
              {lines.map((line, lineIndex) => (
                <li key={`item-${lineIndex}`}>
                  {line.replace(/^[-*•]\s+/, '')}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`block-${blockIndex}`} className="whitespace-pre-line">
            {block}
          </p>
        );
      })}
    </div>
  );
}

export function AiAssistantView({
  snapshot,
  aqiStandard,
  initialPrompt,
  onConsumeInitialPrompt,
}: AiAssistantViewProps) {
  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<AssistantThreadEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedPayloadIds, setExpandedPayloadIds] = useState<
    Record<string, boolean>
  >({});

  const activeAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      activeAbortRef.current?.abort();
    };
  }, []);

  const executeQuestion = useCallback(
    async (questionText: string, existingEntryId?: string) => {
      const trimmed = questionText.trim();
      if (!trimmed || trimmed.length > MAX_QUESTION_CHARS) {
        return;
      }

      activeAbortRef.current?.abort();
      const controller = new AbortController();
      activeAbortRef.current = controller;

      const payload = buildAssistantRequestPayload(
        trimmed,
        snapshot,
        aqiStandard
      );
      const entryId =
        existingEntryId ??
        `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const loadingEntry: AssistantThreadEntry = {
        id: entryId,
        question: trimmed,
        createdAtIso: new Date().toISOString(),
        status: 'loading',
        requestPayload: payload,
      };

      setEntries((prev) =>
        existingEntryId
          ? prev.map((item) => (item.id === existingEntryId ? loadingEntry : item))
          : [...prev, loadingEntry]
      );
      setIsSubmitting(true);
      setInput('');

      try {
        const result = await askAirQualityAssistant(payload, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setEntries((prev) =>
          prev.map((item) =>
            item.id === entryId
              ? {
                  ...item,
                  status: 'success',
                  answer: result.answer,
                  model: result.model,
                  generatedAtIso: result.generatedAtIso,
                }
              : item
          )
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        const message =
          error instanceof AssistantClientError
            ? error.message
            : 'Unable to reach the server-side Gemini assistant.';
        const code =
          error instanceof AssistantClientError ? error.code : 'UNKNOWN_ERROR';
        const retryAfterSeconds =
          error instanceof AssistantClientError
            ? error.retryAfterSeconds
            : undefined;

        setEntries((prev) =>
          prev.map((item) =>
            item.id === entryId
              ? {
                  ...item,
                  status: 'error',
                  errorCode: code,
                  errorMessage: message,
                  retryAfterSeconds,
                }
              : item
          )
        );
      } finally {
        if (activeAbortRef.current === controller) {
          activeAbortRef.current = null;
          setIsSubmitting(false);
        }
      }
    },
    [aqiStandard, snapshot]
  );

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      onConsumeInitialPrompt();
      void executeQuestion(initialPrompt);
    }
  }, [executeQuestion, initialPrompt, onConsumeInitialPrompt]);

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    void executeQuestion(input);
  };

  const handleClearThread = () => {
    activeAbortRef.current?.abort();
    setIsSubmitting(false);
    setEntries([]);
  };

  const togglePayload = (id: string) => {
    setExpandedPayloadIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const activeAqi =
    aqiStandard === 'european' ? snapshot.europeanAqi : snapshot.usAqi;
  const remainingChars = MAX_QUESTION_CHARS - input.length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Main Conversational Workspace */}
      <section
        aria-labelledby="assistant-workspace-heading"
        className="lg:col-span-8 flex flex-col rounded-2xl border border-[#1E2936] bg-[#111720]"
      >
        <div className="flex flex-col gap-2 border-b border-[#1E2936] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2
              id="assistant-workspace-heading"
              className="font-display text-base font-semibold text-[#F1F5F9]"
            >
              Gemini Environmental Guidance
            </h2>
            <p className="mt-0.5 text-xs text-[#8B9BB0]">
              Grounded context: {snapshot.location.name} ·{' '}
              {getStandardShortLabel(aqiStandard)}{' '}
              <span className="font-mono text-[#CBD5E1] tabular-nums">
                {activeAqi ?? '—'}
              </span>{' '}
              · Model time{' '}
              <span className="font-mono text-[#CBD5E1] tabular-nums">
                {formatModelTimestamp(
                  snapshot.modelTimeIso,
                  snapshot.timezoneAbbreviation
                )}
              </span>
            </p>
          </div>

          {entries.length > 0 ? (
            <button
              type="button"
              onClick={handleClearThread}
              className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-xl border border-[#253344] bg-[#0D1219] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] transition-colors hover:border-[#384A61] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear Thread</span>
            </button>
          ) : null}
        </div>

        <div className="border-b border-[#1E2936] bg-[#0D1219] px-5 py-3.5 sm:px-6">
          <div className="flex items-start gap-3">
            <Info
              className="mt-0.5 h-4 w-4 text-[#2DD4BF] shrink-0"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              Questions are sent to the server-side{' '}
              <span className="font-mono text-[#CBD5E1]">/api/assistant</span>{' '}
              endpoint together with {snapshot.location.name}&apos;s live Open-Meteo model readings, pollutant units, and 24-hour/5-day forecast. Guidance is based on atmospheric model estimates—not physical monitoring stations or CPCB sensors.
            </p>
          </div>
        </div>

        {/* Thread Area */}
        <div className="flex-1 space-y-6 p-5 sm:p-6 min-h-[320px]">
          {entries.length === 0 ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#253344] bg-[#0D1219] text-[#2DD4BF]">
                <MessageSquareText className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#F1F5F9]">
                Ask about {snapshot.location.name}&apos;s air quality
              </h3>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#94A3B8]">
                Select a starter prompt or write your own question to receive Gemini guidance grounded in the current {getStandardLabel(aqiStandard)} snapshot and 5-day forecast.
              </p>
            </div>
          ) : (
            <div className="space-y-6" aria-live="polite">
              {entries.map((entry) => {
                const payloadOpen = Boolean(expandedPayloadIds[entry.id]);

                return (
                  <article key={entry.id} className="space-y-3">
                    {/* User Question */}
                    <div className="ml-auto max-w-xl rounded-2xl border border-[#253344] bg-[#15222E] px-4 py-3">
                      <p className="text-xs text-[#8B9BB0]">
                        Your Question ·{' '}
                        <span className="font-mono tabular-nums">
                          {formatLastUpdated(entry.createdAtIso)}
                        </span>
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-[#F1F5F9]">
                        {entry.question}
                      </p>
                    </div>

                    {/* Loading State */}
                    {entry.status === 'loading' ? (
                      <div
                        aria-busy="true"
                        className="max-w-2xl rounded-2xl border border-[#1E2936] bg-[#0D1219] p-4 sm:p-5"
                      >
                        <div className="flex items-center gap-2.5 text-xs font-medium text-[#2DD4BF]">
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                          <span>
                            Analyzing {entry.requestPayload.location.name} Open-Meteo data via server-side Gemini...
                          </span>
                        </div>
                        <div className="mt-3 space-y-2 animate-pulse">
                          <div className="h-3.5 w-11/12 rounded bg-[#161F2B]" />
                          <div className="h-3.5 w-4/5 rounded bg-[#161F2B]" />
                          <div className="h-3.5 w-3/5 rounded bg-[#161F2B]" />
                        </div>
                      </div>
                    ) : null}

                    {/* Real Gemini Response */}
                    {entry.status === 'success' && entry.answer ? (
                      <div className="max-w-2xl rounded-2xl border border-[#1E2936] bg-[#0D1219] p-4 sm:p-5">
                        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8B9BB0]">
                          <span className="font-medium text-[#2DD4BF]">
                            Gemini Guidance
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {entry.requestPayload.location.name} ({getStandardShortLabel(entry.requestPayload.aqiStandard)})
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Model-based Open-Meteo input</span>
                        </div>

                        <SafeAssistantText text={entry.answer} />

                        <div className="mt-4 border-t border-[#1E2936] pt-3">
                          <button
                            type="button"
                            onClick={() => togglePayload(entry.id)}
                            aria-expanded={payloadOpen}
                            className="inline-flex min-h-[36px] items-center gap-2 text-xs font-medium text-[#94A3B8] transition-colors hover:text-[#F1F5F9] cursor-pointer"
                          >
                            <Code2
                              className="h-3.5 w-3.5 text-[#2DD4BF]"
                              aria-hidden="true"
                            />
                            <span>
                              {payloadOpen
                                ? 'Hide sent Open-Meteo context'
                                : 'Inspect sent Open-Meteo context'}
                            </span>
                            {payloadOpen ? (
                              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                          </button>

                          {payloadOpen ? (
                            <pre className="mt-3 overflow-x-auto rounded-xl border border-[#1E2936] bg-[#090D12] p-3.5 font-mono text-xs leading-relaxed text-[#CBD5E1]">
                              {JSON.stringify(entry.requestPayload, null, 2)}
                            </pre>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {/* Honest Error State (Zero Fake Fallback Answers) */}
                    {entry.status === 'error' ? (
                      <div
                        role="alert"
                        className="max-w-2xl rounded-2xl border border-[#EF4444]/35 bg-[#191116] p-4 sm:p-5"
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            className="mt-0.5 h-4 w-4 shrink-0 text-[#F87171]"
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#FCA5A5]">
                              Unable to retrieve Gemini response
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-[#E2E8F0]">
                              {entry.errorMessage}
                            </p>
                            {entry.errorCode ? (
                              <p className="mt-2 font-mono text-xs text-[#94A3B8]">
                                Error code: {entry.errorCode}
                                {entry.retryAfterSeconds
                                  ? ` · Retry after ${entry.retryAfterSeconds}s`
                                  : ''}
                              </p>
                            ) : null}
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() =>
                                  void executeQuestion(entry.question, entry.id)
                                }
                                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#384A61] bg-[#111720] px-3 py-1.5 text-xs font-medium text-[#F1F5F9] transition-colors hover:border-[#2DD4BF] hover:text-[#2DD4BF] disabled:opacity-50 cursor-pointer"
                              >
                                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Retry Request</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => togglePayload(entry.id)}
                                className="inline-flex min-h-[38px] items-center gap-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] cursor-pointer"
                              >
                                <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>
                                  {payloadOpen ? 'Hide payload' : 'Inspect payload'}
                                </span>
                              </button>
                            </div>
                            {payloadOpen ? (
                              <pre className="mt-3 overflow-x-auto rounded-xl border border-[#1E2936] bg-[#090D12] p-3.5 font-mono text-xs leading-relaxed text-[#CBD5E1]">
                                {JSON.stringify(entry.requestPayload, null, 2)}
                              </pre>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
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
              maxLength={MAX_QUESTION_CHARS}
              value={input}
              disabled={isSubmitting}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Ask about ${snapshot.location.name} pollutants, outdoor timing, or forecast...`}
              className="min-h-[46px] flex-1 rounded-xl border border-[#253344] bg-[#0D1219] px-4 text-sm text-[#F1F5F9] placeholder-[#64748B] focus:border-[#2DD4BF] focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSubmitting || input.trim().length === 0}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-4 text-sm font-semibold text-[#041312] transition-colors duration-150 hover:bg-[#2DD4BF] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {isSubmitting ? 'Sending...' : 'Ask Assistant'}
              </span>
            </button>
          </div>
          {input.length > MAX_QUESTION_CHARS - 80 ? (
            <p className="mt-1.5 text-right font-mono text-[11px] text-[#8B9BB0] tabular-nums">
              {remainingChars} characters remaining
            </p>
          ) : null}
        </form>
      </section>

      {/* Starter Prompt Library & Server Integration Summary */}
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
            Send a grounded question using {snapshot.location.name}&apos;s live Open-Meteo metrics
          </p>

          <div className="mt-4 divide-y divide-[#1E2936]">
            {ASSISTANT_PROMPT_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                disabled={isSubmitting}
                onClick={() => void executeQuestion(template.prompt)}
                className="block min-h-[56px] w-full py-3.5 text-left transition-colors hover:text-[#2DD4BF] disabled:opacity-50 first:pt-1 last:pb-1 cursor-pointer"
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
            Backend Integration
          </h2>
          <dl className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-4 border-b border-[#1E2936] pb-2.5">
              <dt className="text-[#8B9BB0]">Air Quality Data</dt>
              <dd className="font-mono text-[#E2E8F0]">Open-Meteo (Model)</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-[#1E2936] pb-2.5">
              <dt className="text-[#8B9BB0]">Assistant Route</dt>
              <dd className="font-mono text-[#2DD4BF]">POST /api/assistant</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-[#1E2936] pb-2.5">
              <dt className="text-[#8B9BB0]">Netlify Target</dt>
              <dd className="font-mono text-[#E2E8F0]">functions/assistant</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#8B9BB0]">API Key Scope</dt>
              <dd className="font-medium text-[#4ADE80]">Server-side only</dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  );
}
