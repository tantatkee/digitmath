import React, { useState } from 'react';

export default function Setup({ setScreen, setGameConfig }) {
  const [mode, setMode] = useState('single');
  const [difficulty, setDifficulty] = useState('easy');
  const [numPlayers, setNumPlayers] = useState(2);

  const handleStart = () => {
    setGameConfig({
      mode,
      difficulty,
      numPlayers: mode === 'multi' ? numPlayers : 1
    });
    setScreen('game');
  };

  return (
    <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2>Game Setup</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Game Mode</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn ${mode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '0.5rem', fontSize: '1rem', width: 'auto' }}
              onClick={() => setMode('single')}
            >
              Single Player
            </button>
            <button 
              className={`btn ${mode === 'multi' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '0.5rem', fontSize: '1rem', width: 'auto' }}
              onClick={() => setMode('multi')}
            >
              Multiplayer
            </button>
          </div>
        </div>

        {mode === 'multi' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Number of Players: {numPlayers}</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '1.5rem', width: 'auto' }} onClick={() => setNumPlayers(Math.max(2, numPlayers - 1))}>-</button>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '1.5rem', width: 'auto' }} onClick={() => setNumPlayers(Math.min(4, numPlayers + 1))}>+</button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Difficulty</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn ${difficulty === 'easy' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '0.5rem', fontSize: '1rem', width: 'auto' }}
              onClick={() => setDifficulty('easy')}
            >
              Easy (4)
            </button>
            <button 
              className={`btn ${difficulty === 'medium' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '0.5rem', fontSize: '1rem', width: 'auto' }}
              onClick={() => setDifficulty('medium')}
            >
               Medium (5)
            </button>
            <button 
              className={`btn ${difficulty === 'hard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '0.5rem', fontSize: '1rem', width: 'auto' }}
              onClick={() => setDifficulty('hard')}
            >
               Hard (6)
            </button>
          </div>
        </div>

        <button className="btn btn-success" onClick={handleStart}>START GAME</button>
        <button className="btn btn-danger" style={{ marginTop: '0.5rem' }} onClick={() => setScreen('menu')}>BACK</button>
      </div>
    </div>
  );
}
