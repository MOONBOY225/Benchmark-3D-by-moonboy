import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Benchmark from './components/Benchmark';
import Stats from './components/Stats';
import FpsGraph from './components/FpsGraph';
import { SCENES, SUITE_SCENE_IDS } from './scenes';
import { fetchLeaderboard, submitScore, supabase } from './services/supabase';
import './App.css';

const difficulties = {
  easy: { label: 'Facile', factor: 0.5 },
  normal: { label: 'Normal', factor: 1 },
  hard: { label: 'Difficile', factor: 2 },
};
const modes = {
  suite: {
    label: 'Suite',
    fullLabel: 'Suite complète',
    note: `Les ${SUITE_SCENE_IDS.length} scènes s'enchaînent automatiquement pour un score global type AnTuTu.`,
  },
  gpu: { label: 'Scène', fullLabel: 'Scène unique', note: 'Choisissez une scène GPU et mesurez sa performance.' },
  cpu: { label: 'CPU', fullLabel: 'CPU multi-cœur', note: `Charge réelle sur tous les cœurs logiques via Web Workers (jusqu'à ${Math.min(navigator.hardwareConcurrency || 4, 16)}).` },
  stability: { label: 'Stabilité', fullLabel: 'Stabilité', note: 'Charge constante et analyse de la régularité des images.' },
};

function detectGpuRenderer() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 'WebGL indisponible';
    const extension = gl.getExtension('WEBGL_debug_renderer_info');
    const value = extension
      ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    return typeof value === 'string' ? value : 'Non identifié';
  } catch {
    return 'Non identifié';
  }
}

function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  const platform = navigator.userAgentData?.platform || navigator.platform || 'Inconnu';
  const browser = userAgent.includes('Edg/') ? 'Edge'
    : userAgent.includes('SamsungBrowser') ? 'Samsung Internet'
    : userAgent.includes('Firefox') ? 'Firefox'
    : userAgent.includes('Chrome') ? 'Chrome'
    : userAgent.includes('Safari') ? 'Safari'
    : 'Navigateur web';

  return {
    platform,
    browser,
    cores: navigator.hardwareConcurrency || 'N/A',
    memory: navigator.deviceMemory ? `${navigator.deviceMemory} Go` : 'N/A',
    screen: `${window.screen.width} × ${window.screen.height}`,
    dpr: window.devicePixelRatio || 1,
    gpu: detectGpuRenderer(),
  };
}

