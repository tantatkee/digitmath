import React from 'react';

export default function Menu({ setScreen }) {
  return (
    <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
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
      </div>
    </div>
  );
}
