import React from 'react';

export default function Summary({ finalStats, setScreen }) {
  const { mode, scores, penalties, time, numPlayers } = finalStats;
  const isSingle = mode === 'single';

  // Net score = raw points - individual penalty
  const netScores = scores.map((s, i) => Math.max(0, s - (penalties[i] || 0)));

  return (
    <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Game Over!</h1>

        {isSingle ? (
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text)' }}>Time: {time}s</h2>
            <div style={{ margin: '1.5rem 0' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Base Score: {scores[0]}</p>
              <p style={{ fontSize: '1.2rem', color: 'var(--color-danger)', marginBottom: '1rem' }}>
                Time Penalty: −{penalties[0]}
              </p>
              <div className="score-badge" style={{ fontSize: '2rem', padding: '1rem 2rem', display: 'inline-block' }}>
                Final Score: {netScores[0]}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>Leaderboard</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1.5rem 0' }}>
              {scores.map((rawScore, idx) => (
                <div key={idx} style={{
                  background: 'var(--color-bg-start)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 'bold',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', marginBottom: '0.2rem' }}>
                    <span>Player {idx + 1}</span>
                    <span>{netScores[idx]} pts</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b' }}>
                    <span>Base: {rawScore}</span>
                    <span style={{ color: penalties[idx] > 0 ? 'var(--color-danger)' : '#64748b' }}>
                      Penalty: −{penalties[idx]}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {(() => {
              const maxNet = Math.max(...netScores);
              const winners = netScores.map((s, i) => s === maxNet ? i + 1 : -1).filter(i => i !== -1);
              if (maxNet === 0) return <h3>No points earned.</h3>;
              if (winners.length > 1) return <h3>It&apos;s a tie between {winners.map(w => 'P' + w).join(', ')}! 🎉</h3>;
              return <h3 style={{ color: 'var(--color-success)' }}>Player {winners[0]} Wins! 🏆</h3>;
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
