'use client';

import { Component, Suspense, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

function brandColor() {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim();
    return v ? new THREE.Color(`hsl(${v.replace(/\s+/g, ', ')})`) : new THREE.Color('#12314f');
  } catch {
    return new THREE.Color('#12314f');
  }
}

function Medallion() {
  const g = useRef(null);
  const color = useRef(brandColor());
  const tex = useLoader(THREE.TextureLoader, '/logo.png');
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  useFrame((state) => {
    const m = g.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    m.rotation.y = Math.sin(t * 0.5) * 0.5;
    m.rotation.x = -0.12 + Math.sin(t * 0.33) * 0.09;
    m.position.y = Math.sin(t * 0.8) * 0.06;
  });
  return (
    <group ref={g} scale={1.4}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 0.16, 96]} />
        <meshStandardMaterial color={color.current} metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <torusGeometry args={[0.99, 0.04, 16, 96]} />
        <meshStandardMaterial color="#eef3f7" metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.081]}>
        <circleGeometry args={[0.9, 96]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0, 0.083]}>
        <circleGeometry args={[0.86, 96]} />
        <meshBasicMaterial map={tex} transparent />
      </mesh>
    </group>
  );
}

function PlainShape() {
  const mesh = useRef(null);
  const color = useRef(brandColor());
  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    m.rotation.y += delta * 0.16;
    m.rotation.z += delta * 0.04;
  });
  return (
    <mesh ref={mesh} scale={1.75}>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial color={color.current} roughness={0.2} metalness={0.65} flatShading />
    </mesh>
  );
}

class HeroErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 6]} intensity={1.3} />
      <directionalLight position={[-4, -2, 2]} intensity={0.4} color="#bfe6fb" />
      <HeroErrorBoundary fallback={<PlainShape />}>
        <Suspense fallback={null}>
          <Medallion />
        </Suspense>
      </HeroErrorBoundary>
    </Canvas>
  );
}