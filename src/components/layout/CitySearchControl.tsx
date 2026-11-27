import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import {
  AirQualityServiceError,
  searchCities,
} from '../../services/airQualityService';
import type { CityLocation } from '../../types/airQuality';
import { formatCitySubtitle, formatCoordinates } from '../../utils/aqiHelpers';

interface CitySearchControlProps {
  onSelectCity: (city: CityLocation) => void;
  placeholder?: string;
  compact?: boolean;
}

export function CitySearchControl({
  onSelectCity,
  placeholder = 'Search any city worldwide...',
  compact = false,
}: CitySearchControlProps) {
  const inputId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const matches = await searchCities(trimmed, {
          signal: controller.signal,
          count: 6,
        });
        setResults(matches);
        setIsOpen(true);
      } catch (err) {
        if (err instanceof AirQualityServiceError && err.code === 'ABORTED') {
          return;
        }
        setResults([]);
        setSearchError(
          err instanceof Error
            ? err.message
            : 'Unable to search cities right now.'
        );
        setIsOpen(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleChoose = (city: CityLocation) => {
    onSelectCity(city);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSearchError(null);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={inputId} className="sr-only">
        Search cities using Open-Meteo Geocoding
      </label>
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-3 h-4 w-4 text-[#8B9BB0]"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-[#253344] bg-[#111720] pl-9 pr-9 text-sm text-[#F1F5F9] placeholder-[#64748B] transition-colors focus:border-[#2DD4BF] focus:outline-none ${
            compact ? 'min-h-[40px] py-1.5 text-xs' : 'min-h-[44px] py-2'
          }`}
        />

        {isSearching ? (
          <Loader2
            className="absolute right-3 h-4 w-4 animate-spin text-[#2DD4BF]"
            aria-label="Searching cities"
          />
        ) : query.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setSearchError(null);
              setIsOpen(false);
            }}
            aria-label="Clear city search"
            className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-[#8B9BB0] hover:text-[#F1F5F9] cursor-pointer"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isOpen && query.trim().length >= 2 ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="City search results"
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-[#253344] bg-[#111720] shadow-xl shadow-black/50"
        >
          {searchError ? (
            <div className="px-4 py-3 text-xs text-[#F87171]">
              {searchError}
            </div>
          ) : isSearching && results.length === 0 ? (
            <div className="px-4 py-3 text-xs text-[#8B9BB0]">
              Searching Open-Meteo Geocoding...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-xs text-[#8B9BB0]">
              No matching cities found for &ldquo;{query.trim()}&rdquo;.
            </div>
          ) : (
            <ul className="divide-y divide-[#1E2936]">
              {results.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => handleChoose(city)}
                    className="flex min-h-[48px] w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#15222E] cursor-pointer"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <MapPin
                        className="h-4 w-4 shrink-0 text-[#2DD4BF]"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#F1F5F9]">
                          {city.name}
                        </p>
                        <p className="truncate text-xs text-[#8B9BB0]">
                          {formatCitySubtitle(city)}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-[#8B9BB0] tabular-nums shrink-0">
                      {formatCoordinates(city.latitude, city.longitude)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
