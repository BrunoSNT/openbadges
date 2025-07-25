import { Buffer } from 'buffer';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import App from './App.tsx';

// Make Buffer globally available
window.Buffer = Buffer;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
