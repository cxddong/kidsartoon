import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

console.log('Main starting...');
const rootProps = document.getElementById('root');
if (!rootProps) {
  console.error('CRITICAL: Root element not found!');
}

createRoot(rootProps!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
