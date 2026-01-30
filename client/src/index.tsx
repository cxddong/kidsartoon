import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// DEBUG PROBE
console.log('%c DEBUG MODE ACTIVE - FILE SYSTEM CHECK PASSED ', 'background: #222; color: #bada55; font-size: 20px');
// window.alert("DEBUG MODE ACTIVE - If you see this, the code is updating!");

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
