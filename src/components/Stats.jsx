export default function Stats({ fps, averageFps, meshCount, memory, elapsed, duration, score, stability, mode }) {
  const fpsClass = fps > 50 ? 'good' : fps > 30 ? 'ok' : 'bad';

  return (
    <div className="stats">
      <div className="result-heading">Résultats {elapsed >= duration ? 'finaux' : 'en direct'}</div>
      <div className="stat-item"><span className="stat-label">FPS actuels</span><strong className={`stat-value ${fpsClass}`}>{fps || '--'}</strong></div>
      <div className="stat-item"><span className="stat-label">FPS moyen</span><strong className="stat-value">{averageFps || '--'}</strong></div>
      <div className="stat-item"><span className="stat-label">Score</span><strong className="stat-value score">{score?.toLocaleString('fr-FR') || '--'}</strong></div>
      <div className="stat-item"><span className="stat-label">Objets 3D</span><strong className="stat-value">{meshCount}</strong></div>
      {mode === 'stability' && <div className="stat-item"><span className="stat-label">Stabilité</span><strong className="stat-value">{stability}%</strong></div>}
      <div className="stat-item"><span className="stat-label">Progression</span><strong className="stat-value">{elapsed}s / {duration}s</strong></div>
      <div className="stat-item"><span className="stat-label">Mémoire</span><strong className="stat-value small">{memory}</strong></div>
    </div>
  );
}
