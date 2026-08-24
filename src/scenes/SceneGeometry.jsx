import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const dummy = new THREE.Object3D();

export default function SceneGeometry({ load, animated }) {
  const meshRef = useRef();
  const count = Math.max(Math.round(load), 4);

  const seeds = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      radius: 5.5 + (i % 4) * 2.8,
      speed: 0.3 + (i % 5) * 0.14,
      height: -2.2 + (i % 3) * 2.3,
      scale: 0.9 + (i % 4) * 0.18,
    })),
    [count]
  );

  useFrame(({ clock }, delta) => {
    if (!animated || !meshRef.current) return;
    const t = clock.elapsedTime;
    meshRef.current.rotation.y += delta * 0.05;

    for (let i = 0; i < count; i += 1) {
      const seed = seeds[i];
      const angle = seed.angle + t * seed.speed;
      dummy.position.set(
        Math.cos(angle) * seed.radius,
        seed.height + Math.sin(t * seed.speed * 2 + i) * 1.1,
        Math.sin(angle) * seed.radius
      );
      dummy.rotation.set(t * 0.6 + i, t * 0.4, i * 0.7);
      dummy.scale.setScalar(seed.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} castShadow receiveShadow>
      <torusKnotGeometry args={[0.55, 0.18, 220, 28]} />
      <meshStandardMaterial color="#a78bfa" metalness={0.9} roughness={0.12} />
    </instancedMesh>
  );
}
