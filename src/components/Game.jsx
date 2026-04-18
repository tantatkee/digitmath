import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generatePuzzle, verifyUserExpression } from '../utils/engine';
import { playClick, playUndo, playCorrect, playWrong, playSkip, playGameOver } from '../utils/sounds';

const MAX_ROUNDS = 10; // per session (single) or per player (multi)

export default function Game({ config, setScreen, setFinalStats }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  // playerRounds tracks how many rounds each player has completed
  const [playerRounds, setPlayerRounds] = useState(Array(config.numPlayers).fill(0));
  const [scores, setScores] = useState(Array(config.numPlayers).fill(0));
  const [multiplier, setMultiplier] = useState(1);

  // Single player: track total session elapsed
  const [sessionStartTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Multiplayer: track accumulated time (seconds) per player
  // playerAccTime stores banked seconds from completed turns
  const [playerAccTime, setPlayerAccTime] = useState(Array(config.numPlayers).fill(0));
  // turnStartTime is a ref so it doesn't cause re-renders
  const turnStartRef = useRef(Date.now());
  // Live ticker for current player's current-turn seconds
  const [turnElapsed, setTurnElapsed] = useState(0);

  const [puzzleDigits, setPuzzleDigits] = useState([]);
  const [expression, setExpression] = useState([]);
  const [toast, setToast] = useState(null);

  // Single player timer
  useEffect(() => {
    if (config.mode !== 'single') return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [config.mode, sessionStartTime]);

  // Multiplayer turn timer
  useEffect(() => {
    if (config.mode !== 'multi') return;
    turnStartRef.current = Date.now();
    setTurnElapsed(0);
    const interval = setInterval(() => {
      setTurnElapsed(Math.floor((Date.now() - turnStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [config.mode, currentPlayerIdx]);

  // Derived penalties
  const singlePenalty = Math.floor(elapsedSeconds / 10);
  const multiCurrentPlayerTotalSecs = (playerAccTime[currentPlayerIdx] || 0) + turnElapsed;
  const multiCurrentPenalty = Math.floor(multiCurrentPlayerTotalSecs / 10);

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

  // Bank the current player's elapsed turn time into their accumulated total
  const bankCurrentTurnTime = (playerIdx, accTime) => {
    const spent = Math.floor((Date.now() - turnStartRef.current) / 1000);
    const updated = [...accTime];
    updated[playerIdx] = (updated[playerIdx] || 0) + spent;
    return updated;
  };

  const endGame = (finalScores, finalAccTime, finalElapsed) => {
    playGameOver();
    // Compute per-player penalties for summary screen
    const penalties = config.mode === 'single'
      ? [Math.floor(finalElapsed / 10)]
      : finalAccTime.map(t => Math.floor(t / 10));
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
      nextScores[currentPlayerIdx] += 10 * multiplier;
      playCorrect();
      showToast('Correct! 🎉', true);
    }

    if (config.mode === 'single') {
      const nextRound = currentRound + 1;
      if (nextRound >= MAX_ROUNDS) {
        const finalElapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        setTimeout(() => endGame(nextScores, [], finalElapsed), solved ? 800 : 0);
      } else {
        setScores(nextScores);
        setCurrentRound(nextRound);
        setTimeout(() => loadNewPuzzle(), solved ? 600 : 0);
      }
    } else {
      // Multiplayer: bank current player's time
      const updatedAccTime = bankCurrentTurnTime(currentPlayerIdx, playerAccTime);
      setPlayerAccTime(updatedAccTime);

      const nextPlayerIdx = (currentPlayerIdx + 1) % config.numPlayers;

      if (skipped) {
        // Same puzzle, doubled points, next player
        setMultiplier(prev => prev * 2);
        setExpression([]);
        setScores(nextScores);
        setCurrentPlayerIdx(nextPlayerIdx);
        showToast('Passed to Player ' + (nextPlayerIdx + 1));
      } else {
        // Puzzle resolved — count a round for the "originating" player
        // (whichever player first received this puzzle, i.e. currentRound % numPlayers)
        // Simpler: just count total shared rounds; game ends when currentRound+1 >= MAX_ROUNDS * numPlayers
        const nextRound = currentRound + 1;
        setMultiplier(1);
        setScores(nextScores);
        setCurrentPlayerIdx(nextPlayerIdx);
        setCurrentRound(nextRound);

        // Check if every player has had MAX_ROUNDS rounds
        if (nextRound >= MAX_ROUNDS * config.numPlayers) {
          const finalElapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
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

  const isUsed = (idx) => expression.some(ex => ex.type === 'number' && ex.index === idx);

  // For the top bar round display in multiplayer — show per-player round count
  const sharedRoundDisplay = `Round ${currentRound + 1}/${MAX_ROUNDS * config.numPlayers}`;
  const singleRoundDisplay = `Round ${currentRound + 1}/${MAX_ROUNDS}`;

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
            <div>{singleRoundDisplay}</div>
            <div className="score-badge">Score: {scores[0]}</div>
          </>
        ) : (
          <>
            <div style={{ color: 'var(--color-primary-dark)' }}>
              Player {currentPlayerIdx + 1} — {sharedRoundDisplay}
            </div>
            <div className="score-badge">
              {scores[currentPlayerIdx]}pts {multiplier > 1 ? `×${multiplier}` : ''}
            </div>
          </>
        )}
      </div>

      {/* Penalty ticker — single player */}
      {config.mode === 'single' && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: singlePenalty > 0 ? '#fee2e2' : '#f1f5f9',
          border: `3px solid ${singlePenalty > 0 ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.4rem 0.75rem',
          fontSize: '0.95rem',
          fontWeight: 'bold',
          transition: 'background 0.4s, border-color 0.4s',
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: multiCurrentPenalty > 0 ? '#fee2e2' : '#f1f5f9',
          border: `3px solid ${multiCurrentPenalty > 0 ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.4rem 0.75rem',
          fontSize: '0.95rem',
          fontWeight: 'bold',
          transition: 'background 0.4s, border-color 0.4s',
        }}>
          <span>⏱ P{currentPlayerIdx + 1} time: {multiCurrentPlayerTotalSecs}s</span>
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

        {/* UNDO + SUBMIT */}
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
