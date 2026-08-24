const BATCH_SIZE = 50000;

self.onmessage = ({ data }) => {
  const { durationMs } = data;
  const start = performance.now();
  const deadline = start + durationMs;
  let operations = 0;
  let hash = 2166136261;

  while (performance.now() < deadline) {
    for (let i = 0; i < BATCH_SIZE; i += 1) {
      hash ^= i + operations;
      hash = Math.imul(hash, 16777619);
      hash ^= hash >>> 13;
      operations += 1;
    }
  }

  const elapsedSeconds = Math.max((performance.now() - start) / 1000, 0.001);
  self.postMessage({ operations, elapsedSeconds, opsPerSecond: operations / elapsedSeconds });
};
