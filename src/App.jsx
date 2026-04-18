import React, { useState } from 'react';
import Menu from './components/Menu';
import Setup from './components/Setup';
import Game from './components/Game';
import Summary from './components/Summary';

function App() {
  const [screen, setScreen] = useState('menu');
  const [gameConfig, setGameConfig] = useState(null);
  const [finalStats, setFinalStats] = useState(null);

  return (
    <>
      {screen === 'menu' && <Menu setScreen={setScreen} />}
      {screen === 'setup' && <Setup setScreen={setScreen} setGameConfig={setGameConfig} />}
      {screen === 'game' && <Game config={gameConfig} setScreen={setScreen} setFinalStats={setFinalStats} />}
      {screen === 'summary' && <Summary finalStats={finalStats} setScreen={setScreen} />}
    </>
  );
}

export default App;
