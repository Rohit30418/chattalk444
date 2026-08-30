import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import './styles/room-theme.css'

const storedTheme = localStorage.getItem('theme')
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
const initialTheme = storedTheme === 'dark' || storedTheme === 'light'
  ? storedTheme
  : (prefersDark ? 'dark' : 'light')

document.documentElement.classList.toggle('dark', initialTheme === 'dark')

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
