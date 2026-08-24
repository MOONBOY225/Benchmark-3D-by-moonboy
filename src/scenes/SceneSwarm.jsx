import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const dummy = new THREE.Object3D();

function updateInstances(mesh, count, time, radius, scale) {
  if (!mesh) return;
  for (let i = 0; i < count; i += 1) {
    const phase = time + i * 0.37;
    dummy.position.set(
      Math.sin(phase) * radius,
      Math.cos(phase * 0.8 + i) * radius * 0.7,
      Math.sin(phase * 0.6 + i * 0.5) * radius
    );
    dummy.rotation.set(phase, phase * 0.5, 0);
    const pulse = 1 + Math.sin(phase * 2) * 0.15;
    dummy.scale.setScalar(scale * pulse);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export default function SceneSwarm({ load, animated }) {
  const groupRef = useRef();
  const boxesRef = useRef();
  const spheresRef = useRef();
  const knotsRef = useRef();

  const { boxCount, sphereCount, knotCount } = useMemo(() => {
    const boxes = Math.ceil(load * 0.6);
    const spheres = Math.ceil(load * 0.25);
    return { boxCount: boxes, sphereCount: spheres, knotCount: Math.max(load - boxes - spheres, 0) };
  }, [load]);

  useFrame(({ clock }, delta) => {
    if (!animated) return;
    groupRef.current.rotation.y += delta * 0.08;
    const time = clock.elapsedTime;
    updateInstances(boxesRef.current, boxCount, time, 8.5, 0.6);
    updateInstances(spheresRef.current, sphereCount, time + 40, 11.5, 0.85);
    updateInstances(knotsRef.current, knotCount, time + 80, 14.5, 1.05);
  });

  return (
    <group ref={groupRef}>
      {boxCount > 0 && (
        <instancedMesh ref={boxesRef} args={[null, null, boxCount]} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#22d3ee" metalness={0.75} roughness={0.25} />
        </instancedMesh>
      )}
      {sphereCount > 0 && (
        <instancedMesh ref={spheresRef} args={[null, null, sphereCount]} castShadow receiveShadow>
          <icosahedronGeometry args={[0.55, 2]} />
          <meshStandardMaterial color="#a78bfa" metalness={0.9} roughness={0.15} />
        </instancedMesh>
      )}
      {knotCount > 0 && (
        <instancedMesh ref={knotsRef} args={[null, null, knotCount]} castShadow receiveShadow>
          <torusKnotGeometry args={[0.4, 0.13, 96, 12]} />
          <meshStandardMaterial color="#f472b6" metalness={0.6} roughness={0.35} />
        </instancedMesh>
      )}
      <mesh rotation-x={-Math.PI / 2} position-y={-10} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#101528" metalness={0.2} roughness={0.9} />
      </mesh>
    </group>
  );
}
