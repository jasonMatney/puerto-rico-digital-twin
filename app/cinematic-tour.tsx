'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Facility } from './facilities';
import { useMunicipality } from './municipality-context';
export type TourCamera = {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
};
export function CinematicTour({
  facilities,
  lang,
  ready,
  active,
  onActive,
  onCamera,
  onStop,
}: {
  facilities: Facility[];
  lang: 'en' | 'es';
  ready: boolean;
  active: boolean;
  onActive: (v: boolean) => void;
  onCamera: (v: TourCamera) => void;
  onStop: () => void;
}) {
  const m = useMunicipality(),
    es = lang === 'es';
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [full, setFull] = useState(false);
  const scenes = useMemo(() => {
    const shelter = facilities.find((f) => f.properties.kind === 'shelter');
    const exposed = facilities.find((f) => f.properties.exposureHigh);
    const essential =
      facilities.find((f) => f.properties.kind === 'fire') ||
      facilities.find((f) => f.properties.kind === 'health');
    const stops = [
      {
        title: m.name,
        text: es
          ? 'Un territorio. Múltiples perspectivas. Explore edificios, vías e infraestructura en tres dimensiones.'
          : 'One place. Multiple perspectives. Explore buildings, roads and infrastructure in three dimensions.',
        center: m.center,
        zoom: m.zoom,
        bearing: -18,
        pitch: 60,
      },
    ];
    if (exposed)
      stops.push({
        title: es ? 'La exposición, en contexto' : 'Exposure in context',
        text:
          (es
            ? 'Este punto intersecta una zona FEMA del 1% anual: '
            : 'This point intersects a FEMA 1% annual-chance zone: ') +
          exposed.properties.name,
        center: exposed.geometry.coordinates as [number, number],
        zoom: 15.4,
        bearing: 35,
        pitch: 64,
      });
    if (shelter)
      stops.push({
        title: es ? 'Un lugar para planificar' : 'A place to plan',
        text:
          shelter.properties.name +
          (es
            ? ' · Refugio designado en 2026. Operación actual sin confirmar.'
            : ' · Designated in 2026. Current operation unconfirmed.'),
        center: shelter.geometry.coordinates as [number, number],
        zoom: 16,
        bearing: -45,
        pitch: 62,
      });
    if (essential)
      stops.push({
        title: es ? 'Infraestructura esencial' : 'Essential infrastructure',
        text:
          essential.properties.name +
          (es
            ? ' · Ubicación documentada; disponibilidad sin confirmar.'
            : ' · Documented location; availability unconfirmed.'),
        center: essential.geometry.coordinates as [number, number],
        zoom: 16,
        bearing: 85,
        pitch: 58,
      });
    return stops;
  }, [facilities, es, m.slug]);
  useEffect(() => {
    if (active) onCamera(scenes[index]);
  }, [active, index, scenes, onCamera]);
  useEffect(() => {
    if (!active || !playing) return;
    const timer = setTimeout(() => {
      if (index === scenes.length - 1) {
        setPlaying(false);
        onStop();
      } else setIndex((i) => i + 1);
    }, 10000);
    return () => clearTimeout(timer);
  }, [active, playing, index, scenes.length, onStop]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && active) {
        setPlaying(false);
        onActive(false);
        onStop();
      }
    };
    const fs = () => setFull(!!document.fullscreenElement);
    document.addEventListener('keydown', key);
    document.addEventListener('fullscreenchange', fs);
    return () => {
      document.removeEventListener('keydown', key);
      document.removeEventListener('fullscreenchange', fs);
    };
  }, [active, onActive, onStop]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        setPlaying(false);
        onStop();
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [onStop]);
  const close = () => {
    setPlaying(false);
    onActive(false);
    onStop();
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => {});
  };
  const step = (i: number) => {
    setPlaying(false);
    setIndex(i);
  };
  if (!active)
    return (
      <Button
        className="tour-launch"
        disabled={!ready}
        onClick={() => {
          setIndex(0);
          onActive(true);
          setPlaying(
            !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          );
        }}
      >
        <Play size={16} />
        {es ? 'Recorrido cinematográfico' : 'Cinematic tour'}
      </Button>
    );
  return (
    <section
      className="tour-overlay"
      aria-label={es ? 'Modo presentación' : 'Presentation mode'}
    >
      <div className="tour-top">
        <div>
          <span>PUERTO RICO / DIGITAL TWIN</span>
          <strong>{m.name}</strong>
        </div>
        <div className="tour-top-actions">
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                if (document.fullscreenElement) await document.exitFullscreen();
                else
                  await document.querySelector('.atlas')?.requestFullscreen();
              } catch {
                /* Presentation remains usable when fullscreen is unavailable. */
              }
            }}
            aria-label={es ? 'Pantalla completa' : 'Toggle fullscreen'}
          >
            {full ? <Minimize size={18} /> : <Maximize size={18} />}
          </Button>
          <Button variant="secondary" onClick={close}>
            <X size={18} />
            {es ? 'Salir' : 'Exit'}
          </Button>
        </div>
      </div>
      <div className="tour-story">
        <p className="eyebrow">
          {es ? 'RECORRIDO GUIADO' : 'GUIDED EXPLORATION'} /{' '}
          {String(index + 1).padStart(2, '0')}
        </p>
        <div aria-live="polite">
          <h2>{scenes[index].title}</h2>
          <p className="tour-description">{scenes[index].text}</p>
        </div>
        <div className="tour-chapters">
          {scenes.map((s, i) => (
            <button
              key={i}
              aria-label={(es ? 'Ir a: ' : 'Go to: ') + s.title}
              aria-current={i === index ? 'step' : undefined}
              onClick={() => step(i)}
            >
              <span />
              {String(i + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
        <div className="tour-playback">
          <Button
            variant="secondary"
            disabled={index === 0}
            onClick={() => step(index - 1)}
            aria-label={es ? 'Anterior' : 'Previous stop'}
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            onClick={() => {
              if (playing) {
                setPlaying(false);
                onStop();
              } else {
                if (index === scenes.length - 1) setIndex(0);
                setPlaying(true);
              }
            }}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}{' '}
            {playing ? (es ? 'Pausar' : 'Pause') : es ? 'Reproducir' : 'Play'}
          </Button>
          <Button
            variant="secondary"
            disabled={index === scenes.length - 1}
            onClick={() => step(index + 1)}
            aria-label={es ? 'Siguiente' : 'Next stop'}
          >
            <ChevronRight size={18} />
          </Button>
          <span>
            {index + 1} / {scenes.length}
          </span>
        </div>
        <p className="tour-caveat">
          {es
            ? 'Zonas FEMA cartografiadas · No es una simulación de tormenta ni un pronóstico en vivo.'
            : 'Mapped FEMA zones · Not a storm simulation or live forecast.'}
        </p>
      </div>
    </section>
  );
}
