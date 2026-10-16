'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const HeroScene = dynamic(() => import('./hero-3d-scene'), { ssr: false, loading: () => <Orb /> });

function Orb() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="h-3/5 w-3/5 rounded-full bg-brand/40 blur-3xl animate-pulse" />
      <div className="absolute h-2/5 w-2/5 rounded-full bg-brand/60 blur-2xl" />
    </div>
  );
}

export function Hero3D() {
  const [render3d, setRender3d] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let webgl = false;
    try {
      const c = document.createElement('canvas');
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {}
    setRender3d(!reduce && webgl);
  }, []);
  return (
    <div className="relative aspect-square w-full max-w-[540px]">
      <div className="absolute inset-0 rounded-full bg-brand/20 blur-3xl" aria-hidden />
      {render3d ? <HeroScene /> : <Orb />}
    </div>
  );
}
