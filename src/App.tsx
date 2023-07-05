import React from 'react';
import './App.css';
import { Board } from "./components/Board";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>ChaosChess</h1>
        <div className="dashboard">
          <div style={{ flex: 1 }}>
            LEFT PANEL
          </div>
          <div style={{ flex: 2 }}>
            <Board />
          </div>
          <div style={{ flex: 1 }}>
            RIGHT PANEL
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
