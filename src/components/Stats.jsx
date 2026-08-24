export default function Stats({ fps, meshCount, memory }) {
  return (
    <div className="stats">
      <div className="stat-item">
        <span className="stat-label">FPS</span>
        <span className={`stat-value ${fps > 50 ? 'good' : fps > 30 ? 'ok' : 'bad'}`}>
          {fps}
        </span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Objets 3D</span>
        <span className="stat-value">{meshCount}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Mémoire</span>
        <span className="stat-value">{memory} MB</span>
      </div>
    </div>
  );
}
