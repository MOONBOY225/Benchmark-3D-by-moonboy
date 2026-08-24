import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import Cubes from './Cubes';

const GRACE_PERIOD_SECONDS = 5;
const THROTTLE_DROP_RATIO = 0.88;

function computeFrameStats(frameTimes) {
  if (frameTimes.length === 0) return null;
  const sorted = [...frameTimes].sort((a, b) => a - b);
  const percentile = (ratio) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
  const p99 = percentile(0.99);
  const p95 = percentile(0.95);
  return {
    onePercentLow: Math.round(1000 / Math.max(p99, 1)),
    onePercentLowP95: Math.round(1000 / Math.max(p95, 1)),
    minFps: Math.round(1000 / Math.max(sorted[sorted.length - 1], 1)),
    maxFps: Math.round(1000 / Math.max(sorted[0], 1)),
  };
}

function detectThrottle(samples) {
  if (samples.length < 6) return false;
  const half = Math.floor(samples.length / 2);
  const firstHalf = samples.slice(0, half).reduce((sum, value) => sum + value, 0) / half;
  const secondHalfCount = samples.length - half;
  const secondHalf = samples.slice(half).reduce((sum, value) => sum + value, 0) / secondHalfCount;
  return firstHalf > 0 && secondHalf < firstHalf * THROTTLE_DROP_RATIO;
}

export default function Benchmark({ difficulty, duration, mode, isRunning, onComplete, onStatsUpdate }) {
  const frameTimesRef = useRef([]);
  const lastFrameRef = useRef(0);
  const lastSampleRef = useRef(0);
  const startedAtRef = useRef(0);
  const [meshCount, setMeshCount] = useState(difficulty.initialMeshes);
  const meshCountRef = useRef(difficulty.initialMeshes);
  const samplesRef = useRef([]);
  const latestResultRef = useRef(null);
  const completedRef = useRef(false);
  const workersRef = useRef([]);
  const cpuResultsRef = useRef(null);

  const spawnCpuWorkers = () => {
    const workerCount = Math.max(1, Math.min(navigator.hardwareConcurrency || 4, 16));
    const opsPerSecondList = [];
    let finished = 0;

    workersRef.current = Array.from({ length: workerCount }, () => {
      const worker = new Worker(new URL('../workers/cpuWorker.js', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }) => {
        opsPerSecondList.push(data.opsPerSecond);
        finished += 1;
        if (finished === workerCount) {
          cpuResultsRef.current = {
            totalOpsPerSecond: opsPerSecondList.reduce((sum, value) => sum + value, 0),
            workerCount,
          };
          workersRef.current.forEach((item) => item.terminate());
          workersRef.current = [];
        }
      };
      worker.onerror = () => {
        finished += 1;
      };
      worker.postMessage({ durationMs: duration * 1000 });
      return worker;
    });

    return workerCount;
  };

  useEffect(() => {
    if (!isRunning) {
      setMeshCount(difficulty.initialMeshes);
      meshCountRef.current = difficulty.initialMeshes;
      frameTimesRef.current = [];
      lastSampleRef.current = 0;
      samplesRef.current = [];
      latestResultRef.current = null;
      completedRef.current = false;
      cpuResultsRef.current = null;
      workersRef.current.forEach((worker) => worker.terminate());
      workersRef.current = [];
      return undefined;
    }
    startedAtRef.current = performance.now();
    lastFrameRef.current = startedAtRef.current;
    lastSampleRef.current = startedAtRef.current;
    frameTimesRef.current = [];
    samplesRef.current = [];
    cpuResultsRef.current = null;
    completedRef.current = false;
    setMeshCount(difficulty.initialMeshes);
    meshCountRef.current = difficulty.initialMeshes;

    if (mode === 'cpu') spawnCpuWorkers();

    return () => {
      workersRef.current.forEach((worker) => worker.terminate());
      workersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, isRunning, mode]);

  useFrame(() => {
    if (!isRunning) return;

    const now = performance.now();
    frameTimesRef.current.push(now - lastFrameRef.current);
    lastFrameRef.current = now;
    const elapsedSeconds = (now - startedAtRef.current) / 1000;

    if (now - lastSampleRef.current >= 1000) {
      const sampleDuration = now - lastSampleRef.current;
      const fps = Math.round((frameTimesRef.current.length * 1000) / sampleDuration);
      samplesRef.current.push(fps);

      let nextMeshes = meshCountRef.current;
      if (mode === 'gpu' && fps > 50 && nextMeshes < difficulty.maxMeshes) {
        nextMeshes = Math.min(nextMeshes + difficulty.step, difficulty.maxMeshes);
        meshCountRef.current = nextMeshes;
        setMeshCount(nextMeshes);
      }

      const averageFps = Math.round(
        samplesRef.current.reduce((sum, sample) => sum + sample, 0) / samplesRef.current.length
      );
      const variance =
        samplesRef.current.reduce((sum, sample) => sum + ((sample - averageFps) ** 2), 0)
        / samplesRef.current.length;
      const stability = Math.max(0, Math.round(100 - Math.sqrt(variance) * 4));
      const memory = performance.memory
        ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)} MB`
        : 'Non disponible';

      const result = {
        fps,
        averageFps,
        meshCount: mode === 'cpu' ? null : nextMeshes,
        memory,
        elapsed: Math.round(elapsedSeconds),
        duration,
        stability,
        score:
          mode === 'gpu'
            ? Math.round((averageFps * nextMeshes) / 10)
            : mode === 'cpu'
              ? null
              : Math.round(averageFps * stability),
        mode,
        samples: [...samplesRef.current],
        throttled: detectThrottle(samplesRef.current),
        ...computeFrameStats(frameTimesRef.current),
      };
      latestResultRef.current = result;
      onStatsUpdate(result);

      lastSampleRef.current = now;
      frameTimesRef.current = [];
    }

    const cpuReady = mode !== 'cpu' || cpuResultsRef.current !== null;
    const timedOut = mode === 'cpu' && elapsedSeconds >= duration + GRACE_PERIOD_SECONDS;
    if (
      elapsedSeconds >= duration
      && !completedRef.current
      && latestResultRef.current
      && (cpuReady || timedOut)
    ) {
      completedRef.current = true;
      const finalResult = { ...latestResultRef.current, elapsed: duration };

      if (mode === 'cpu') {
        if (cpuResultsRef.current) {
          const { totalOpsPerSecond, workerCount } = cpuResultsRef.current;
          finalResult.score = Math.round(totalOpsPerSecond / 1e6);
          finalResult.cpuMops = Math.round(totalOpsPerSecond / 1e5) / 10;
          finalResult.workerCount = workerCount;
        } else {
          onComplete(null);
          return;
        }
      }
      workersRef.current.forEach((worker) => worker.terminate());
      workersRef.current = [];
      onComplete(finalResult);
    }
  });

  const cameraAngle = useRef(0);
  useFrame((state) => {
    if (isRunning && mode === 'gpu') {
      cameraAngle.current += 0.0025;
      state.camera.position.set(
        Math.sin(cameraAngle.current) * 15,
        4.5,
        Math.cos(cameraAngle.current) * 15
      );
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <color attach="background" args={['#0d0f1a']} />
      <fog attach="fog" args={['#0d0f1a', 20, 60]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[14, 20, 10]}
        intensity={1.5}
        castShadow={mode === 'gpu'}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={70}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      <pointLight position={[-12, -6, -10]} intensity={40} color="#4dabf7" />
      {mode !== 'cpu' && <Cubes count={meshCount} animated={mode === 'gpu'} />}
    </>
  );
}
