import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { SCENES, SUITE_SCENE_IDS, scaleConfig } from '../scenes';

const GRACE_PERIOD_SECONDS = 5;
const THROTTLE_DROP_RATIO = 0.88;
const MAX_TRACKED_FRAMES = 30000;

function computeFrameStats(frameTimes) {
  if (frameTimes.length === 0) return {};
  const sorted = [...frameTimes].sort((a, b) => a - b);
  const percentile = (ratio) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
  return {
    onePercentLow: Math.round(1000 / Math.max(percentile(0.99), 1)),
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

function averageOf(samples) {
  if (samples.length === 0) return 0;
  return samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
}

export default function Benchmark({
  sceneId, difficulty, duration, mode, isRunning, onComplete, onStatsUpdate,
}) {
  const startedAtRef = useRef(0);
  const lastFrameRef = useRef(0);
  const lastSampleRef = useRef(0);
  const frameCountRef = useRef(0);
  const frameTimesRef = useRef([]);
  const samplesRef = useRef([]);
  const segSamplesRef = useRef([]);
  const segResultsRef = useRef([]);
  const latestResultRef = useRef(null);
  const completedRef = useRef(false);
  const workersRef = useRef([]);
  const cpuResultsRef = useRef(null);
  const segmentsRef = useRef([]);
  const loadRef = useRef(difficulty.factor * SCENES[sceneId].initial);
  const [activeSceneId, setActiveSceneId] = useState(sceneId);
  const [load, setLoad] = useState(loadRef.current);

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
  };

  useEffect(() => {
    if (!isRunning) {
      setActiveSceneId(sceneId);
      loadRef.current = Math.round(difficulty.factor * SCENES[sceneId].initial);
      setLoad(loadRef.current);
      frameTimesRef.current = [];
      samplesRef.current = [];
      segSamplesRef.current = [];
      segResultsRef.current = [];
      segmentsRef.current = [];
      latestResultRef.current = null;
      completedRef.current = false;
      cpuResultsRef.current = null;
      workersRef.current.forEach((worker) => worker.terminate());
      workersRef.current = [];
      return undefined;
    }

    const factor = difficulty.factor;
    let sceneIds;
    if (mode === 'suite') sceneIds = SUITE_SCENE_IDS;
    else if (mode === 'stability') sceneIds = ['swarm'];
    else sceneIds = [sceneId];

    segmentsRef.current = sceneIds.map((id) => ({ id, config: scaleConfig(SCENES[id], factor) }));
    const firstSegment = segmentsRef.current[0];
    setActiveSceneId(firstSegment.id);
    loadRef.current = firstSegment.config.initial;
    setLoad(firstSegment.config.initial);

    startedAtRef.current = performance.now();
    lastFrameRef.current = startedAtRef.current;
    lastSampleRef.current = startedAtRef.current;
    frameCountRef.current = 0;
    frameTimesRef.current = [];
    samplesRef.current = [];
    segSamplesRef.current = [];
    segResultsRef.current = [];
    cpuResultsRef.current = null;
    completedRef.current = false;

    if (mode === 'cpu') spawnCpuWorkers();

    return () => {
      workersRef.current.forEach((worker) => worker.terminate());
      workersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, isRunning, mode, sceneId]);

  const finalizeSegment = (segment, averageFps) => {
    const score =
      mode === 'stability'
        ? null
        : Math.max(1, Math.round((averageFps * loadRef.current) / segment.config.divisor));
    segResultsRef.current.push({
      id: segment.id,
      label: segment.config.label,
      icon: segment.config.icon,
      fps: Math.round(averageFps),
      load: loadRef.current,
      score,
    });
    segSamplesRef.current = [];
  };

  const buildLiveResult = (fps, elapsedSeconds) => {
    const segments = segmentsRef.current;
    const currentSegment = segments[Math.min(segResultsRef.current.length, segments.length - 1)];
    const averageFps = Math.round(averageOf(samplesRef.current));
    const variance =
      samplesRef.current.reduce((sum, sample) => sum + ((sample - averageFps) ** 2), 0)
      / Math.max(samplesRef.current.length, 1);
    const stability = Math.max(0, Math.round(100 - Math.sqrt(variance) * 4));

    let partialScore = null;
    if (mode === 'gpu' || mode === 'suite') {
      const finalizedSum = segResultsRef.current.reduce((sum, item) => sum + (item.score || 0), 0);
      const currentAvg = averageOf(segSamplesRef.current);
      const currentPartial = currentSegment && currentAvg > 0
        ? (currentAvg * loadRef.current) / currentSegment.config.divisor
        : 0;
      partialScore = Math.round(finalizedSum + currentPartial);
    } else if (mode === 'stability') {
      partialScore = Math.round(averageFps * stability);
    }

    return {
      fps,
      averageFps,
      meshCount: mode === 'cpu' ? null : loadRef.current,
      memory: performance.memory
        ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)} MB`
        : 'Non disponible',
      elapsed: Math.round(elapsedSeconds),
      duration,
      stability,
      score: partialScore,
      mode,
      sceneLabel: mode === 'cpu' ? 'CPU multi-cœur' : currentSegment?.config.label,
      sceneIcon: mode === 'cpu' ? '⚙️' : currentSegment?.config.icon,
      breakdown: [...segResultsRef.current],
      samples: [...samplesRef.current],
      throttled: detectThrottle(samplesRef.current),
      ...computeFrameStats(mode === 'cpu' ? [] : frameTimesRef.current),
    };
  };

  useFrame(() => {
    if (!isRunning) return;

    const now = performance.now();
    const delta = now - lastFrameRef.current;
    lastFrameRef.current = now;
    frameCountRef.current += 1;
    if (mode !== 'cpu') {
      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > MAX_TRACKED_FRAMES) frameTimesRef.current.shift();
    }
    const elapsedMs = now - startedAtRef.current;
    const elapsedSeconds = elapsedMs / 1000;

    const segments = segmentsRef.current;
    const segmentDurationMs = (duration * 1000) / segments.length;
    const targetSegmentIndex = Math.min(Math.floor(elapsedMs / segmentDurationMs), segments.length - 1);

    if (targetSegmentIndex > segResultsRef.current.length) {
      while (segResultsRef.current.length < targetSegmentIndex) {
        const index = segResultsRef.current.length;
        finalizeSegment(segments[index], averageOf(segSamplesRef.current));
      }
      const nextSegment = segments[targetSegmentIndex];
      setActiveSceneId(nextSegment.id);
      loadRef.current = nextSegment.config.initial;
      setLoad(nextSegment.config.initial);
    }

    if (now - lastSampleRef.current >= 1000) {
      const sampleDuration = now - lastSampleRef.current;
      const fps = Math.max(1, Math.round((frameCountRef.current * 1000) / sampleDuration));
      frameCountRef.current = 0;
      samplesRef.current.push(fps);
      segSamplesRef.current.push(fps);

      if ((mode === 'gpu' || mode === 'suite') && fps > 50) {
        const currentSegment = segments[targetSegmentIndex];
        if (loadRef.current < currentSegment.config.max) {
          loadRef.current = Math.min(loadRef.current + currentSegment.config.step, currentSegment.config.max);
          setLoad(loadRef.current);
        }
      }

      const result = buildLiveResult(fps, elapsedSeconds);
      latestResultRef.current = result;
      onStatsUpdate(result);
      lastSampleRef.current = now;
    }

    const cpuReady = mode !== 'cpu' || cpuResultsRef.current !== null;
    const timedOut = mode === 'cpu' && elapsedSeconds >= duration + GRACE_PERIOD_SECONDS;
    if (elapsedSeconds >= duration && !completedRef.current && latestResultRef.current && (cpuReady || timedOut)) {
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
      } else {
        if (segResultsRef.current.length < segments.length) {
          finalizeSegment(segments[segResultsRef.current.length], averageOf(segSamplesRef.current));
        }
        const breakdown = [...segResultsRef.current];
        finalResult.breakdown = breakdown;
        if (mode === 'stability') {
          finalResult.score = Math.round(finalResult.averageFps * finalResult.stability);
        } else {
          finalResult.score = breakdown.reduce((sum, item) => sum + (item.score || 0), 0);
        }
      }

      workersRef.current.forEach((worker) => worker.terminate());
      workersRef.current = [];
      onComplete(finalResult);
    }
  });

  const renderScene = () => {
    if (mode === 'cpu') return null;
    const SceneComponent = SCENES[activeSceneId]?.component;
    if (!SceneComponent) return null;
    return (
      <SceneComponent
        key={`${activeSceneId}-${isRunning ? 'run' : 'idle'}`}
        load={Math.round(load)}
        animated={isRunning}
      />
    );
  };

  return (
    <>
      <color attach="background" args={['#05070f']} />
      {renderScene()}
    </>
  );
}
