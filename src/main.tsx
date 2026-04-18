
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(document.getElementById('root')!).render(
  // 그냥 App만 남기면 됩니다!
  <App />
)