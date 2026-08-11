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

function showUnsupportedImageDialog(file){
  const old=document.getElementById('posemaker-image-warning')
  if(old) old.remove()

  const overlay=document.createElement('div')
  overlay.id='posemaker-image-warning'
  overlay.setAttribute('role','dialog')
  overlay.setAttribute('aria-modal','true')
  overlay.style.cssText='position:fixed;inset:0;z-index:999999;display:grid;place-items:center;padding:18px;background:rgba(2,5,10,.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)'

  const card=document.createElement('div')
  card.style.cssText='width:min(460px,100%);border:1px solid #303a4f;border-radius:18px;padding:20px;background:#10151f;color:#eef3ff;box-shadow:0 24px 80px rgba(0,0,0,.55);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'

  const icon=document.createElement('div')
  icon.textContent='2D'
  icon.style.cssText='display:grid;place-items:center;width:48px;height:48px;border-radius:14px;margin-bottom:14px;background:#2b3550;color:#9fb2ff;font-weight:900;font-size:15px'

  const title=document.createElement('h2')
  title.textContent='Essa imagem não é um avatar 3D'
  title.style.cssText='margin:0 0 8px;font-size:21px;line-height:1.2'

  const text=document.createElement('p')
  text.innerHTML=`Você selecionou <b>${String(file?.name||'uma imagem')}</b>. PNG/JPG são imagens 2D e não possuem malha, esqueleto ou rig para mover braços, pernas e cabeça.`
  text.style.cssText='margin:0 0 14px;color:#aeb8ca;font-size:14px;line-height:1.55'

  const accepted=document.createElement('div')
  accepted.innerHTML='<b>Para editar poses:</b><br>Use um avatar <b>.GLB</b> ou <b>.GLTF</b>, de preferência com rig/esqueleto.'
  accepted.style.cssText='padding:12px 13px;border-radius:12px;background:#151c29;border:1px solid #273149;color:#dbe4f6;font-size:13px;line-height:1.5'

  const note=document.createElement('p')
  note.textContent='A imagem não foi importada e seu projeto continua intacto.'
  note.style.cssText='margin:12px 0 16px;color:#7f8ba0;font-size:12px'

  const close=document.createElement('button')
  close.textContent='Entendi'
  close.style.cssText='width:100%;min-height:46px;border:1px solid #7187ff;border-radius:11px;background:#667dff;color:white;font:600 14px Inter,system-ui,sans-serif;cursor:pointer'
  close.onclick=()=>overlay.remove()
  overlay.onclick=e=>{if(e.target===overlay)overlay.remove()}

  card.append(icon,title,text,accepted,note,close)
  overlay.appendChild(card)
  document.body.appendChild(overlay)
}

function enhanceAvatarFilePicker(){
  const patch=()=>{
    document.querySelectorAll('input[type="file"]').forEach(input=>{
      const accept=(input.getAttribute('accept')||'').toLowerCase()
      // Only the main avatar picker accepts GLTF. Asset/actor pickers remain GLB-only.
      if(accept.includes('.gltf')&&!input.dataset.posemakerImageAware){
        input.dataset.posemakerImageAware='1'
        input.setAttribute('accept','.glb,.gltf,image/png,image/jpeg,image/webp')
      }
    })
  }

  patch()
  const observer=new MutationObserver(patch)
  observer.observe(document.documentElement,{childList:true,subtree:true})

  document.addEventListener('change',event=>{
    const input=event.target
    if(!(input instanceof HTMLInputElement)||input.type!=='file') return
    const accept=(input.getAttribute('accept')||'').toLowerCase()
    if(!accept.includes('.gltf')) return
    const file=input.files?.[0]
    if(!file) return
    const isImage=file.type.startsWith('image/')||/\.(png|jpe?g|webp)$/i.test(file.name)
    if(!isImage) return

    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation?.()
    showUnsupportedImageDialog(file)
    input.value=''
  },true)
}

enhanceAvatarFilePicker()

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
