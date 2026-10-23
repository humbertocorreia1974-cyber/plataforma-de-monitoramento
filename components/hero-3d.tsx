'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const HeroScene = dynamic(() => import('./hero-3d-scene'), { ssr: false, loading: () => <Fallback /> });

function Fallback() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" className="w-3/5 drop-shadow-xl" />
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
      {render3d ? <HeroScene /> : <Fallback />}
    </div>
  );
}