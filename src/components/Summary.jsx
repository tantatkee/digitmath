import React from 'react';

export default function Summary({ finalStats, setScreen }) {
  const isSingle = finalStats.mode === 'single';

  return (
    <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Game Over!</h1>
        
        {isSingle ? (
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text)' }}>Time: {finalStats.time} seconds</h2>
            <div style={{ margin: '1.5rem 0' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Base Score: {finalStats.scores[0]}</p>
              <p style={{ fontSize: '1.2rem', color: 'var(--color-danger)', marginBottom: '1rem' }}>
                Time Penalty: -{Math.floor(finalStats.time / 10)}
              </p>
              <div className="score-badge" style={{ fontSize: '2rem', padding: '1rem 2rem', display: 'inline-block' }}>
                Final Score: {Math.max(0, finalStats.scores[0] - Math.floor(finalStats.time / 10))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>Leaderboard</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '2rem 0' }}>
              {finalStats.scores.map((score, idx) => (
                <div key={idx} style={{ 
                  background: 'var(--color-bg-start)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Player {idx + 1}</span>
                  <span>{score} pts</span>
                </div>
              ))}
            </div>
            {(() => {
              const maxScore = Math.max(...finalStats.scores);
              const winners = finalStats.scores
                .map((s, i) => s === maxScore ? i + 1 : -1)
                .filter(i => i !== -1);
              
              if (maxScore === 0) return <h3>No points earned.</h3>;
              if (winners.length > 1) return <h3>It's a tie between {winners.map(w => 'P'+w).join(', ')}!</h3>;
              return <h3 style={{ color: 'var(--color-success)' }}>Player {winners[0]} Wins! 🎉</h3>
            })()}
          </div>
        )}

        <button 
          className="btn btn-primary" 
          style={{ fontSize: '1.5rem', padding: '1.5rem', marginTop: '2rem' }}
          onClick={() => setScreen('menu')}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
