import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { THEME, applyTheme } from './theme'
import './styles.css'

// 옷은 그리기 전에 입는다. CSS 는 여기서 심는 변수만 읽는다
applyTheme(THEME)

const host = document.getElementById('root')
if (!host) throw new Error('#root 를 찾지 못했습니다')

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
