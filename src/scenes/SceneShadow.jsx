import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RING_SIZE = 36;

export default function SceneShadow({ load, animated }) {
  const groupRef = useRef();
  const lightRef = useRef();
  const casters = Math.max(Math.round(load), 8);

  const geometries = useMemo(() => [
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.CylinderGeometry(0.55, 0.55, 2.2, 24),
    new THREE.ConeGeometry(0.7, 2.1, 24),
  ], []);

  const materials = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: '#22d3ee', metalness: 0.55, roughness: 0.35 }),
    new THREE.MeshStandardMaterial({ color: '#a78bfa', metalness: 0.7, roughness: 0.25 }),
    new THREE.MeshStandardMaterial({ color: '#f472b6', metalness: 0.45, roughness: 0.45 }),
  ], []);

  const items = useMemo(() => {
    const list = [];
    for (let i = 0; i < casters; i += 1) {
      const ring = Math.floor(i / RING_SIZE);
      const inRing = i % RING_SIZE;
      const perRing = Math.min(RING_SIZE, casters - ring * RING_SIZE);
      const angle = (inRing / perRing) * Math.PI * 2 + ring * 0.35;
      const radius = 5.5 + ring * 3.4;
      list.push({
        key: i,
        position: [Math.cos(angle) * radius, 1.1 + ring * 0.5, Math.sin(angle) * radius],
        type: i % 3,
      });
    }
    return list;
  }, [casters]);

  useFrame(({ clock }, delta) => {
    if (!animated) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.y += delta * 0.18;
    lightRef.current.position.set(Math.cos(t * 0.4) * 22, 20, Math.sin(t * 0.4) * 22);
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        ref={lightRef}
        position={[20, 20, 0]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <pointLight position={[0, -8, 0]} intensity={30} color="#4dabf7" />
      <group ref={groupRef}>
        {items.map((item) => (
          <mesh
            key={item.key}
            geometry={geometries[item.type]}
            material={materials[item.type]}
            position={item.position}
            castShadow
            receiveShadow
          />
        ))}
      </group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[42, 64]} />
        <meshStandardMaterial color="#101528" metalness={0.15} roughness={0.85} />
      </mesh>
    </>
  );
}
