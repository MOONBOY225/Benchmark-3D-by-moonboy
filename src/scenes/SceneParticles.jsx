import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function seededRandom(index) {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export default function SceneParticles({ load, animated }) {
  const pointsRef = useRef();
  const count = Math.max(Math.round(load), 200);

  const buffers = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const radii = new Float32Array(count);
    const phases = new Float32Array(count);
    const color = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      radii[i] = 2.5 + (i / count) * 15;
      phases[i] = seededRandom(i * 3 + 1) * Math.PI * 2;
      speeds[i] = 0.25 + seededRandom(i * 3 + 2) * 1.1;
      color.setHSL(0.48 + seededRandom(i * 3 + 3) * 0.35, 0.9, 0.55 + seededRandom(i * 7 + 5) * 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors, speeds, radii, phases };
  }, [count]);

  useFrame(({ clock }) => {
    if (!animated || !pointsRef.current) return;
    const t = clock.elapsedTime;
    const positions = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i += 1) {
      const angle = buffers.phases[i] + t * buffers.speeds[i];
      positions[i * 3] = Math.cos(angle) * buffers.radii[i];
      positions[i * 3 + 1] = Math.sin(t * buffers.speeds[i] * 0.7 + buffers.phases[i]) * 6.5;
      positions[i * 3 + 2] = Math.sin(angle) * buffers.radii[i];
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y = t * 0.06;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[buffers.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[buffers.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.13}
        vertexColors
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
