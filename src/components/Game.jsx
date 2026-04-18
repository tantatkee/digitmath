import React, { useState, useEffect, useCallback } from 'react';
import { generatePuzzle, verifyUserExpression } from '../utils/engine';
import { playClick, playUndo, playCorrect, playWrong, playSkip, playGameOver } from '../utils/sounds';

const MAX_ROUNDS_SINGLE = 20;

export default function Game({ config, setScreen, setFinalStats }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [scores, setScores] = useState(Array(config.numPlayers).fill(0));
  const [multiplier, setMultiplier] = useState(1);
  const [sessionStartTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [puzzleDigits, setPuzzleDigits] = useState([]);
  const [expression, setExpression] = useState([]);
  const [toast, setToast] = useState(null);

  // Timer — updates every second
  useEffect(() => {
    if (config.mode !== 'single') return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [config.mode, sessionStartTime]);

  const currentPenalty = Math.floor(elapsedSeconds / 10);

  const loadNewPuzzle = useCallback(() => {
    const digits = generatePuzzle(config.difficulty);
    setPuzzleDigits(digits);
    setExpression([]);
  }, [config.difficulty]);

  useEffect(() => {
    loadNewPuzzle();
  }, [loadNewPuzzle]);

  const showToast = (msg, isSuccess = false) => {
    setToast({ msg, isSuccess });
    setTimeout(() => setToast(null), 1500);
  };

  const handleBlockClick = (type, val, index) => {
    if (type === 'number' && expression.some(ex => ex.type === 'number' && ex.index === index)) {
      return;
    }
    playClick();
    setExpression(prev => [...prev, { type, val, index }]);
  };

  const undo = () => {
    if (expression.length === 0) return;
    playUndo();
    setExpression(prev => prev.slice(0, -1));
  };

  const endGame = (finalScores) => {
    const finalElapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    playGameOver();
    setFinalStats({ scores: finalScores, time: finalElapsed, mode: config.mode });
    setScreen('summary');
  };

  const nextTurn = (solved, skipped) => {
    let nextScores = [...scores];

    if (solved) {
      nextScores[currentPlayerIdx] += 10 * multiplier;
      playCorrect();
      showToast('Correct! 🎉', true);
    }

    if (config.mode === 'single') {
      if (currentRound + 1 >= MAX_ROUNDS_SINGLE) {
        setTimeout(() => endGame(nextScores), solved ? 800 : 0);
      } else {
        setScores(nextScores);
        setCurrentRound(r => r + 1);
        setTimeout(() => loadNewPuzzle(), solved ? 600 : 0);
      }
    } else {
      setScores(nextScores);
      setCurrentPlayerIdx((currentPlayerIdx + 1) % config.numPlayers);
      if (skipped) {
        setMultiplier(prev => prev * 2);
        setExpression([]);
        showToast('Passed to Player ' + (((currentPlayerIdx + 1) % config.numPlayers) + 1));
      } else {
        setMultiplier(1);
        setCurrentRound(r => r + 1);
        setTimeout(() => loadNewPuzzle(), solved ? 600 : 0);
      }
    }
  };

  const handleCheck = () => {
    if (expression.length === 0) return;
    playClick();
    const rawExpr = expression.map(e => e.val);
    const result = verifyUserExpression(rawExpr, puzzleDigits);
    if (result.valid) {
      nextTurn(true, false);
    } else {
      playWrong();
      showToast(result.message);
    }
  };

  const handleSkip = () => {
    playSkip();
    nextTurn(false, true);
  };

  const isUsed = (idx) => expression.some(ex => ex.type === 'number' && ex.index === idx);

  return (
    <div className="screen" style={{ padding: '0.75rem', gap: '0.5rem' }}>
      {toast && (
        <div className={`toast ${toast.isSuccess ? 'success' : ''}`}>
          {toast.msg}
        </div>
      )}

      {/* Top bar: round + score */}
      <div className="top-bar" style={{ marginBottom: 0 }}>
        {config.mode === 'single' ? (
          <>
            <div>Round {currentRound + 1}/{MAX_ROUNDS_SINGLE}</div>
            <div className="score-badge">Score: {scores[0]}</div>
          </>
        ) : (
          <>
            <div style={{ color: 'var(--color-primary-dark)' }}>Player {currentPlayerIdx + 1}'s Turn</div>
            <div className="score-badge">{scores[currentPlayerIdx]}pts {multiplier > 1 ? `×${multiplier}` : ''}</div>
          </>
        )}
      </div>

      {/* Single-player penalty ticker */}
      {config.mode === 'single' && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: currentPenalty > 0 ? '#fee2e2' : '#f1f5f9',
          border: `3px solid ${currentPenalty > 0 ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.4rem 0.75rem',
          fontSize: '0.95rem',
          fontWeight: 'bold',
          transition: 'background 0.4s, border-color 0.4s',
        }}>
          <span>⏱ Time: {elapsedSeconds}s</span>
          <span style={{ color: currentPenalty > 0 ? 'var(--color-danger)' : 'var(--color-border)' }}>
            Penalty: −{currentPenalty} pts
          </span>
        </div>
      )}

      {/* Multiplayer all-scores bar */}
      {config.mode === 'multi' && (
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
          {scores.map((s, i) => `P${i + 1}: ${s}`).join(' | ')}
        </div>
      )}

      <div className="card" style={{
        flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem',
        padding: '0.75rem', overflow: 'hidden'
      }}>
        <h3 style={{ textAlign: 'center', fontSize: '1.1rem', color: 'var(--color-text)', marginBottom: 0 }}>
          Build an Equation!
        </h3>

        {/* Equation display — fixed height to prevent layout shifts */}
        <div className="equation-display" style={{
          height: '64px',
          minHeight: 'unset',
          padding: '0.4rem 0.75rem',
          marginBottom: 0,
          overflowX: 'auto',
          overflowY: 'hidden',
          flexWrap: 'nowrap',
          justifyContent: expression.length === 0 ? 'center' : 'flex-start',
        }}>
          {expression.length === 0 ? (
            <span style={{ color: '#ccc', fontSize: '1rem' }}>Tap blocks below to build...</span>
          ) : (
            expression.map((item, i) => (
              <span key={i} className="equation-item" style={{
                fontSize: '1.8rem',
                padding: '0.05rem 0.45rem',
                flexShrink: 0,
                borderColor: item.type === 'op' ? 'var(--color-secondary)' : 'var(--color-border)',
                color: item.type === 'op' ? 'var(--color-secondary-dark)' : 'var(--color-text)'
              }}>
                {item.val}
              </span>
            ))
          )}
        </div>

        {/* UNDO + SUBMIT side by side (CLEAR removed) */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-danger"
            style={{ flex: 1, padding: '0.6rem', fontSize: '1rem', marginBottom: 0, width: 'auto' }}
            onClick={undo}
            disabled={expression.length === 0}
          >UNDO</button>
          <button
            className="btn btn-success"
            style={{ flex: 1, padding: '0.6rem', fontSize: '1rem', marginBottom: 0, width: 'auto' }}
            onClick={handleCheck}
          >SUBMIT ✓</button>
        </div>

        {/* Number digit blocks */}
        <div className="block-row" style={{ marginBottom: 0 }}>
          {puzzleDigits.map((digit, i) => {
            const used = isUsed(i);
            return (
              <button
                key={i}
                className={`btn btn-block ${used ? '' : 'btn-primary'}`}
                style={{ opacity: used ? 0.3 : 1, fontSize: '1.8rem', minWidth: '52px', padding: '0.6rem' }}
                onClick={() => handleBlockClick('number', digit, i)}
                disabled={used}
              >
                {digit}
              </button>
            );
          })}
        </div>

        {/* Operator blocks */}
        <div className="block-row" style={{ marginBottom: 0 }}>
          {['+', '-', '×', '÷', '='].map((op, idx) => {
            const rawOp = ['+', '-', '*', '/', '='][idx];
            return (
              <button
                key={op}
                className="btn btn-block btn-secondary"
                style={{ fontSize: '1.8rem', minWidth: '52px', padding: '0.6rem' }}
                onClick={() => handleBlockClick('op', rawOp)}
              >
                {op}
              </button>
            );
          })}
        </div>

        {/* Skip */}
        <button
          className="btn"
          onClick={handleSkip}
          style={{
            backgroundColor: '#94a3b8', boxShadow: '0 6px 0 0 #64748b',
            padding: '0.6rem', fontSize: '1.1rem', marginBottom: 0, marginTop: 'auto'
          }}
        >
          {config.mode === 'multi' ? '⏭ SKIP TO NEXT PLAYER' : '⏭ SKIP ROUND'}
        </button>
      </div>
    </div>
  );
}
