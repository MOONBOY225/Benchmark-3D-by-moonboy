import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import Cubes from './Cubes';

export default function Benchmark({ onStatsUpdate, isRunning }) {
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const [meshCount, setMeshCount] = useState(100);

  useFrame(() => {
    if (!isRunning) return;

    frameCountRef.current++;
    const now = Date.now();
    const delta = now - lastTimeRef.current;

    if (delta >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / delta);
      
      onStatsUpdate({
        fps,
        meshCount,
        memory: performance.memory ? 
          (performance.memory.usedJSHeapSize / 1048576).toFixed(2) : 'N/A'
      });

      frameCountRef.current = 0;
      lastTimeRef.current = now;

      if (fps > 50) setMeshCount(prev => prev + 50);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Cubes count={meshCount} />
    </>
  );
}
