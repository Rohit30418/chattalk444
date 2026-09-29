import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import installPeerAutoReconnect from './services/peerAutoReconnect'
import { registerVaaniPwa } from './services/pwa'
import './styles/index.css'
import './styles/room-theme.css'
import './styles/header-layout.css'

installPeerAutoReconnect()
registerVaaniPwa()

const storedTheme = localStorage.getItem('theme')
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
const initialTheme = storedTheme === 'dark' || storedTheme === 'light'
  ? storedTheme
  : (prefersDark ? 'dark' : 'light')

document.documentElement.classList.toggle('dark', initialTheme === 'dark')

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
