import React,{useRef} from 'react'

const EVENT_TYPES=['FIRE','FOOTSTEP','MAG_OUT','MAG_IN','HIT','SFX','VFX','CUSTOM']
const FACE_PRESETS={
 Neutro:[],
 Sorriso:['smile','happy','mouthsmile'],
 Raiva:['angry','frown','browdown'],
 Surpresa:['surprise','jawopen','mouthopen','wide'],
 Piscar:['blink','eyeclose']
}
function Btn({children,...p}){return <button className="wide" {...p}>{children}</button>}
export default function StudioPanel({
 library,setLibrary,onSaveLibrary,onApplyLibrary,onDeleteLibrary,
 frames,currentTime,setCurrentTime,duration,setDuration,fps,setFps,speed,setSpeed,selectedFrameId,setSelectedFrameId,onDuplicateFrame,onDeleteFrame,onMoveFrame,
 events,setEvents,morphNames,morphValues,setMorphValues,
 sceneActors,setSceneActors,onImportActor,
 rigMapping,setRigMapping,rigBones=[],modelName,
 autosave,setAutosave,onRestoreAutosave,
 onUndo,onRedo,canUndo,canRedo
}){
 const actorRef=useRef(null)
 const applyFacePreset=(name)=>{
  const keys=FACE_PRESETS[name]||[]
  const next=Object.fromEntries(morphNames.map(n=>[n,0]))
  morphNames.forEach(n=>{const low=n.toLowerCase();if(keys.some(k=>low.includes(k)))next[n]=name==='Piscar'?1:.8})
  setMorphValues(next)
 }
 const selected=frames.find(f=>f.id===selectedFrameId)
 return <>
  <section><h3>Histórico</h3><div className="row-actions two"><button disabled={!canUndo} onClick={onUndo}>↶ Desfazer</button><button disabled={!canRedo} onClick={onRedo}>↷ Refazer</button></div><button className={autosave?'wide active':'wide'} onClick={()=>setAutosave(v=>!v)}>{autosave?'✓ Autosave':'Autosave OFF'}</button><Btn onClick={onRestoreAutosave}>Restaurar autosave</Btn></section>

  <section><h3>Timeline Pro</h3><label className="select-row"><span>Duração</span><input type="number" min=".25" max="120" step=".25" value={duration} onChange={e=>setDuration(Math.max(.25,Number(e.target.value)||5))}/></label><label className="select-row"><span>FPS</span><select value={fps} onChange={e=>setFps(Number(e.target.value))}>{[8,12,24,30,60].map(n=><option key={n}>{n}</option>)}</select></label><label className="select-row"><span>Veloc.</span><select value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[.25,.5,1,1.5,2].map(n=><option key={n} value={n}>{n}×</option>)}</select></label>{selected&&<div className="studio-card"><strong>Keyframe {selected.label}</strong><input type="range" min="0" max={duration} step={1/fps} value={selected.time} onChange={e=>onMoveFrame(selected.id,Number(e.target.value))}/><div className="row-actions two"><button onClick={()=>onDuplicateFrame(selected.id)}>Duplicar</button><button className="danger" onClick={()=>onDeleteFrame(selected.id)}>Excluir</button></div></div>}</section>

  <section><h3>Biblioteca</h3><div className="library-save"><button onClick={()=>onSaveLibrary('pose')}>+ Pose</button><button onClick={()=>onSaveLibrary('face')}>+ Expressão</button><button onClick={()=>onSaveLibrary('animation')}>+ Animação</button></div>{library.length===0?<p className="microcopy">Salve poses, expressões e animações para reutilizar em outros personagens.</p>:<div className="library-list">{library.map(item=><div key={item.id}><button onClick={()=>onApplyLibrary(item)}><strong>{item.name}</strong><small>{item.type}</small></button><button className="mini danger" onClick={()=>onDeleteLibrary(item.id)}>×</button></div>)}</div>}</section>

  <section><h3>Face rápida</h3>{morphNames.length?<div className="preset-grid">{Object.keys(FACE_PRESETS).map(n=><button key={n} onClick={()=>applyFacePreset(n)}>{n}</button>)}</div>:<p className="microcopy">Presets faciais aparecem quando o avatar possui morph targets.</p>}</section>

  <section><h3>Eventos da animação</h3><div className="event-add"><select id="eventType">{EVENT_TYPES.map(x=><option key={x}>{x}</option>)}</select><button onClick={()=>{const el=document.getElementById('eventType');setEvents(v=>[...v,{id:Date.now(),time:currentTime,type:el?.value||'CUSTOM',value:''}])}}>+ Evento</button></div>{[...events].sort((a,b)=>a.time-b.time).map(ev=><div className="event-row" key={ev.id}><button onClick={()=>setCurrentTime(ev.time)}>{ev.time.toFixed(2)}s</button><b>{ev.type}</b><input value={ev.value||''} placeholder="valor opcional" onChange={e=>setEvents(v=>v.map(x=>x.id===ev.id?{...x,value:e.target.value}:x))}/><button className="danger" onClick={()=>setEvents(v=>v.filter(x=>x.id!==ev.id))}>×</button></div>)}</section>

  <section><h3>Retargeting universal</h3><p className="microcopy">O Pose Maker usa slots humanos universais. Corrija o mapa abaixo quando outro avatar usar nomes diferentes; a biblioteca/animação continua usando os mesmos slots.</p><div className="mapping-edit compact">{Object.keys(rigMapping).map(slot=><label key={slot}><span>{slot}</span><select value={rigMapping[slot]||''} onChange={e=>setRigMapping(m=>({...m,[slot]:e.target.value}))}><option value="">—</option>{rigBones.map(b=><option key={b.uuid||b.name} value={b.name}>{b.name}</option>)}</select></label>)}</div><Btn onClick={()=>{const blob=new Blob([JSON.stringify({format:'POSEMAKER_RIG_PROFILE',version:1,name:modelName,mapping:rigMapping},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='rig-profile.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),500)}}>Exportar perfil do rig</Btn></section>

  <section><h3>Scene / Group Pose</h3><input ref={actorRef} hidden type="file" accept=".glb" onChange={e=>onImportActor(e.target.files?.[0])}/><button className="wide primary" onClick={()=>actorRef.current?.click()}>+ Outro avatar GLB</button>{sceneActors.map(a=><div className="studio-card" key={a.id}><strong>{a.name}</strong><label className="select-row"><span>X</span><input type="number" step=".1" value={a.position?.[0]||0} onChange={e=>setSceneActors(v=>v.map(x=>x.id===a.id?{...x,position:[Number(e.target.value),x.position?.[1]||0,x.position?.[2]||0]}:x))}/></label><label className="select-row"><span>Z</span><input type="number" step=".1" value={a.position?.[2]||0} onChange={e=>setSceneActors(v=>v.map(x=>x.id===a.id?{...x,position:[x.position?.[0]||0,x.position?.[1]||0,Number(e.target.value)]}:x))}/></label><button className="wide danger" onClick={()=>setSceneActors(v=>v.filter(x=>x.id!==a.id))}>Remover</button></div>)}</section>
 </>
}
