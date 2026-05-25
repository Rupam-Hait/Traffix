import { useCallback, useEffect, useMemo, useState } from 'react';
import localforage from 'localforage';
import { EDGES, edgeKey } from '../data/cityGraph';

const STORAGE_KEY = 'traffix:trafficMultipliers';

const createDefaultTraffic = () =>
  Object.fromEntries(EDGES.map((edge) => [edgeKey(edge.from, edge.to), 1]));

const createRandomTraffic = () =>
  Object.fromEntries(
    EDGES.map((edge) => {
      const burst = Math.random() > 0.72 ? 1.7 : 1;
      const value = Math.min(3, 1 + Math.random() * 1.4 * burst);
      return [edgeKey(edge.from, edge.to), Number(value.toFixed(2))];
    }),
  );

export default function useTrafficState() {
  const defaultTraffic = useMemo(createDefaultTraffic, []);
  const [trafficMultipliers, setTrafficMultipliers] = useState(defaultTraffic);
  const [trafficMode, setTrafficMode] = useState('manual');

  useEffect(() => {
    let mounted = true;
    localforage.getItem(STORAGE_KEY).then((saved) => {
      if (mounted && saved) {
        setTrafficMultipliers({ ...defaultTraffic, ...saved });
      }
    });
    return () => {
      mounted = false;
    };
  }, [defaultTraffic]);

  useEffect(() => {
    localforage.setItem(STORAGE_KEY, trafficMultipliers);
  }, [trafficMultipliers]);

  useEffect(() => {
    if (trafficMode !== 'chaos') return undefined;
    const interval = window.setInterval(() => {
      setTrafficMultipliers(createRandomTraffic());
    }, 5000);
    return () => window.clearInterval(interval);
  }, [trafficMode]);

  const setTraffic = useCallback((key, value) => {
    setTrafficMultipliers((current) => ({ ...current, [key]: Number(value) }));
  }, []);

  const randomizeTraffic = useCallback(() => {
    setTrafficMultipliers(createRandomTraffic());
  }, []);

  const clearTraffic = useCallback(() => {
    setTrafficMultipliers(createDefaultTraffic());
  }, []);

  return {
    trafficMultipliers,
    trafficMode,
    setTrafficMode,
    setTraffic,
    randomizeTraffic,
    clearTraffic,
  };
}
