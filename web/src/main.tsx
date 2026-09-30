import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';

document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
