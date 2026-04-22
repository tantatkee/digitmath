import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generatePuzzle, verifyUserExpression } from '../utils/engine';
import { playClick, playUndo, playCorrect, playWrong, playSkip, playGameOver } from '../utils/sounds';

const MAX_ROUNDS = 10; // per session (single) or per player (multi)

export default function Game({ config, setScreen, setFinalStats }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [scores, setScores] = useState(Array(config.numPlayers).fill(0));
  const [bonusPoints, setBonusPoints] = useState(0);

  // Single player: track total session elapsed
  const [sessionStartTime] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Multiplayer: accumulated time (seconds) banked from completed turns
  const [playerAccTime, setPlayerAccTime] = useState(Array(config.numPlayers).fill(0));
  const turnStartRef = useRef(null);
  const pauseOffsetRef = useRef(0);  // milliseconds paused during this turn
  const pauseStartRef = useRef(null); // when the current pause began
  const [turnElapsed, setTurnElapsed] = useState(0);

  const [puzzleDigits, setPuzzleDigits] = useState(() => generatePuzzle(config.difficulty));
  const [expression, setExpression] = useState([]);
  const [toast, setToast] = useState(null);
  const [isAbortDialogOpen, setIsAbortDialogOpen] = useState(false);

  // Single player timer — respects pause offset
  useEffect(() => {
    if (config.mode !== 'single') return;
    const interval = setInterval(() => {
      const paused = pauseOffsetRef.current +
        (pauseStartRef.current ? Date.now() - pauseStartRef.current : 0);
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime - paused) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [config.mode, sessionStartTime]);

  // Helper to get total net elapsed session time (minus pauses)
  const getNetSessionTime = () => {
    const paused = pauseOffsetRef.current +
      (pauseStartRef.current ? Date.now() - pauseStartRef.current : 0);
    return Math.floor((Date.now() - sessionStartTime - paused) / 1000);
  };

  // Multiplayer turn timer — respects pause offset
  useEffect(() => {
    if (config.mode !== 'multi') return;
    
    // Initialize or reset turn start
    turnStartRef.current = Date.now();
    pauseOffsetRef.current = 0;
    pauseStartRef.current = null;
    
    // Defer reset to avoid synchronous setState in effect warning
    queueMicrotask(() => setTurnElapsed(0));

    const interval = setInterval(() => {
      const start = turnStartRef.current || Date.now();
      const paused = pauseOffsetRef.current +
        (pauseStartRef.current ? Date.now() - pauseStartRef.current : 0);
      setTurnElapsed(Math.floor((Date.now() - start - paused) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [config.mode, currentPlayerIdx]);

  // Derived penalties
  const singlePenalty = Math.floor(elapsedSeconds / 600);
  const multiCurrentPlayerTotalSecs = (playerAccTime[currentPlayerIdx] || 0) + turnElapsed;
  const multiCurrentPenalty = Math.floor(multiCurrentPlayerTotalSecs / 30);

  const loadNewPuzzle = useCallback(() => {
    const digits = generatePuzzle(config.difficulty);
    setPuzzleDigits(digits);
    setExpression([]);
  }, [config.difficulty]);

  // We no longer need the mount-only useEffect for loadNewPuzzle as we initialize it in useState

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

  // Bank current player's elapsed turn time into their accumulated total
  const bankCurrentTurnTime = (playerIdx, accTime) => {
    const paused = pauseOffsetRef.current +
      (pauseStartRef.current ? Date.now() - pauseStartRef.current : 0);
    const spent = Math.floor((Date.now() - turnStartRef.current - paused) / 1000);
    const updated = [...accTime];
    updated[playerIdx] = (updated[playerIdx] || 0) + spent;
    return updated;
  };

  const endGame = (finalScores, finalAccTime, finalElapsed) => {
    playGameOver();
    const penalties = config.mode === 'single'
      ? [Math.floor(finalElapsed / 600)]
      : finalAccTime.map(t => Math.floor(t / 30));
    setFinalStats({
      scores: finalScores,
      penalties,
      time: finalElapsed,
      mode: config.mode,
      numPlayers: config.numPlayers,
    });
    setScreen('summary');
  };

  const nextTurn = (solved, skipped) => {
    let nextScores = [...scores];

    if (solved) {
      nextScores[currentPlayerIdx] += 10 + bonusPoints;
      playCorrect();
      showToast('Correct! 🎉', true);
    }

    if (config.mode === 'single') {
      const nextRound = currentRound + 1;
      if (nextRound >= MAX_ROUNDS) {
        const finalElapsed = getNetSessionTime();
        setTimeout(() => endGame(nextScores, [], finalElapsed), solved ? 800 : 0);
      } else {
        setScores(nextScores);
        setCurrentRound(nextRound);
        setTimeout(() => loadNewPuzzle(), solved ? 600 : 0);
      }
    } else {
      const updatedAccTime = bankCurrentTurnTime(currentPlayerIdx, playerAccTime);
      setPlayerAccTime(updatedAccTime);
      const nextPlayerIdx = (currentPlayerIdx + 1) % config.numPlayers;

      if (skipped) {
        setBonusPoints(prev => prev + 1);
        setExpression([]);
        setScores(nextScores);
        setCurrentPlayerIdx(nextPlayerIdx);
        showToast('Passed to Player ' + (nextPlayerIdx + 1));
      } else {
        const nextRound = currentRound + 1;
        setBonusPoints(0);
        setScores(nextScores);
        setCurrentPlayerIdx(nextPlayerIdx);
        setCurrentRound(nextRound);
        if (nextRound >= MAX_ROUNDS * config.numPlayers) {
          const finalElapsed = getNetSessionTime();
          setTimeout(() => endGame(nextScores, updatedAccTime, finalElapsed), solved ? 800 : 0);
        } else {
          setTimeout(() => loadNewPuzzle(), solved ? 600 : 0);
        }
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

  // Abort dialog: pause the timer when it opens, unpause on cancel
  const openAbortDialog = () => {
    pauseStartRef.current = Date.now();
    setIsAbortDialogOpen(true);
  };

  const cancelAbort = () => {
    // Bank the paused duration so it's not counted as turn time
    if (pauseStartRef.current) {
      pauseOffsetRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    setIsAbortDialogOpen(false);
  };

  const confirmAbort = () => {
    setIsAbortDialogOpen(false);
    setScreen('menu');
  };

  const isUsed = (idx) => expression.some(ex => ex.type === 'number' && ex.index === idx);

  const sharedRoundDisplay = `Round ${currentRound + 1}/${MAX_ROUNDS * config.numPlayers}`;
  const singleRoundDisplay = `Round ${currentRound + 1}/${MAX_ROUNDS}`;

  return (
    <div className="screen" style={{ padding: '0.75rem', gap: '0.5rem', position: 'relative' }}>

      {/* Abort confirmation overlay */}
      {isAbortDialogOpen && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 200,
          background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '0',
          padding: '2rem',
        }}>
          <div style={{
            background: 'white', borderRadius: 'var(--radius-xl)',
            padding: '2rem', textAlign: 'center', width: '100%', maxWidth: '340px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⛔</div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>Abort Game?</h2>
            <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              This will end the session for all players. Current scores will be lost.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-danger"
                style={{ flex: 1, marginBottom: 0, fontSize: '1.1rem', padding: '0.75rem' }}
                onClick={confirmAbort}
              >
                Yes, Abort
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, marginBottom: 0, fontSize: '1.1rem', padding: '0.75rem' }}
                onClick={cancelAbort}
              >
                Keep Playing
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.isSuccess ? 'success' : ''}`}>
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div className="top-bar" style={{ marginBottom: 0 }}>
        {config.mode === 'single' ? (
          <>
            <div>{singleRoundDisplay}</div>
            <div className="score-badge">Score: {scores[0]}</div>
          </>
        ) : (
          <>
            <div style={{ color: 'var(--color-primary-dark)' }}>
              P{currentPlayerIdx + 1} — {sharedRoundDisplay}
            </div>
            <div className="score-badge">
              {scores[currentPlayerIdx]}pts {bonusPoints > 0 ? `(+${bonusPoints})` : ''}
            </div>
          </>
        )}
      </div>

      {/* Penalty ticker — single player */}
      {config.mode === 'single' && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: singlePenalty > 0 ? '#fee2e2' : '#f1f5f9',
          border: `3px solid ${singlePenalty > 0 ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)', padding: '0.4rem 0.75rem',
          fontSize: '0.95rem', fontWeight: 'bold', transition: 'background 0.4s, border-color 0.4s',
        }}>
          <span>⏱ Time: {elapsedSeconds}s</span>
          <span style={{ color: singlePenalty > 0 ? 'var(--color-danger)' : 'var(--color-border)' }}>
            Penalty: −{singlePenalty} pts
          </span>
        </div>
      )}

      {/* Penalty ticker — multiplayer (current player only) */}
      {config.mode === 'multi' && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: multiCurrentPenalty > 0 ? '#fee2e2' : '#f1f5f9',
          border: `3px solid ${multiCurrentPenalty > 0 ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)', padding: '0.4rem 0.75rem',
          fontSize: '0.95rem', fontWeight: 'bold', transition: 'background 0.4s, border-color 0.4s',
        }}>
          <span>⏱ P{currentPlayerIdx + 1}: {multiCurrentPlayerTotalSecs}s</span>
          <span style={{ color: multiCurrentPenalty > 0 ? 'var(--color-danger)' : 'var(--color-border)' }}>
            Penalty: −{multiCurrentPenalty} pts
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
        padding: '0.75rem', overflow: 'hidden',
      }}>
        <h3 style={{ textAlign: 'center', fontSize: '1.1rem', color: 'var(--color-text)', marginBottom: 0 }}>
          Build an Equation!
        </h3>

        {/* Equation display — fixed height */}
        <div className="equation-display" style={{
          height: '110px', minHeight: 'unset', padding: '0.4rem 0.75rem', marginBottom: 0,
          overflowX: 'hidden', overflowY: 'auto', flexWrap: 'wrap',
          justifyContent: expression.length === 0 ? 'center' : 'flex-start',
        }}>
          {expression.length === 0 ? (
            <span style={{ color: '#ccc', fontSize: '1rem' }}>Tap blocks below to build...</span>
          ) : (
            expression.map((item, i) => (
              <span key={i} className="equation-item" style={{
                fontSize: '1.8rem', padding: (item.val === '(' || item.val === ')') ? '0.05rem 0.2rem' : '0.05rem 0.45rem', flexShrink: 0,
                borderColor: item.type === 'op' ? 'var(--color-secondary)' : 'var(--color-border)',
                color: 'var(--color-text)',
                minWidth: (item.val === '(' || item.val === ')') ? '20px' : 'unset',
                textAlign: 'center',
                fontFamily: (item.val === '(' || item.val === ')') ? 'sans-serif' : 'inherit',
                fontWeight: (item.val === '(' || item.val === ')') ? '500' : '700'
              }}>
                {item.val}
              </span>
            ))
          )}
        </div>

        {/* UNDO + SUBMIT */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-danger"
            style={{ flex: 1, padding: '0.6rem', fontSize: '1rem', marginBottom: 0, width: 'auto' }}
            onClick={undo} disabled={expression.length === 0}
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
              >{digit}</button>
            );
          })}
        </div>

        {/* Operator blocks */}
        <div className="block-row" style={{ marginBottom: 0 }}>
          {['+', '-', '×', '÷', '(', ')', '='].map((op, idx) => {
            const rawOp = ['+', '-', '*', '/', '(', ')', '='][idx];
            const isParen = op === '(' || op === ')';
            return (
              <button
                key={op}
                className="btn btn-block btn-secondary"
                style={{ 
                  fontSize: '1.8rem', 
                  minWidth: isParen ? '32px' : '46px', 
                  padding: isParen ? '0.6rem 0.2rem' : '0.6rem',
                  fontFamily: isParen ? 'sans-serif' : 'inherit',
                  fontWeight: isParen ? '500' : '600'
                }}
                onClick={() => handleBlockClick('op', rawOp)}
              >{op}</button>
            );
          })}
        </div>

        {/* Bottom action row: SKIP + ABORT */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
          <button
            className="btn"
            onClick={handleSkip}
            style={{
              flex: 1,
              backgroundColor: '#94a3b8', boxShadow: '0 6px 0 0 #64748b',
              padding: '0.6rem', fontSize: '1rem', marginBottom: 0,
            }}
          >
            {config.mode === 'multi' ? '⏭ SKIP' : '⏭ SKIP ROUND'}
          </button>

          <button
            className="btn btn-danger"
            style={{ flex: 1, padding: '0.6rem', fontSize: '1rem', marginBottom: 0, width: 'auto' }}
            onClick={openAbortDialog}
          >
            ✕ ABORT
          </button>
        </div>
      </div>
    </div>
  );
}
