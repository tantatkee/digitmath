import React, { useState, useEffect, useCallback } from 'react';
import { generatePuzzle, verifyUserExpression } from '../utils/engine';

const MAX_ROUNDS_SINGLE = 20;

export default function Game({ config, setScreen, setFinalStats }) {
  const [currentRound, setCurrentRound] = useState(0); // 0-indexed round
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [scores, setScores] = useState(Array(config.numPlayers).fill(0));
  const [multiplier, setMultiplier] = useState(1);
  const [sessionStartTime] = useState(Date.now());
  
  const [puzzleDigits, setPuzzleDigits] = useState([]);
  const [expression, setExpression] = useState([]); // array of { type: 'number'|'op', val: X, index?: int }
  const [toast, setToast] = useState(null);

  // Initialize a new puzzle
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
    // If it's a number and already used, ignore
    if (type === 'number' && expression.some(ex => ex.type === 'number' && ex.index === index)) {
      return;
    }
    // Cannot have two consecutive numbers.
    // We strictly enforce alternating for simplicity?
    // Let's just allow them to build any string, but verification checks if it's correct math.
    // Actually, kids might type `7` then `2` to make `72`. But we restricted to single digit usage.
    // If we only allow single digits, maybe we do enforce alternation to avoid confusing `72`.
    // Wait, let's keep it simple and just let them type whatever and click Submit.
    setExpression(prev => [...prev, { type, val, index }]);
  };

  const undo = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  const clear = () => {
    setExpression([]);
  };

  const nextTurn = (solved, skipped) => {
    let nextScores = [...scores];
    
    if (solved) {
      nextScores[currentPlayerIdx] += 10 * multiplier;
      showToast("Correct!", true);
    }

    if (config.mode === 'single') {
      if (currentRound + 1 >= MAX_ROUNDS_SINGLE) {
        // End game
        endGame(nextScores);
      } else {
        setScores(nextScores);
        setCurrentRound(r => r + 1);
        loadNewPuzzle();
      }
    } else {
      // Multiplayer
      setScores(nextScores);
      setCurrentPlayerIdx((currentPlayerIdx + 1) % config.numPlayers);
      if (skipped) {
        setMultiplier(prev => prev * 2);
        clear(); // Clear board for next player
        showToast("Passed to Player " + (((currentPlayerIdx + 1) % config.numPlayers) + 1));
      } else {
        setMultiplier(1);
        setCurrentRound(r => r + 1);
        loadNewPuzzle();
      }
    }
  };

  const endGame = (finalScores) => {
    const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    setFinalStats({
      scores: finalScores,
      time: elapsedSeconds,
      mode: config.mode
    });
    setScreen('summary');
  };

  const handleCheck = () => {
    if (expression.length === 0) return;
    const rawExpr = expression.map(e => e.val);
    const result = verifyUserExpression(rawExpr, puzzleDigits);
    
    if (result.valid) {
      nextTurn(true, false);
    } else {
      showToast(result.message);
    }
  };

  const handleSkip = () => {
    nextTurn(false, true);
  };

  const isUsed = (idx) => expression.some(ex => ex.type === 'number' && ex.index === idx);

  // Derive simple expression string for display
  const renderExpr = expression.map(e => e.val).join(' ');

  return (
    <div className="screen">
      {toast && (
        <div className={`toast ${toast.isSuccess ? 'success' : ''}`}>
          {toast.msg}
        </div>
      )}
      
      <div className="top-bar">
        {config.mode === 'single' ? (
          <>
            <div>Round {currentRound + 1}/{MAX_ROUNDS_SINGLE}</div>
            <div className="score-badge">Score: {scores[0]}</div>
          </>
        ) : (
          <>
            <div style={{ color: 'var(--color-primary-dark)' }}>Player {currentPlayerIdx + 1}'s Turn</div>
            <div className="score-badge">Score: {scores[currentPlayerIdx]} {multiplier > 1 ? `(x${multiplier} next!)` : ''}</div>
          </>
        )}
      </div>

      {config.mode === 'multi' && (
        <div style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 'bold' }}>
          Scores: {scores.map((s, i) => `P${i+1}: ${s}`).join(' | ')}
        </div>
      )}

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--color-text)' }}>Build an Equation!</h3>
        
        <div className="equation-display">
          {expression.length === 0 ? (
            <span style={{ color: '#ccc' }}>Tap blocks below to build...</span>
          ) : (
            expression.map((item, i) => (
              <span key={i} className="equation-item" style={{ 
                borderColor: item.type === 'op' ? 'var(--color-secondary)' : 'var(--color-border)', 
                color: item.type === 'op' ? 'var(--color-secondary-dark)' : 'var(--color-text)' 
              }}>
                {item.val}
              </span>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button className="btn btn-danger" style={{ width: '48%', marginBottom: 0 }} onClick={undo} disabled={expression.length === 0}>UNDO</button>
          <button className="btn btn-secondary" style={{ width: '48%', marginBottom: 0 }} onClick={clear} disabled={expression.length === 0}>CLEAR</button>
        </div>

        <div className="block-row">
          {puzzleDigits.map((digit, i) => {
            const used = isUsed(i);
            return (
              <button 
                key={i} 
                className={`btn btn-block ${used ? '' : 'btn-primary'}`} 
                style={{ opacity: used ? 0.3 : 1, transform: used ? 'none' : '' }}
                onClick={() => handleBlockClick('number', digit, i)}
                disabled={used}
              >
                {digit}
              </button>
            )
          })}
        </div>

        <div className="block-row">
          {['+', '-', '*', '/', '='].map(op => (
            <button 
              key={op} 
              className="btn btn-block btn-secondary"
              onClick={() => handleBlockClick('op', op)}
            >
              {op}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }}></div>

        <button className="btn btn-success" onClick={handleCheck} style={{ padding: '1.5rem', fontSize: '2rem' }}>SUBMIT</button>
        <button className="btn btn-danger" onClick={handleSkip} style={{ backgroundColor: 'var(--color-border)', boxShadow: '0 6px 0 0 #64748b' }}>
          {config.mode === 'multi' ? 'SKIP TO NEXT PLAYER' : 'SKIP ROUND'}
        </button>

      </div>
    </div>
  );
}
