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
      <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.2em] text-clay/65">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-3xl bg-ivory/80 px-4 py-3 shadow-panel ring-1 ring-sage/70">
        <span className="text-lg text-clay/80">{icon}</span>
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-clay outline-none placeholder:text-clay/45"
        />
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            className="absolute left-0 right-0 top-[82px] z-50 max-h-56 overflow-auto rounded-3xl bg-ivory p-2 shadow-glass ring-1 ring-sage"
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
                className="w-full rounded-2xl px-3 py-3 text-left transition hover:bg-linen"
              >
                <span className="block text-sm font-black text-clay">{place.name}</span>
                <span className="mt-1 block truncate text-xs font-semibold text-clay/65">{place.address}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
