'use client';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type {
  Map as GLMap,
  GeoJSONSource,
  MapLayerMouseEvent,
} from 'maplibre-gl';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Wind,
  CloudRain,
  ArrowUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { Facility } from './facilities';
import { stormFrame, demoStatus } from '@/lib/demo-storm';
const SOURCE = 'fictional-facilities',
  LAYER = 'fictional-status',
  HALO = 'fictional-halo';
export function DemoTimeline({
  mapRef,
  facilities,
  lang,
  onClose,
}: {
  mapRef: RefObject<GLMap | null>;
  facilities: Facility[];
  lang: 'en' | 'es';
  onClose: () => void;
}) {
  const es = lang === 'es';
  const [hour, setHour] = useState(0),
    [playing, setPlaying] = useState(false),
    [weather, setWeather] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [error, setError] = useState('');
  const time = useRef(0),
    canvas = useRef<HTMLCanvasElement>(null);
  const state = stormFrame(hour),
    frameState = useRef(state);
  frameState.current = state;
  const sorted = useMemo(
    () =>
      [...facilities].sort((a, b) =>
        a.properties.id.localeCompare(b.properties.id),
      ),
    [facilities],
  );
  const simulated = useMemo(
    () =>
      sorted.map((f, i) => ({
        type: 'Feature' as const,
        geometry: f.geometry,
        properties: {
          id: f.properties.id,
          name: f.properties.name,
          demoStatus: demoStatus(i, hour),
          demo: true,
        },
      })),
    [sorted, hour],
  );
  const counts = { online: 0, standby: 0, offline: 0 };
  for (const f of simulated) counts[f.properties.demoStatus]++;
  const labels = es
    ? {
        online: 'Operativa',
        standby: 'En espera',
        offline: 'Fuera de servicio',
      }
    : { online: 'Online', standby: 'Standby', offline: 'Offline' };
  const phases = es
    ? {
        approach: 'Aproximación',
        peak: 'Pico de la tormenta',
        recovery: 'Recuperación',
      }
    : { approach: 'Approach', peak: 'Storm peak', recovery: 'Recovery' };
  const jump = (value: number) => {
    time.current = value;
    setHour(value);
    setPlaying(false);
  };
  useEffect(() => {
    setWeather(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let id = 0,
      last = performance.now();
    const tick = (now: number) => {
      if (now - last >= 80) {
        const next = Math.min(24, time.current + (now - last) / 2500);
        last = now;
        time.current = next;
        setHour(next);
        if (next === 24) {
          setPlaying(false);
          return;
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        setPlaying(false);
        setWeather(false);
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('visibilitychange', hide);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      document.removeEventListener('keydown', key);
    };
  }, [onClose]);
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const visibility =
      m.getLayoutProperty('facility-points', 'visibility') || 'visible';
    const pick = (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id;
      if (id) setSelected(String(id));
    };
    try {
      m.addSource(SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      const color = [
        'match',
        ['get', 'demoStatus'],
        'online',
        '#b7f578',
        'standby',
        '#ffcc70',
        '#ff6488',
      ] as const;
      m.addLayer({
        id: HALO,
        type: 'circle',
        source: SOURCE,
        paint: {
          'circle-radius': 19,
          'circle-color': color as never,
          'circle-opacity': 0.18,
          'circle-blur': 0.35,
        },
      });
      m.addLayer({
        id: LAYER,
        type: 'circle',
        source: SOURCE,
        paint: {
          'circle-radius': 8,
          'circle-color': color as never,
          'circle-stroke-color': '#0a2332',
          'circle-stroke-width': 2,
        },
      });
      m.setLayoutProperty('facility-points', 'visibility', 'none');
      m.on('click', LAYER, pick);
    } catch {
      setError('Demo markers could not load.');
    }
    return () => {
      m.off('click', LAYER, pick);
      for (const id of [LAYER, HALO]) if (m.getLayer(id)) m.removeLayer(id);
      if (m.getSource(SOURCE)) m.removeSource(SOURCE);
      if (m.getLayer('facility-points'))
        m.setLayoutProperty('facility-points', 'visibility', visibility);
    };
  }, [mapRef]);
  useEffect(() => {
    const m = mapRef.current;
    (m?.getSource(SOURCE) as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: simulated,
    });
  }, [simulated, mapRef]);
  useEffect(() => {
    if (!weather || !canvas.current) return;
    const element = canvas.current,
      ctx = element.getContext('2d');
    if (!ctx) return;
    let id = 0,
      previous = 0,
      w = 1,
      h = 1;
    const resize = () => {
      const rect = element.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      element.width = w;
      element.height = h;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const particles = Array.from({ length: 120 }, (_, i) => ({
      x: (i * 0.618) % 1,
      y: (i * 0.381) % 1,
    }));
    const draw = (now: number) => {
      if (now - previous > 40) {
        const delta = Math.min(100, now - previous);
        previous = now;
        ctx.clearRect(0, 0, w, h);
        const s = frameState.current,
          count = Math.round((s.rain / 75) * 120),
          drift = Math.sin((s.direction * Math.PI) / 180) * 0.18;
        ctx.strokeStyle = 'rgba(152,222,250,.42)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const p = particles[i];
          p.y = (p.y + delta * 0.00045) % 1;
          p.x = (p.x + delta * 0.00004 * drift + 1) % 1;
          ctx.moveTo(p.x * w, p.y * h);
          ctx.lineTo(p.x * w + drift * 22, p.y * h + 13);
        }
        ctx.stroke();
      }
      id = requestAnimationFrame(draw);
    };
    id = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(id);
      observer.disconnect();
      ctx.clearRect(0, 0, w, h);
    };
  }, [weather]);
  const focus = simulated.find((f) => f.properties.id === selected);
  return (
    <>
      {weather && (
        <canvas ref={canvas} className="storm-weather" aria-hidden="true" />
      )}
      <section
        className="storm-dashboard"
        aria-label={es ? 'Panel de demostración' : 'Demo dashboard'}
      >
        <div className="storm-heading">
          <span className="demo-badge">
            {es ? 'DATOS DE DEMOSTRACIÓN' : 'DEMO DATA'}
          </span>
          <Button
            variant="ghost"
            onClick={onClose}
            aria-label={es ? 'Cerrar demostración' : 'Close demo'}
          >
            <X size={20} />
          </Button>
        </div>
        <p className="eyebrow">
          {es ? 'TORMENTA FICTICIA / 24 HORAS' : 'FICTIONAL STORM / 24 HOURS'}
        </p>
        <h2>{phases[state.phase as keyof typeof phases]}</h2>
        <div className="storm-metrics">
          <div>
            <CloudRain size={22} />
            <strong>
              {state.rain}
              <small> mm/h</small>
            </strong>
            <span>{es ? 'Lluvia simulada' : 'Simulated rain'}</span>
          </div>
          <div>
            <Wind size={22} />
            <strong>
              {state.wind}
              <small> km/h</small>
            </strong>
            <span>{es ? 'Viento simulado' : 'Simulated wind'}</span>
          </div>
        </div>
        <div className="storm-wind">
          <ArrowUp
            size={24}
            style={{ transform: `rotate(${state.direction}deg)` }}
          />
          <span>
            {es ? 'Dirección visual del flujo' : 'Visual flow direction'} ·{' '}
            {state.direction}°
          </span>
        </div>
        <h3>
          {es
            ? 'Instalaciones · estado ficticio'
            : 'Facilities · fictional status'}
        </h3>
        <div className="storm-counts">
          {Object.entries(counts).map(([key, value]) => (
            <div key={key} className={'storm-' + key}>
              <strong>{value}</strong>
              <span>{labels[key as keyof typeof labels]}</span>
            </div>
          ))}
        </div>
        <p>
          {es
            ? 'Seleccione un marcador de color para inspeccionar su estado de demostración.'
            : 'Select a colored marker to inspect its demo status.'}
        </p>
        {focus && (
          <div className="storm-selected" aria-live="polite">
            <strong>{focus.properties.name}</strong>
            <p>
              {labels[focus.properties.demoStatus]} ·{' '}
              {es ? 'Solo en esta ficción' : 'Only in this fiction'}
            </p>
          </div>
        )}
        <label className="storm-weather-toggle">
          {es ? 'Efecto de lluvia' : 'Rain effect'}
          <Switch checked={weather} onCheckedChange={setWeather} />
        </label>
        <p className="storm-disclaimer">
          {es
            ? 'Valores inventados para presentación. No son pronósticos ni reportes operativos. Los estados se asignan por guion, no por exposición. Los registros reales no cambian.'
            : 'Invented values for presentation. Not forecasts or operational reports. Status follows a script, not exposure. Real records do not change.'}
        </p>
        {error && <p role="alert">{error}</p>}
      </section>
      <section
        className="storm-timeline"
        aria-label={es ? 'Cronología de demostración' : 'Demo timeline'}
      >
        <div className="storm-transport">
          <Button
            onClick={() => {
              if (!playing && hour >= 24) {
                time.current = 0;
                setHour(0);
              }
              setPlaying((v) => !v);
            }}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}{' '}
            {playing
              ? es
                ? 'Pausar'
                : 'Pause'
              : es
                ? 'Reproducir demo'
                : 'Play demo'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => jump(0)}
            aria-label={es ? 'Reiniciar' : 'Restart'}
          >
            <RotateCcw size={17} />
          </Button>
          <strong>
            H+{Math.floor(hour).toString().padStart(2, '0')}:
            {Math.floor((hour % 1) * 60)
              .toString()
              .padStart(2, '0')}
          </strong>
          <span className="demo-badge">
            {es ? 'TIEMPO FICTICIO' : 'FICTIONAL TIME'}
          </span>
        </div>
        <Slider
          aria-label={
            es ? 'Hora de la tormenta ficticia' : 'Fictional storm hour'
          }
          min={0}
          max={24}
          step={0.1}
          value={[hour]}
          onValueChange={(v) => jump(Array.isArray(v) ? v[0] : v)}
        />
        <div className="storm-stages">
          <button
            onClick={() => jump(0)}
            aria-current={state.phase === 'approach' ? 'step' : undefined}
          >
            00–08 · {phases.approach}
          </button>
          <button
            onClick={() => jump(12)}
            aria-current={state.phase === 'peak' ? 'step' : undefined}
          >
            08–16 · {phases.peak}
          </button>
          <button
            onClick={() => jump(20)}
            aria-current={state.phase === 'recovery' ? 'step' : undefined}
          >
            16–24 · {phases.recovery}
          </button>
        </div>
      </section>
    </>
  );
}
