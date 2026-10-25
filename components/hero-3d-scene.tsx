'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function brandColor() {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim();
    return v ? new THREE.Color(`hsl(${v.replace(/\s+/g, ', ')})`) : new THREE.Color('#6366f1');
  } catch {
    return new THREE.Color('#6366f1');
  }
}

// cluster de 2 poliedros facetados, girando em velocidades
// diferentes - precisao/tecnologia, sem depender de nenhuma
// textura (nunca falha por logo ausente).
function FacetCluster() {
  const outer = useRef(null);
  const inner = useRef(null);
  const color = useRef(brandColor());
  useFrame((state, delta) => {
    if (outer.current) {
      outer.current.rotation.y += delta * 0.14;
      outer.current.rotation.x += delta * 0.05;
    }
    if (inner.current) {
      inner.current.rotation.y -= delta * 0.22;
      inner.current.rotation.z += delta * 0.08;
    }
  });
  return (
    <group>
      <mesh ref={outer} scale={1.55}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={color.current} roughness={0.25} metalness={0.55} flatShading transparent opacity={0.88} />
      </mesh>
      <mesh ref={inner} scale={0.78}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.3} flatShading />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 4, 5]} intensity={1.5} />
      <pointLight position={[-5, -3, -2]} intensity={1} color="#ffffff" />
      <FacetCluster />
    </Canvas>
  );
}