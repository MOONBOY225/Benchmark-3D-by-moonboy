import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import Cubes from './Cubes';

export default function Benchmark({ difficulty, duration, mode, isRunning, onComplete, onStatsUpdate }) {
  const frameCountRef = useRef(0);
  const lastSampleRef = useRef(0);
  const startedAtRef = useRef(0);
  const [meshCount, setMeshCount] = useState(difficulty.initialMeshes);
  const samplesRef = useRef([]);
  const latestResultRef = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!isRunning) {
      setMeshCount(difficulty.initialMeshes);
      frameCountRef.current = 0;
      lastSampleRef.current = 0;
      samplesRef.current = [];
      latestResultRef.current = null;
      completedRef.current = false;
      return;
    }
    startedAtRef.current = performance.now();
    lastSampleRef.current = startedAtRef.current;
    frameCountRef.current = 0;
    samplesRef.current = [];
    setMeshCount(difficulty.initialMeshes);
  }, [difficulty, isRunning]);

  useFrame(() => {
    if (!isRunning) return;

    const now = performance.now();
    frameCountRef.current += 1;
    if (mode === 'cpu') {
      let value = 0;
      for (let index = 0; index < 2500; index += 1) value = Math.sin(index + now) * Math.cos(index);
      if (value === Number.POSITIVE_INFINITY) console.debug(value);
    }
    const elapsedSeconds = (now - startedAtRef.current) / 1000;

    if (now - lastSampleRef.current >= 1000) {
      const sampleDuration = now - lastSampleRef.current;
      const fps = Math.round((frameCountRef.current * 1000) / sampleDuration);
      const nextMeshes = mode === 'gpu' && fps > 50 ? meshCount + difficulty.step : meshCount;
      samplesRef.current.push(fps);
      const averageFps = Math.round(samplesRef.current.reduce((sum, sample) => sum + sample, 0) / samplesRef.current.length);
      const variance = samplesRef.current.reduce((sum, sample) => sum + ((sample - averageFps) ** 2), 0) / samplesRef.current.length;
      const stability = Math.max(0, Math.round(100 - Math.sqrt(variance) * 4));
      const memory = performance.memory
        ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)} MB`
        : 'Non disponible';

      const result = {
        fps,
        averageFps,
        meshCount: nextMeshes,
        memory,
        elapsed: Math.round(elapsedSeconds),
        duration,
        stability,
        score: mode === 'gpu'
          ? Math.round(fps * nextMeshes * elapsedSeconds)
          : Math.round(averageFps * (mode === 'stability' ? stability : 100)),
        mode,
      };
      latestResultRef.current = result;
      onStatsUpdate(result);

      if (nextMeshes !== meshCount) setMeshCount(nextMeshes);
      frameCountRef.current = 0;
      lastSampleRef.current = now;
    }

    if (elapsedSeconds >= duration && !completedRef.current && latestResultRef.current) {
      completedRef.current = true;
      onComplete(latestResultRef.current);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      {mode === 'gpu' && <Cubes count={meshCount} />}
      {isRunning && mode === 'gpu' && <mesh position={[0, -3.5, 0]}><planeGeometry args={[6, 0.08]} /><meshBasicMaterial color="#ff6b6b" /></mesh>}
    </>
  );
}
