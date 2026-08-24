import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import Cubes from './Cubes';

export default function Benchmark({ difficulty, duration, isRunning, onComplete, onStatsUpdate }) {
  const frameCountRef = useRef(0);
  const lastSampleRef = useRef(0);
  const startedAtRef = useRef(0);
  const [meshCount, setMeshCount] = useState(difficulty.initialMeshes);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setMeshCount(difficulty.initialMeshes);
      setElapsed(0);
      frameCountRef.current = 0;
      lastSampleRef.current = 0;
      return;
    }
    startedAtRef.current = performance.now();
    lastSampleRef.current = startedAtRef.current;
    frameCountRef.current = 0;
    setMeshCount(difficulty.initialMeshes);
  }, [difficulty, isRunning]);

  useFrame(() => {
    if (!isRunning) return;

    const now = performance.now();
    frameCountRef.current += 1;
    const elapsedSeconds = (now - startedAtRef.current) / 1000;
    setElapsed(Math.min(elapsedSeconds, duration));

    if (now - lastSampleRef.current >= 1000) {
      const sampleDuration = now - lastSampleRef.current;
      const fps = Math.round((frameCountRef.current * 1000) / sampleDuration);
      const nextMeshes = fps > 50 ? meshCount + difficulty.step : meshCount;
      const memory = performance.memory
        ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)} MB`
        : 'Non disponible';

      onStatsUpdate({
        fps,
        averageFps: fps,
        meshCount: nextMeshes,
        memory,
        elapsed: Math.round(elapsedSeconds),
        duration,
        score: Math.round(fps * nextMeshes * elapsedSeconds),
      });

      if (nextMeshes !== meshCount) setMeshCount(nextMeshes);
      frameCountRef.current = 0;
      lastSampleRef.current = now;
    }

    if (elapsedSeconds >= duration) onComplete();
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Cubes count={meshCount} />
      {isRunning && <mesh position={[0, -3.5, 0]}><planeGeometry args={[6, 0.08]} /><meshBasicMaterial color="#ff6b6b" /></mesh>}
    </>
  );
}
