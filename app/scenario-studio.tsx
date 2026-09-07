'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Map as GLMap, StyleSpecification } from 'maplibre-gl';
import { Waves, X, Columns2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
const WATER = 'demo-water-volume';
const SURFACE = 'demo-water-surface';
export function ScenarioStudio({
  mapRef,
  lang,
  onClose,
}: {
  mapRef: RefObject<GLMap | null>;
  lang: 'en' | 'es';
  onClose: () => void;
}) {
  const es = lang === 'es';
  const [level, setLevel] = useState(0),
    [preset, setPreset] = useState('baseline'),
    [compare, setCompare] = useState(false),
    [split, setSplit] = useState(50),
    [animating, setAnimating] = useState(false),
    [compareReady, setCompareReady] = useState(false),
    [error, setError] = useState('');
  const baselineHost = useRef<HTMLDivElement>(null),
    clone = useRef<GLMap | null>(null),
    frame = useRef(0),
    height = useRef(0);
  const update = (value: number) => {
    height.current = value;
    setLevel(value);
  };
  const stop = () => {
    cancelAnimationFrame(frame.current);
    setAnimating(false);
  };
  const animate = (target: number, id: string) => {
    stop();
    setPreset(id);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      update(target);
      return;
    }
    const start = performance.now(),
      from = height.current;
    setAnimating(true);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 2600),
        ease = p * p * (3 - 2 * p);
      update(from + (target - from) * ease);
      if (p < 1) frame.current = requestAnimationFrame(tick);
      else setAnimating(false);
    };
    frame.current = requestAnimationFrame(tick);
  };
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    try {
      m.addLayer({
        id: WATER,
        type: 'fill-extrusion',
        source: 'flood',
        filter: ['==', ['get', 'SFHA_TF'], 'T'],
        paint: {
          'fill-extrusion-color': '#28c7e8',
          'fill-extrusion-opacity': 0,
          'fill-extrusion-height': 0,
          'fill-extrusion-base': 0,
          'fill-extrusion-vertical-gradient': false,
        },
      });
      m.addLayer({
        id: SURFACE,
        type: 'fill',
        source: 'flood',
        filter: ['==', ['get', 'SFHA_TF'], 'T'],
        paint: { 'fill-color': '#3cdeee', 'fill-opacity': 0 },
      });
    } catch {
      setError(
        es
          ? 'La capa ilustrativa no pudo cargar.'
          : 'The illustrative layer could not load.',
      );
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame.current);
        setAnimating(false);
      }
    };
    document.addEventListener('keydown', key);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(frame.current);
      document.removeEventListener('keydown', key);
      document.removeEventListener('visibilitychange', visibility);
      if (m.getLayer(SURFACE)) m.removeLayer(SURFACE);
      if (m.getLayer(WATER)) m.removeLayer(WATER);
    };
  }, [mapRef, onClose]);
  useEffect(() => {
    const m = mapRef.current;
    if (!m?.getLayer(WATER)) return;
    m.setPaintProperty(WATER, 'fill-extrusion-height', level);
    m.setPaintProperty(WATER, 'fill-extrusion-opacity', level > 0 ? 0.48 : 0);
    m.setPaintProperty(SURFACE, 'fill-opacity', level > 0 ? 0.1 : 0);
  }, [level, mapRef]);
  useEffect(() => {
    if (!compare || !baselineHost.current) return;
    let disposed = false;
    const main = mapRef.current;
    if (!main) return;
    setCompareReady(false);
    setError('');
    const sync = () => {
      const b = clone.current;
      if (b)
        b.jumpTo({
          center: main.getCenter(),
          zoom: main.getZoom(),
          bearing: main.getBearing(),
          pitch: main.getPitch(),
          padding: main.getPadding(),
        });
    };
    const resize = () => clone.current?.resize();
    let observer: ResizeObserver | undefined;
    void import('maplibre-gl')
      .then((ml) => {
        if (disposed || !baselineHost.current) return;
        const style = structuredClone(main.getStyle()) as StyleSpecification;
        style.layers = style.layers.filter(
          (l) => l.id !== WATER && l.id !== SURFACE,
        );
        const b = new ml.Map({
          container: baselineHost.current,
          style,
          center: main.getCenter(),
          zoom: main.getZoom(),
          bearing: main.getBearing(),
          pitch: main.getPitch(),
          interactive: false,
          attributionControl: false,
        });
        clone.current = b;
        b.on('load', () => {
          if (!disposed) {
            sync();
            setCompareReady(true);
          }
        });
        b.on('error', () => {
          if (!disposed)
            setError(
              es
                ? 'La comparación no pudo cargar todos sus datos. Puede desactivarla y seguir explorando.'
                : 'Comparison could not load all its data. Turn it off to continue with the scenario.',
            );
        });
        main.on('move', sync);
        observer = new ResizeObserver(resize);
        observer.observe(baselineHost.current);
      })
      .catch(() => {
        if (!disposed)
          setError(
            es ? 'Comparación no disponible.' : 'Comparison unavailable.',
          );
      });
    return () => {
      disposed = true;
      main.off('move', sync);
      observer?.disconnect();
      clone.current?.remove();
      clone.current = null;
    };
  }, [compare, mapRef, es]);
  const presets = [
    { id: 'baseline', name: es ? 'Hoy' : 'Today', value: 0 },
    { id: 'rain', name: es ? 'Lluvia intensa' : 'Heavy rainfall', value: 2.5 },
    { id: 'surge', name: es ? 'Marejada' : 'Coastal surge', value: 5 },
  ];
  return (
    <>
      {compare && (
        <div
          className="scenario-baseline"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
          aria-hidden="true"
        >
          <div ref={baselineHost} className="scenario-baseline-map" />
        </div>
      )}
      {compare && (
        <div className="scenario-divider" style={{ left: split + '%' }}>
          <button
            type="button"
            role="slider"
            aria-label={es ? 'Arrastrar divisor' : 'Drag comparison divider'}
            aria-valuemin={5}
            aria-valuemax={95}
            aria-valuenow={split}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
              const rect = e.currentTarget
                .closest('.atlas')!
                .getBoundingClientRect();
              setSplit(
                Math.max(
                  5,
                  Math.min(
                    95,
                    Math.round(((e.clientX - rect.left) / rect.width) * 100),
                  ),
                ),
              );
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                setSplit((v) =>
                  Math.max(
                    5,
                    Math.min(95, v + (e.key === 'ArrowRight' ? 1 : -1)),
                  ),
                );
              }
            }}
          >
            ↔
          </button>
        </div>
      )}
      <div className="scenario-labels">
        <span>
          {compare
            ? es
              ? 'BASE CARTOGRÁFICA'
              : 'MAPPED BASELINE'
            : es
              ? 'ESTUDIO DE ESCENARIOS'
              : 'SCENARIO STUDIO'}
        </span>
        <span className="scenario-demo">
          {es ? 'DEMO ILUSTRATIVA' : 'ILLUSTRATIVE DEMO'}
        </span>
      </div>
      <section
        className="scenario-panel"
        aria-label={es ? 'Estudio de escenarios' : 'Scenario studio'}
      >
        <div className="scenario-heading">
          <p className="eyebrow">
            {es ? 'EXPLORAR POSIBILIDADES' : 'EXPLORE POSSIBILITIES'}
          </p>
          <Button
            variant="ghost"
            onClick={onClose}
            aria-label={es ? 'Cerrar escenarios' : 'Close scenario studio'}
          >
            <X size={20} />
          </Button>
        </div>
        <h2>{es ? '¿Y si sube el agua?' : 'What if the water rises?'}</h2>
        <p>
          {es
            ? 'Explore una representación visual sobre las zonas FEMA del 1% anual.'
            : 'Explore a visual effect over FEMA 1% annual-chance zones.'}
        </p>
        <div className="scenario-presets">
          {presets.map((p) => (
            <Button
              key={p.id}
              variant={preset === p.id ? 'default' : 'secondary'}
              aria-pressed={preset === p.id}
              onClick={() => animate(p.value, p.id)}
            >
              {p.name}
            </Button>
          ))}
        </div>
        <div className="scenario-level">
          <div>
            <span>{es ? 'ALTURA VISUAL' : 'VISUAL HEIGHT'}</span>
            <strong>
              {level.toFixed(1)}
              <small> m</small>
            </strong>
          </div>
          <Waves size={40} />
        </div>
        <label className="scenario-slider-label" id="water-height-label">
          {es ? 'Ajustar altura ilustrativa' : 'Adjust illustrative height'}
        </label>
        <Slider
          aria-labelledby="water-height-label"
          min={0}
          max={8}
          step={0.1}
          value={[level]}
          onValueChange={(v) => {
            stop();
            setPreset('custom');
            update(Array.isArray(v) ? v[0] : v);
          }}
        />
        <div className="scenario-scale">
          <span>0 m</span>
          <span>8 m</span>
        </div>
        <div className="scenario-actions">
          <Button
            variant="outline"
            onClick={() =>
              animating ? stop() : animate(level >= 7.9 ? 0 : 8, 'custom')
            }
          >
            {animating ? <Pause size={16} /> : <Play size={16} />}{' '}
            {animating
              ? es
                ? 'Pausar'
                : 'Pause'
              : es
                ? 'Animar subida'
                : 'Animate rise'}
          </Button>
          <label>
            <Columns2 size={17} />
            {es ? 'Comparar' : 'Compare'}
            <Switch
              checked={compare}
              onCheckedChange={setCompare}
              aria-label={es ? 'Comparar con base' : 'Compare with baseline'}
            />
          </label>
        </div>
        {compare && (
          <div className="scenario-split">
            <label id="split-label">
              {es ? 'Divisor de comparación' : 'Comparison divider'} · {split}%
            </label>
            <Slider
              aria-labelledby="split-label"
              min={5}
              max={95}
              step={1}
              value={[split]}
              onValueChange={(v) => setSplit(Array.isArray(v) ? v[0] : v)}
            />
            {!compareReady && !error && (
              <p role="status">
                {es ? 'Cargando comparación…' : 'Loading comparison…'}
              </p>
            )}
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        <p className="scenario-limits">
          {es
            ? 'Presets de demostración, no condiciones observadas. La altura dibujada no es profundidad de inundación. El área permanece fija: no modela lluvia, marejada, drenaje ni flujo del agua.'
            : 'Demo presets, not observed conditions. Drawn height is not flood depth. The footprint stays fixed: rainfall, surge, drainage and water flow are not modeled.'}
        </p>
      </section>
    </>
  );
}
