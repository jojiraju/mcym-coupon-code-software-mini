import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FiShuffle, FiAward, FiTrash2, FiRotateCcw, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

const WINNERS_KEY = 'mcymLuckyDrawWinners';
const LOOPS = 6;
const STRIP = Array.from({ length: LOOPS * 10 }, (_, i) => i % 10);
const CONFETTI_COLORS = ['#dca84a', '#f3d38b', '#ffffff', '#e05a74', '#941c34'];

const loadWinners = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(WINNERS_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

// Unbiased random index using the crypto API
const randomIndex = (max) => {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
};

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '';

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Reel({ index, duration }) {
  return (
    <div className="ld-reel">
      <div
        className="ld-strip"
        style={{
          transform: `translateY(calc(${index} * -1.3em))`,
          transition: duration ? `transform ${duration}ms cubic-bezier(.12, .78, .2, 1)` : 'none'
        }}
      >
        {STRIP.map((d, i) => <span key={i}>{d}</span>)}
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 42 }, (_, i) => ({
    x: `${(Math.random() - 0.5) * 900}px`,
    y: `${Math.random() * 260 + 60}px`,
    up: `${-(Math.random() * 220 + 80)}px`,
    r: `${(Math.random() - 0.5) * 1080}deg`,
    delay: `${Math.random() * 120}ms`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    w: Math.random() > 0.5 ? 8 : 6,
    h: Math.random() > 0.5 ? 14 : 8
  })), []);

  return (
    <div className="ld-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{ '--x': p.x, '--y': p.y, '--up': p.up, '--r': p.r, animationDelay: p.delay, background: p.color, width: p.w, height: p.h }}
        />
      ))}
    </div>
  );
}

