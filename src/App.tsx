import React from 'react';
import BacBoAnalyzer from './components/BacBoAnalyzer';
import './index.css';

function App() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: `
        linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #0a0a0a 100%),
        radial-gradient(circle at 20% 80%, rgba(0, 204, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 20, 147, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(0, 255, 136, 0.05) 0%, transparent 50%)
      `,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Efeito de partículas animadas */}
      <div className="matrix-animation" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 98px,
            rgba(0, 204, 255, 0.03) 100px
          ),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 98px,
            rgba(255, 20, 147, 0.03) 100px
          )
        `,
        pointerEvents: 'none',
        zIndex: -1
      }} />
      
      <BacBoAnalyzer />
    </div>
  );
}

export default App;