import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

// Compatibility bootstrap MUST run before App and Three.js modules are evaluated.
function installCompatibility(){
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
  if (!Object.fromEntries) {
    Object.fromEntries = function(entries){
      const out = {}
      for (const pair of entries) out[pair[0]] = pair[1]
      return out
    }
  }
  if (!Array.prototype.findLast) {
    Object.defineProperty(Array.prototype, 'findLast', {
      configurable: true,
      writable: true,
      value: function(fn, thisArg){
        for(let i=this.length-1;i>=0;i--) if(fn.call(thisArg,this[i],i,this)) return this[i]
        return undefined
      }
    })
  }
  if (!globalThis.crypto) globalThis.crypto = {}
  if (!globalThis.crypto.randomUUID) {
    globalThis.crypto.randomUUID = function(){
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
        const r=Math.random()*16|0,v=c==='x'?r:(r&3|8)
        return v.toString(16)
      })
    }
  }
}

installCompatibility()

class AppErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={error:null}}
  static getDerivedStateFromError(error){return {error}}
  componentDidCatch(error,info){console.error('Pose Maker render error',error,info)}
  render(){
    if(this.state.error){
      const err=this.state.error
      return <div className="fatal-screen">
        <div className="fatal-card">
          <strong>POSE MAKER • DIAGNÓSTICO</strong>
          <h1>Não foi possível iniciar o editor 3D</h1>
          <p><b>Erro:</b> {err?.message || 'Erro inesperado de renderização.'}</p>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:'11px',maxHeight:'42vh',overflow:'auto',padding:'10px',background:'#07090d',borderRadius:'8px'}}>{err?.stack || 'Sem stack disponível.'}</pre>
          <button onClick={()=>location.reload()}>Tentar novamente</button>
        </div>
      </div>
    }
    return this.props.children
  }
}

window.addEventListener('unhandledrejection',event=>console.error('Pose Maker async error',event.reason))
window.addEventListener('error',event=>console.error('Pose Maker window error',event.error||event.message))

const root=createRoot(document.getElementById('root'))

// Dynamic import guarantees compatibility shims are installed first.
import('./App')
  .then(({default:App})=>{
    root.render(<AppErrorBoundary><App /></AppErrorBoundary>)
  })
  .catch(error=>{
    console.error('Pose Maker module startup error',error)
    root.render(<div className="fatal-screen"><div className="fatal-card"><strong>POSE MAKER • BOOT</strong><h1>Falha ao carregar os módulos</h1><p><b>Erro:</b> {error?.message || String(error)}</p><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:'11px',maxHeight:'50vh',overflow:'auto',padding:'10px',background:'#07090d',borderRadius:'8px'}}>{error?.stack || 'Sem stack disponível.'}</pre><button onClick={()=>location.reload()}>Tentar novamente</button></div></div>)
  })