function LuckyDraw({ coupons, toast }) {
  const [winners, setWinners] = useState(loadWinners);
  const [reels, setReels] = useState([]);
  const [phase, setPhase] = useState('idle'); // idle | spinning | won
  const [revealed, setRevealed] = useState(null);
  const [drawCount, setDrawCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef(null);
  const stageRef = useRef(null);
  const listRef = useRef(null);
  const drawRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(WINNERS_KEY, JSON.stringify(winners));
    } catch {
      // Storage unavailable; winners stay in memory for this session
    }
  }, [winners]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Space bar draws, unless focus is on a control that handles it itself
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space' || e.repeat) return;
      if (e.target.closest?.('button, input, textarea, select, a, [contenteditable]')) return;
      e.preventDefault();
      drawRef.current?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [winners.length]);

  const wonNumbers = useMemo(() => new Set(winners.map(w => w.number)), [winners]);
  const eligible = useMemo(() => coupons.filter(c => !wonNumbers.has(c.number)), [coupons, wonNumbers]);
  const width = useMemo(() => Math.max(3, ...coupons.map(c => String(c.number).length)), [coupons]);
  const reelState = Array.from({ length: width }, (_, i) => reels[i] || { index: 0, duration: 0 });

  const handleDraw = () => {
    if (phase === 'spinning') return;
    if (!coupons.length) return toast.error('There are no registered coupons.');
    if (!eligible.length) return toast.error('Every coupon has already won.');

    const winner = eligible[randomIndex(eligible.length)];
    const digits = String(winner.number).padStart(width, '0').split('').map(Number);
    const reduced = prefersReducedMotion();
    const base = reduced ? 400 : 2200;
    const stagger = reduced ? 80 : 450;

    clearTimeout(timerRef.current);
    setRevealed(null);
    setPhase('spinning');
    // Snap each reel back to the same digit in its first loop, then roll to the last loop
    setReels(reelState.map(r => ({ index: r.index % 10, duration: 0 })));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setReels(digits.map((d, i) => ({ index: (LOOPS - 1) * 10 + d, duration: base + i * stagger })));
    }));

    timerRef.current = setTimeout(() => {
      setPhase('won');
      setRevealed(winner);
      setDrawCount(c => c + 1);
      setWinners(prev => [...prev, { ...winner, drawnAt: Date.now() }]);
    }, base + (digits.length - 1) * stagger + 120);
  };
  drawRef.current = handleDraw;

  const handleRemoveWinner = (number) => {
    setWinners(prev => prev.filter(w => w.number !== number));
    if (revealed?.number === number) {
      setRevealed(null);
      setPhase('idle');
    }
  };

  const handleReset = () => {
    if (!window.confirm('Clear all winners and start a new draw?')) return;
    clearTimeout(timerRef.current);
    setWinners([]);
    setRevealed(null);
    setReels([]);
    setPhase('idle');
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else stageRef.current?.requestFullscreen?.().catch(() => toast.error('Fullscreen is not available.'));
  };

  const isSpinning = phase === 'spinning';
  const winnerRank = revealed ? winners.findIndex(w => w.number === revealed.number) + 1 : 0;

  return (
    <div className="ld-layout">
      <section className="ld-main">
        <div className="ld-stats">
          <div><span>In the draw</span><b>{eligible.length.toLocaleString('en-IN')}</b></div>
          <div><span>Winners</span><b>{winners.length.toLocaleString('en-IN')}</b></div>
          <div><span>Registered</span><b>{coupons.length.toLocaleString('en-IN')}</b></div>
        </div>

        <div ref={stageRef} className={`ld-stage is-${phase}`}>
          <div className="ld-stage-top">
            <span className="ld-status">
              <i />{isSpinning ? 'Drawing' : revealed ? `${ordinal(winnerRank)} winner` : 'Ready'}
            </span>
            <button className="ld-icon-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
          </div>

          {isFullscreen && <div className="ld-stage-brand">MCYM Lucky Draw</div>}

          <div className="ld-reels" aria-live="polite" aria-label={revealed ? `Coupon ${revealed.number}` : undefined}>
            <span className="ld-hash">#</span>
            {reelState.map((r, i) => <Reel key={i} index={r.index} duration={r.duration} />)}
          </div>

          <div className="ld-result">
            {revealed ? (
              <div className="ld-winner" key={drawCount}>
                <div className="ld-avatar">{initials(revealed.name)}</div>
                <div>
                  <strong>{revealed.name}</strong>
                  <span>{[revealed.unit, revealed.phone].filter(Boolean).join('  ·  ') || 'No details'}</span>
                </div>
              </div>
            ) : (
              <p className="ld-hint">
                {isSpinning ? `Shuffling ${eligible.length.toLocaleString('en-IN')} coupons…` : 'Press draw to pick a winner'}
              </p>
            )}
          </div>

          {isFullscreen && (
            <button className="ld-draw ld-draw-fs" onClick={handleDraw} disabled={isSpinning || !eligible.length}>
              <FiShuffle /> {isSpinning ? 'Drawing…' : winners.length ? 'Draw next winner' : 'Draw winner'}
            </button>
          )}

          {phase === 'won' && <Confetti key={drawCount} />}
        </div>

        <button className="ld-draw" onClick={handleDraw} disabled={isSpinning || !eligible.length}>
          <FiShuffle />
          <span>{isSpinning ? 'Drawing…' : winners.length ? 'Draw next winner' : 'Draw winner'}</span>
          <kbd>Space</kbd>
        </button>
      </section>

      <aside className="ld-panel">
        <header className="ld-panel-head">
          <div>
            <h2><FiAward /> Winners</h2>
            <p>{winners.length ? `${winners.length} drawn` : 'Nobody yet'}</p>
          </div>
          {winners.length > 0 && (
            <button className="ld-ghost-btn" onClick={handleReset} disabled={isSpinning}>
              <FiRotateCcw /> Reset
            </button>
          )}
        </header>

        {winners.length ? (
          <ol className="ld-list" ref={listRef}>
            {winners.map((w, i) => (
              <li key={w.number} className={revealed?.number === w.number ? 'is-latest' : ''}>
                <span className={`ld-rank rank-${i + 1}`}>{i + 1}</span>
                <div className="ld-list-info">
                  <strong>{w.name}</strong>
                  <span>{w.unit || 'No unit'}{w.drawnAt ? ` · ${formatTime(w.drawnAt)}` : ''}</span>
                </div>
                <span className="ld-chip">#{w.number}</span>
                <button className="ld-remove" onClick={() => handleRemoveWinner(w.number)} title="Remove winner" aria-label={`Remove winner #${w.number}`} disabled={isSpinning}>
                  <FiTrash2 />
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <div className="ld-empty">
            <div className="ld-empty-icon"><FiAward /></div>
            <b>No winners yet</b>
            <span>Winners appear here in the order they're drawn.</span>
          </div>
        )}
      </aside>
    </div>
  );
}

export default LuckyDraw;
