import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MemberCardPublic from './pages/MemberCardPublic.jsx'

// A shared card link (/?card=ID) opens the public member card without login
const cardId = new URLSearchParams(window.location.search).get('card')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {cardId ? <MemberCardPublic id={cardId} /> : <App />}
  </StrictMode>,
)
