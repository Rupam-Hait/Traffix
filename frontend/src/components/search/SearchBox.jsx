import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { searchPlaces } from '../../services/nominatim';

export default function SearchBox({ icon, label, onSelect, placeholder, value }) {
  const [query, setQuery] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 320);

  useEffect(() => {
    setQuery(value?.name || '');
  }, [value]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3 || debouncedQuery === value?.name) {
      setSuggestions([]);
      return;
    }

    let active = true;

    searchPlaces(debouncedQuery)
      .then((results) => {
        if (!active) return;
        setSuggestions(results);
        setIsOpen(true);
      })
      .catch(() => {
        if (active) setSuggestions([]);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery, value?.name]);

  function handleSelect(place) {
    onSelect(place);
    setQuery(place.name);
    setIsOpen(false);
    setSuggestions([]);
  }

  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-text-secondary">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-lg bg-surface-secondary px-4 py-3 border border-border transition focus-within:border-accent-red">
        <span className="text-lg text-text-secondary">{icon}</span>
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-text-primary outline-none placeholder:text-text-secondary"
        />
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            className="absolute left-0 right-0 top-[72px] z-50 max-h-56 overflow-auto rounded-lg bg-surface-secondary p-2 glass-panel border border-border"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            {suggestions.map((place) => (
              <button
                key={place.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(place)}
                className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-surface"
              >
                <span className="block text-sm font-semibold text-text-primary">{place.name}</span>
                <span className="mt-0.5 block truncate text-xs font-semibold text-text-secondary">{place.address}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
