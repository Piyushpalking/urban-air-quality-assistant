import { AlertTriangle, CloudOff, RefreshCw, RotateCcw } from 'lucide-react';
import type { NavView } from '../../types/airQuality';

interface EmptyStateProps {
  title: string;
  description: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyStatePanel({
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-[#1E2936] bg-[#111720] px-6 py-12 sm:px-10 sm:py-16 text-center"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#253344] bg-[#0D1219] text-[#94A3B8]">
        <CloudOff className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-[#F1F5F9]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#94A3B8]">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPrimaryAction}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-5 py-2.5 text-sm font-semibold text-[#041312] transition-colors duration-150 hover:bg-[#2DD4BF] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>{primaryActionLabel}</span>
        </button>
        {secondaryActionLabel && onSecondaryAction ? (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#253344] bg-[#0D1219] px-5 py-2.5 text-sm font-medium text-[#E2E8F0] transition-colors duration-150 hover:border-[#384A61] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

interface ErrorStateProps {
  title: string;
  description: string;
  errorCode?: string;
  onRetry: () => void;
  onShowDemo?: () => void;
}

export function ErrorStatePanel({
  title,
  description,
  errorCode,
  onRetry,
  onShowDemo,
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      aria-live="polite"
      className="rounded-2xl border border-[#EF4444]/35 bg-[#111720] px-6 py-10 sm:px-10 sm:py-12"
    >
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#EF4444]/30 bg-[#1B1217] text-[#F87171]">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-[#F1F5F9]">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">{description}</p>
        {errorCode ? (
          <p className="mt-3 font-mono text-xs text-[#94A3B8]">
            Reference: <span className="text-[#CBD5E1]">{errorCode}</span>
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-5 py-2.5 text-sm font-semibold text-[#041312] transition-colors duration-150 hover:bg-[#2DD4BF] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Retry Connection</span>
          </button>
          {onShowDemo ? (
            <button
              type="button"
              onClick={onShowDemo}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#253344] bg-[#0D1219] px-5 py-2.5 text-sm font-medium text-[#E2E8F0] transition-colors duration-150 hover:border-[#384A61] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              Return to Demo Layout
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

interface LoadingSkeletonProps {
  view: NavView;
}

export function ViewLoadingSkeleton({ view }: LoadingSkeletonProps) {
  if (view === 'map') {
    return (
      <div
        aria-busy="true"
        aria-label="Loading pollution map layout"
        className="space-y-6 animate-pulse"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 rounded-2xl border border-[#1E2936] bg-[#111720] p-5">
            <div className="h-5 w-48 rounded bg-[#1E2936]" />
            <div className="mt-4 h-[340px] sm:h-[420px] w-full rounded-xl bg-[#161F2B]" />
          </div>
          <div className="lg:col-span-4 rounded-2xl border border-[#1E2936] bg-[#111720] p-5 space-y-4">
            <div className="h-5 w-36 rounded bg-[#1E2936]" />
            <div className="h-14 w-28 rounded bg-[#161F2B]" />
            <div className="space-y-3 pt-4 border-t border-[#1E2936]">
              <div className="h-4 w-full rounded bg-[#161F2B]" />
              <div className="h-4 w-5/6 rounded bg-[#161F2B]" />
              <div className="h-4 w-2/3 rounded bg-[#161F2B]" />
            </div>
            <div className="h-11 w-full rounded-xl bg-[#1E2936]" />
          </div>
        </div>
      </div>
    );
  }

  if (view === 'assistant') {
    return (
      <div
        aria-busy="true"
        aria-label="Loading AI assistant workspace"
        className="grid grid-cols-1 gap-6 lg:grid-cols-12 animate-pulse"
      >
        <div className="lg:col-span-8 rounded-2xl border border-[#1E2936] bg-[#111720] p-6 space-y-5">
          <div className="h-5 w-52 rounded bg-[#1E2936]" />
          <div className="h-4 w-80 max-w-full rounded bg-[#161F2B]" />
          <div className="h-48 w-full rounded-xl bg-[#161F2B]" />
          <div className="h-12 w-full rounded-xl bg-[#1E2936]" />
        </div>
        <div className="lg:col-span-4 rounded-2xl border border-[#1E2936] bg-[#111720] p-6 space-y-4">
          <div className="h-5 w-40 rounded bg-[#1E2936]" />
          <div className="h-16 w-full rounded-xl bg-[#161F2B]" />
          <div className="h-16 w-full rounded-xl bg-[#161F2B]" />
          <div className="h-16 w-full rounded-xl bg-[#161F2B]" />
        </div>
      </div>
    );
  }

  if (view === 'insights') {
    return (
      <div
        aria-busy="true"
        aria-label="Loading environmental insights"
        className="space-y-6 animate-pulse"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-[#1E2936] bg-[#111720] p-5 space-y-3"
            >
              <div className="h-3.5 w-28 rounded bg-[#1E2936]" />
              <div className="h-5 w-5/6 rounded bg-[#161F2B]" />
              <div className="h-14 w-full rounded bg-[#161F2B]" />
              <div className="pt-3 border-t border-[#1E2936] h-4 w-3/4 rounded bg-[#1E2936]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Dashboard skeleton matching exact desktop/mobile geometry
  return (
    <div
      aria-busy="true"
      aria-label="Loading dashboard layout"
      className="space-y-6 animate-pulse"
    >
      <div className="rounded-2xl border border-[#1E2936] bg-[#111720] p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="h-4 w-48 rounded bg-[#1E2936]" />
            <div className="h-14 w-32 rounded bg-[#161F2B]" />
            <div className="h-4 w-72 max-w-full rounded bg-[#161F2B]" />
          </div>
          <div className="h-28 w-44 rounded-xl bg-[#161F2B]" />
        </div>
        <div className="mt-6 h-2.5 w-full rounded-full bg-[#161F2B]" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-[#1E2936] bg-[#111720] p-5 space-y-3"
          >
            <div className="h-4 w-16 rounded bg-[#1E2936]" />
            <div className="h-8 w-24 rounded bg-[#161F2B]" />
            <div className="h-1.5 w-full rounded-full bg-[#161F2B]" />
            <div className="h-3.5 w-32 rounded bg-[#1E2936]" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-[#1E2936] bg-[#111720] p-6 space-y-4">
          <div className="h-5 w-40 rounded bg-[#1E2936]" />
          <div className="h-44 w-full rounded-xl bg-[#161F2B]" />
        </div>
        <div className="lg:col-span-5 rounded-2xl border border-[#1E2936] bg-[#111720] p-6 space-y-4">
          <div className="h-5 w-44 rounded bg-[#1E2936]" />
          <div className="h-24 w-full rounded-xl bg-[#161F2B]" />
          <div className="h-11 w-full rounded-xl bg-[#1E2936]" />
        </div>
      </div>
    </div>
  );
}
