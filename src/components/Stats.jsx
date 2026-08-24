export default function Stats({
  fps, averageFps, meshCount, memory, elapsed, duration, score, stability, mode,
  minFps, maxFps, onePercentLow, throttled, cpuMops, workerCount,
}) {
  const fpsClass = fps > 50 ? 'good' : fps > 30 ? 'ok' : 'bad';

  return (
    <div className="stats">
      <div className="result-heading">Résultats {elapsed >= duration ? 'finaux' : 'en direct'}</div>
      {throttled && <div className="throttle-badge">⚠ Ralentissement thermique détecté</div>}
      <div className="stat-item"><span className="stat-label">FPS actuels</span><strong className={`stat-value ${fpsClass}`}>{fps || '--'}</strong></div>
      <div className="stat-item"><span className="stat-label">FPS moyen</span><strong className="stat-value">{averageFps || '--'}</strong></div>
      {(mode === 'gpu' || mode === 'stability') && (
        <>
          <div className="stat-item"><span className="stat-label">FPS min / max</span><strong className="stat-value small">{minFps ?? '--'} / {maxFps ?? '--'}</strong></div>
          <div className="stat-item"><span className="stat-label">1% low</span><strong className="stat-value small">{onePercentLow ?? '--'} FPS</strong></div>
        </>
      )}
      {mode === 'stability' && <div className="stat-item"><span className="stat-label">Stabilité</span><strong className="stat-value">{stability}%</strong></div>}
      {mode === 'cpu' && workerCount && <div className="stat-item"><span className="stat-label">Cœurs sollicités</span><strong className="stat-value">{workerCount}</strong></div>}
      {mode === 'cpu' && cpuMops && <div className="stat-item"><span className="stat-label">Débit</span><strong className="stat-value">{cpuMops} M ops/s</strong></div>}
      <div className="stat-item"><span className="stat-label">Score</span><strong className="stat-value score">{score?.toLocaleString('fr-FR') ?? '--'}</strong></div>
      {mode === 'gpu' && <div className="stat-item"><span className="stat-label">Objets 3D</span><strong className="stat-value">{meshCount?.toLocaleString('fr-FR') ?? '--'}</strong></div>}
      <div className="stat-item"><span className="stat-label">Progression</span><strong className="stat-value">{elapsed}s / {duration}s</strong></div>
      <div className="stat-item"><span className="stat-label">Mémoire JS</span><strong className="stat-value small">{memory}</strong></div>
    </div>
  );
}
