'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function brandColor() {
  try {
    // --brand vem no formato Tailwind ("30 60% 50%"); three.js exige vírgulas.
    const v = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim();
    return v ? new THREE.Color(`hsl(${v.replace(/\s+/g, ', ')})`) : new THREE.Color('#6366f1');
  } catch {
    return new THREE.Color('#6366f1');
  }
}

function Shape() {
  const mesh = useRef<THREE.Mesh>(null);
  const color = useRef(brandColor());
  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    m.rotation.y += delta * 0.16;
    m.rotation.z += delta * 0.04;
    const targetX = state.pointer.y * 0.4;
    m.rotation.x += (targetX - m.rotation.x) * 0.04;
    m.position.x += (state.pointer.x * 0.35 - m.position.x) * 0.04;
  });
  return (
    <mesh ref={mesh} scale={1.75}>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial color={color.current} roughness={0.2} metalness={0.65} flatShading />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 4, 5]} intensity={1.6} />
      <pointLight position={[-5, -3, -2]} intensity={1.1} color="#ffffff" />
      <Shape />
    </Canvas>
  );
}
