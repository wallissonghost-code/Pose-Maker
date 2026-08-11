import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, 'at', {
    configurable: true,
    writable: true,
    value: function(index){
      const len = this.length >>> 0
      let i = Number(index) || 0
      if (i < 0) i += len
      return i < 0 || i >= len ? undefined : this[i]
    }
  })
}

class AppErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={error:null}}
  static getDerivedStateFromError(error){return {error}}
  componentDidCatch(error,info){console.error('Pose Maker render error',error,info)}
  render(){
    if(this.state.error){
      return <div className="fatal-screen">
        <div className="fatal-card">
          <strong>POSE MAKER</strong>
          <h1>Não foi possível iniciar o editor 3D</h1>
          <p>{this.state.error?.message || 'Erro inesperado de renderização.'}</p>
          <button onClick={()=>location.reload()}>Tentar novamente</button>
        </div>
      </div>
    }
    return this.props.children
  }
}

window.addEventListener('unhandledrejection',event=>console.error('Pose Maker async error',event.reason))
window.addEventListener('error',event=>console.error('Pose Maker window error',event.error||event.message))

createRoot(document.getElementById('root')).render(
  <AppErrorBoundary><App /></AppErrorBoundary>
)
