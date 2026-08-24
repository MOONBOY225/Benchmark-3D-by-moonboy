import { useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Benchmark from './components/Benchmark';
import Stats from './components/Stats';
import { fetchLeaderboard, submitScore, supabase } from './services/supabase';
import './App.css';

const difficulties = {
  easy: { label: 'Facile', initialMeshes: 100, step: 25 },
  normal: { label: 'Normal', initialMeshes: 250, step: 50 },
  hard: { label: 'Difficile', initialMeshes: 500, step: 100 },
};
const modes = {
  gpu: { label: 'GPU / WebGL', note: 'Mesure réelle du rendu 3D.' },
  cpu: { label: 'CPU (simulation)', note: 'Charge JavaScript indicative, pas un benchmark matériel.' },
  stability: { label: 'Stabilité (simulation)', note: 'Analyse de la régularité des images côté navigateur.' },
};

function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  const platform = navigator.userAgentData?.platform || navigator.platform || 'Inconnu';
  const browser = userAgent.includes('Chrome') ? 'Chrome'
    : userAgent.includes('Firefox') ? 'Firefox'
    : userAgent.includes('Safari') ? 'Safari'
    : 'Navigateur web';

  return {
    platform,
    browser,
    cores: navigator.hardwareConcurrency || 'N/A',
    screen: `${window.screen.width} × ${window.screen.height}`,
  };
}

function App() {
  const [stats, setStats] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [difficulty, setDifficulty] = useState('normal');
  const [duration, setDuration] = useState(30);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState('gpu');
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

  const saveResult = async (result) => {
    const entry = { ...result, difficulty, mode, date: new Date().toISOString(), device };
    const nextHistory = [entry, ...history].slice(0, 20);
    setHistory(nextHistory);
    localStorage.setItem('benchmark-history', JSON.stringify(nextHistory));
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
    const text = `3D Benchmark — ${modes[mode].label}: ${stats.score.toLocaleString('fr-FR')} points, ${stats.averageFps} FPS moyen.`;
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

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await appRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="app" ref={appRef}>
      <header className="header">
        <div>
          <h1>📱 3D Benchmark</h1>
          <p>Mesurez les performances graphiques de votre téléphone</p>
        </div>
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          {isFullscreen ? '⤢ Quitter plein écran' : '⛶ Plein écran'}
        </button>
      </header>

      <main className="container">
        <div className="canvas-wrapper">
          <Canvas camera={{ position: [0, 0, 5] }} dpr={[1, 2]}>
            <Benchmark
              difficulty={difficulties[difficulty]}
              duration={duration}
              mode={mode}
              isRunning={isRunning}
              onComplete={handleComplete}
              onStatsUpdate={setStats}
            />
          </Canvas>
          {isRunning && <div className="running-badge">TEST EN COURS · {stats ? `${stats.elapsed}s / ${duration}s` : `0s / ${duration}s`}</div>}
        </div>

        <aside className="sidebar">
          <button className="start-btn" onClick={toggleBenchmark}>
            {isRunning ? '⏹ Arrêter le test' : '▶ Démarrer le test'}
          </button>

          <div className="controls">
            <label>
              Mode de test
              <select value={mode} onChange={(event) => setMode(event.target.value)} disabled={isRunning}>
                {Object.entries(modes).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
              </select>
            </label>
            <p className="mode-note">{modes[mode].note}</p>
            <label>
              Difficulté
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} disabled={isRunning}>
                {Object.entries(difficulties).map(([value, item]) => (
                  <option key={value} value={value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              Durée
              <select value={duration} onChange={(event) => setDuration(Number(event.target.value))} disabled={isRunning}>
                <option value={15}>15 secondes</option>
                <option value={30}>30 secondes</option>
                <option value={60}>60 secondes</option>
              </select>
            </label>
          </div>

          {stats ? <><Stats {...stats} /><div className="action-row"><button onClick={shareResult}>↗ Partager</button><button onClick={loadLeaderboard}>Classement</button></div></> : <p className="hint">Choisissez un mode puis démarrez le test.</p>}
          {status && <p className="status">{status}</p>}
          {leaderboard.length > 0 && <section className="leaderboard"><h2>Top résultats</h2>{leaderboard.map((item, index) => <p key={item.id || `${item.score}-${index}`}>#{index + 1} · {item.score.toLocaleString('fr-FR')} pts · {item.average_fps} FPS</p>)}</section>}
          <section className="history"><h2>Historique local</h2>{history.length === 0 ? <p>Aucun résultat enregistré.</p> : history.slice(0, 5).map((item, index) => {
            const previous = history[index + 1];
            const delta = previous ? item.score - previous.score : null;
            return <p key={`${item.date}-${index}`}>{new Date(item.date).toLocaleDateString('fr-FR')} · {item.score.toLocaleString('fr-FR')} pts · {modes[item.mode]?.label}{delta !== null && ` (${delta >= 0 ? '+' : ''}${delta.toLocaleString('fr-FR')} vs précédent)`}</p>;
          })}</section>

          <section className="device-info">
            <h2>Appareil</h2>
            <p>{device.platform} · {device.browser}</p>
            <p>{device.cores} cœurs · écran {device.screen}</p>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;
