import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useMemo, useRef } from 'react';
import { MathUtils, Vector3, type PerspectiveCamera } from 'three';
import { sceneStore, useScene } from '../lib/store.ts';
import { kioskById, OVERVIEW_TARGET } from './layout.ts';

const DEG = Math.PI / 180;

// Durées garanties même si les images ralentissent : le travelling arrive toujours à l'heure.
gsap.ticker.lagSmoothing(0);

/** Vue d'ensemble : plongée sur la place, la ville en toile de fond. */
const OVERVIEW = { az: 0, el: 30 * DEG, dist: 46 };
const INTRO_FROM = { az: 0.9, el: 84 * DEG, dist: 170 };
export const INTRO_DURATION = 4.6;

interface Rig {
  az: number;
  el: number;
  dist: number;
  tx: number;
  ty: number;
  tz: number;
  ox: number;
  oy: number;
}

function shortestAngle(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d;
}

export function CameraRig({
  onIntroDone,
  onArrived,
}: {
  onIntroDone: () => void;
  onArrived: (id: string) => void;
}) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const selectedId = useScene((s) => s.selectedId);
  const intro = useScene((s) => s.intro);
  const skipToken = useScene((s) => s.skipToken);

  const rig = useMemo<Rig>(() => {
    const s = sceneStore.get();
    const start =
      s.intro === 'running' && !s.reducedMotion ? INTRO_FROM : OVERVIEW;
    return {
      ...start,
      tx: OVERVIEW_TARGET.x,
      ty: OVERVIEW_TARGET.y,
      tz: OVERVIEW_TARGET.z,
      ox: 0,
      oy: 0,
    };
  }, []);
  const zoom = useRef(1);
  const mouse = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const tween = useRef<gsap.core.Tween | gsap.core.Timeline | null>(null);
  const swayClock = useRef(0);
  const lookAt = useMemo(() => new Vector3(), []);

  // Intro : descente depuis le zénith.
  useEffect(() => {
    const s = sceneStore.get();
    if (s.intro !== 'running') return;
    if (s.reducedMotion) {
      // Intro raccourcie : pas de mouvement de caméra.
      const t = window.setTimeout(onIntroDone, 1200);
      return () => window.clearTimeout(t);
    }
    tween.current = gsap.to(rig, {
      ...OVERVIEW,
      duration: INTRO_DURATION,
      ease: 'power3.inOut',
      onComplete: onIntroDone,
    });
    return () => {
      tween.current?.kill();
    };
  }, []);

  // "Passer" : on termine immédiatement la descente.
  useEffect(() => {
    if (skipToken === 0) return;
    tween.current?.kill();
    if (!sceneStore.get().selectedId)
      Object.assign(rig, OVERVIEW, {
        tx: OVERVIEW_TARGET.x,
        tz: OVERVIEW_TARGET.z,
      });
  }, [skipToken, rig]);

  // Travelling vers un kiosque, ou retour à la place.
  useEffect(() => {
    if (intro === 'running' && !selectedId) return;
    tween.current?.kill();
    const reduced = sceneStore.get().reducedMotion;
    const duration = reduced ? 0.01 : 1.1;
    if (selectedId) {
      const k = kioskById.get(selectedId);
      if (!k) return;
      const id = selectedId;
      const az = shortestAngle(rig.az, Math.atan2(k.dir.x, k.dir.z));
      const target = k.position.clone().addScaledVector(k.dir, 0.9);
      // Travelling jusqu'au comptoir du stand, puis ouverture de la fiche.
      tween.current = gsap.to(rig, {
        az,
        el: 30 * DEG,
        dist: 8.5,
        tx: target.x,
        ty: 0.9,
        tz: target.z,
        duration,
        ease: 'power2.inOut',
        onComplete: () => onArrived(id),
      });
    } else {
      zoom.current = 1;
      tween.current = gsap.to(rig, {
        az: shortestAngle(rig.az, OVERVIEW.az),
        el: OVERVIEW.el,
        dist: OVERVIEW.dist,
        tx: OVERVIEW_TARGET.x,
        ty: OVERVIEW_TARGET.y,
        tz: OVERVIEW_TARGET.z,
        duration,
        ease: 'power2.inOut',
      });
    }
  }, [selectedId, intro, rig]);

  // Parallaxe souris et zoom molette limité.
  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onWheel = (e: WheelEvent) => {
      const s = sceneStore.get();
      if (s.intro === 'running' || s.selectedId) return;
      zoom.current = MathUtils.clamp(
        zoom.current * (1 + Math.sign(e.deltaY) * 0.06),
        0.6,
        1.25,
      );
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      el.removeEventListener('wheel', onWheel);
    };
  }, [gl]);

  const zoomSmooth = useRef(1);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = sceneStore.get();
    const m = mouse.current;
    const calm = s.reducedMotion;
    const k = 1 - Math.exp(-dt * 3);
    m.sx += ((calm ? 0 : m.x) - m.sx) * k;
    m.sy += ((calm ? 0 : m.y) - m.sy) * k;
    zoomSmooth.current +=
      (zoom.current - zoomSmooth.current) * (1 - Math.exp(-dt * 6));

    // Orbite lente : balancement doux en vue d'ensemble, coupé si mouvement réduit.
    const idle = !s.selectedId && s.intro === 'done' && !calm && !s.paused;
    if (idle) swayClock.current += dt;
    const sway = idle ? Math.sin(swayClock.current * 0.09) * 0.13 : 0;

    const az = rig.az + sway + m.sx * 0.035;
    const el = rig.el - m.sy * 0.02;
    // Cadrage : on recule sur les écrans plus étroits que 16/10 pour garder tout l'arc.
    const fit = Math.max(1, Math.pow(1.6 / (size.width / size.height), 0.85));
    const dist = rig.dist * (s.selectedId ? 1 : zoomSmooth.current * fit);
    lookAt.set(rig.tx, rig.ty, rig.tz);
    camera.position.set(
      rig.tx + Math.sin(az) * Math.cos(el) * dist,
      rig.ty + Math.sin(el) * dist,
      rig.tz + Math.cos(az) * Math.cos(el) * dist,
    );
    camera.lookAt(lookAt);

    const w = size.width;
    const h = size.height;
    if (rig.ox > 0.0005 || rig.oy > 0.0005) {
      camera.setViewOffset(w, h, rig.ox * w, rig.oy * h, w, h);
    } else if (camera.view?.enabled) {
      camera.clearViewOffset();
    }
  });

  return null;
}
