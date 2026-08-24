import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Cubes({ count }) {
  const instancedMeshRef = useRef();

  useFrame((state) => {
    if (!instancedMeshRef.current) return;

    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      matrix.setPosition(
        Math.sin(state.clock.elapsedTime + i) * 8,
        Math.cos(state.clock.elapsedTime + i) * 8,
        Math.sin(state.clock.elapsedTime + i * 0.5) * 8
      );
      matrix.rotateX(state.clock.elapsedTime + i);
      matrix.rotateY(state.clock.elapsedTime + i * 0.5);
      instancedMeshRef.current.setMatrixAt(i, matrix);
    }
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={instancedMeshRef} 
      args={[null, null, count]}
    >
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#ff6b6b" metalness={0.8} roughness={0.2} />
    </instancedMesh>
  );
}