function Segmented({ value, options, onChange, disabled }) {
  return (
    <div className={`segmented${disabled ? ' disabled' : ''}`}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`segment-item${value === option.value ? ' active' : ''}`}
          onClick={() => onChange(option.value)}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function App() {
  const [stats, setStats] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [difficulty, setDifficulty] = useState('normal');
  const [duration, setDuration] = useState(30);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState('suite');
  const [sceneId, setSceneId] = useState('swarm');
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('benchmark-history') || '[]');
    } catch {
      return [];
    }
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [status, setStatus] = useState('');
  const appRef = useRef(null);
  const device = useMemo(() => getDeviceInfo(), []);
  const bestScore = useMemo(
    () => history.reduce((max, item) => (item.mode === mode && item.score > max ? item.score : max), 0),
    [history, mode]
  );
  const progress = stats ? Math.min((stats.elapsed / duration) * 100, 100) : 0;

  useEffect(() => {
    if (!isRunning || !('wakeLock' in navigator)) return undefined;
    let sentinel = null;
    navigator.wakeLock.request('screen')
      .then((lock) => { sentinel = lock; })
      .catch(() => {});
    return () => {
      sentinel?.release?.().catch(() => {});
    };
  }, [isRunning]);

  const saveResult = async (result) => {
    if (!result) return;
    const entry = { ...result, difficulty, mode, date: new Date().toISOString(), device };
    setHistory((previous) => {
      const nextHistory = [entry, ...previous].slice(0, 50);
      localStorage.setItem('benchmark-history', JSON.stringify(nextHistory));
      return nextHistory;
    });
    if (supabase) {
      const response = await submitScore(entry);
      setStatus(response.error ? 'Envoi au classement impossible.' : 'Résultat envoyé au classement.');
    }
  };

  const toggleBenchmark = () => {
    if (isRunning) {
      setIsRunning(false);
      return;
    }
    setStats(null);
    setStatus('');
    setIsRunning(true);
  };

  const handleComplete = (result) => {
    setIsRunning(false);
    if (result) saveResult(result);
  };

  const shareResult = async () => {
    if (!stats) return;
    let text = `3D Benchmark Lite — ${modes[mode].fullLabel}: ${stats.score?.toLocaleString('fr-FR') ?? '--'} points`;
    if (stats.breakdown?.length > 0) {
      text += ` (${stats.breakdown.map((item) => `${item.label} ${item.score?.toLocaleString('fr-FR')}`).join(', ')})`;
    }
    text += `, ${stats.averageFps} FPS moyen.`;
    try {
      if (navigator.share) await navigator.share({ title: 'Mon résultat 3D Benchmark', text });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setStatus('Résultat copié dans le presse-papiers.');
      } else setStatus('Partage et presse-papiers indisponibles.');
    } catch (error) {
      if (error.name !== 'AbortError') setStatus('Partage indisponible.');
    }
  };

  const loadLeaderboard = async () => {
    const response = await fetchLeaderboard(mode);
    setLeaderboard(response.data);
    setStatus(response.disabled ? 'Classement désactivé (variables Supabase absentes).' : response.error ? 'Classement indisponible.' : 'Classement actualisé.');
  };

  const clearHistory = () => {
    localStorage.removeItem('benchmark-history');
    setHistory([]);
  };

  const toggleFullscreen = async () => {
    const element = appRef.current;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (element.requestFullscreen) await element.requestFullscreen();
      else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
      setIsFullscreen(true);
      try {
        await window.screen.orientation?.lock?.('landscape');
      } catch {
        /* le verrouillage d'orientation n'est pas toujours supporté */
      }
    } else {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      window.screen.orientation?.unlock?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="app" ref={appRef}>
      <header className="header">
        <div className="brand">
          <div className="logo-mark">◆</div>
          <div>
            <h1>Benchmark 3D <span className="lite-tag">LITE</span></h1>
            <p>Suite de tests GPU & CPU pour votre appareil</p>
          </div>
        </div>
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          {isFullscreen ? '⤢ Quitter' : '⛶ Plein écran'}
        </button>
      </header>

      <main className="container">
        <div className="canvas-wrapper">
          <Canvas
            camera={{ position: [0, 5, 16], fov: 55 }}
            dpr={[1, 2]}
            shadows
            gl={{ antialias: true, powerPreference: 'high-performance' }}
          >
            <Benchmark
              sceneId={sceneId}
              difficulty={difficulties[difficulty]}
              duration={duration}
              mode={mode}
              isRunning={isRunning}
              onComplete={handleComplete}
              onStatsUpdate={setStats}
            />
          </Canvas>
          {isRunning && (
            <>
              <div className="scene-badge">
                <span>{stats?.sceneIcon || '▶'}</span>
                {stats?.sceneLabel || 'Préparation'}
                <em>{stats ? `${stats.elapsed}s / ${duration}s` : `0s / ${duration}s`}</em>
              </div>
              <div className="run-progress"><span style={{ width: `${progress}%` }} /></div>
            </>
          )}
        </div>

        <aside className="sidebar">
          <button className="start-btn" onClick={toggleBenchmark}>
            {isRunning ? '⏹ Arrêter le test' : '▶ Lancer le benchmark'}
          </button>

          <div className="controls">
            <span className="control-title">Mode</span>
            <Segmented
              value={mode}
              onChange={setMode}
              disabled={isRunning}
              options={Object.entries(modes).map(([value, item]) => ({ value, label: item.label }))}
            />
            <p className="mode-note">{modes[mode].note}</p>

            {mode === 'gpu' && (
              <>
                <span className="control-title">Scène</span>
                <div className="chips">
                  {SUITE_SCENE_IDS.map((id) => (
                    <button
                      key={id}
                      className={`chip${sceneId === id ? ' active' : ''}`}
                      onClick={() => setSceneId(id)}
                      disabled={isRunning}
                    >
                      {SCENES[id].icon} {SCENES[id].label}
                    </button>
                  ))}
                </div>
                <p className="mode-note">{SCENES[sceneId].description}</p>
              </>
            )}

            <span className="control-title">Intensité</span>
            <Segmented
              value={difficulty}
              onChange={setDifficulty}
              disabled={isRunning}
              options={Object.entries(difficulties).map(([value, item]) => ({ value, label: item.label }))}
            />

            <span className="control-title">Durée</span>
            <Segmented
              value={duration}
              onChange={setDuration}
              disabled={isRunning}
              options={[15, 30, 60].map((value) => ({ value, label: `${value}s` }))}
            />
          </div>

          {stats ? (
            <>
              <Stats {...stats} />
              <FpsGraph samples={stats.samples} />
              <div className="action-row">
                <button onClick={shareResult}>↗ Partager</button>
                <button onClick={loadLeaderboard}>Classement</button>
              </div>
            </>
          ) : (
            <p className="hint">Choisissez un mode puis lancez le benchmark.</p>
          )}
          {status && <p className="status">{status}</p>}
          {leaderboard.length > 0 && (
            <section className="leaderboard">
              <h2>Top résultats</h2>
              {leaderboard.map((item, index) => (
                <p key={item.id || `${item.score}-${index}`}>#{index + 1} · {item.score.toLocaleString('fr-FR')} pts · {item.average_fps} FPS</p>
              ))}
            </section>
          )}
          <section className="history">
            <div className="section-heading">
              <h2>Historique local</h2>
              {history.length > 0 && <button className="clear-btn" onClick={clearHistory}>Effacer</button>}
            </div>
            {history.length === 0 ? <p>Aucun résultat enregistré.</p> : history.slice(0, 8).map((item, index) => {
              const previous = history[index + 1];
              const delta = previous ? item.score - previous.score : null;
              const isBest = item.mode === mode && item.score === bestScore && bestScore > 0;
              return (
                <p key={`${item.date}-${index}`}>
                  {new Date(item.date).toLocaleDateString('fr-FR')} · {item.score.toLocaleString('fr-FR')} pts · {modes[item.mode]?.fullLabel || item.mode}
                  {isBest && ' 🏆'}
                  {delta !== null && ` (${delta >= 0 ? '+' : ''}${delta.toLocaleString('fr-FR')})`}
                </p>
              );
            })}
          </section>

          <section className="device-info">
            <h2>Appareil</h2>
            <p>{device.platform} · {device.browser}</p>
            <p className="gpu-name">{device.gpu}</p>
            <p>{device.cores} cœurs · RAM {device.memory} · écran {device.screen} @{device.dpr}x</p>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;
