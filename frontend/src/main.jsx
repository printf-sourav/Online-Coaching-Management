import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AOS from 'aos'
import 'aos/dist/aos.css'
import './index.css'
import App from './App.jsx'
import faviconUrl from './assets/minilogo.png?url'

function injectFavicon(href) {
  for (const rel of ['icon', 'apple-touch-icon']) {
    let el = document.querySelector(`link[rel="${rel}"]`)
    if (!el) {
      el = document.createElement('link')
      el.rel = rel
      if (rel === 'icon') el.type = 'image/png'
      document.head.appendChild(el)
    }
    el.setAttribute('href', href)
  }
}
injectFavicon(faviconUrl)

AOS.init({ duration: 650, easing: 'ease-out-cubic', once: true, offset: 60 })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
