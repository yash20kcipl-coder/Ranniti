import './index.css'
import App from './App.tsx'
import { StrictMode } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
