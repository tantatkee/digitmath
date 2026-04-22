import React, { useState } from 'react';

export default function Menu({ setScreen }) {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="screen" style={{ justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      
      {showInstructions && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 300,
          background: 'rgba(15, 23, 42, 0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div className="card" style={{ 
            width: '100%', maxHeight: '90%', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '1rem'
          }}>
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>How to Play</h2>
            
            <div style={{ textAlign: 'left', fontSize: '1rem', lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p>1. You are given 4, 5, or 6 <b>numbers</b>.</p>
              <p>2. Use <b>ALL</b> numbers and any <b>operators</b> (+, −, ×, ÷, (, )) to build an equation.</p>
              <p>3. Your equation must have exactly one <b>=</b> sign (e.g., <code>(7 - 4) × 2 = 6</code>).</p>
              <p>4. <b>Single Player:</b> 10 rounds. Watch out for the time penalty!</p>
              <p>5. <b>Multiplayer:</b> Take turns! If you skip, the next player gets a <b>Bonus Point</b>.</p>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ marginTop: '1rem', marginBottom: 0 }}
              onClick={() => setShowInstructions(false)}
            >
              GOT IT!
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>DigitMath</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--color-primary-dark)' }}>
          Fun Equation Building!
        </p>
        
        <button 
          className="btn btn-success" 
          style={{ fontSize: '2rem', padding: '1.5rem' }}
          onClick={() => setScreen('setup')}
        >
          PLAY NOW
        </button>

        <button 
          className="btn btn-secondary" 
          style={{ fontSize: '1.2rem', padding: '1rem' }}
          onClick={() => setShowInstructions(true)}
        >
          HOW TO PLAY
        </button>
      </div>
    </div>
  );
}
