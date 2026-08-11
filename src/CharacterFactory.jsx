import React,{useMemo,useState} from 'react'
import UniversalTemplatePreview from './UniversalTemplatePreview'
import {UNIVERSAL_TEMPLATES,getRig,getTemplate} from './templates/universalTemplates'
import {downloadGLB,exportProceduralGLB} from './templates/exportProceduralGLB'
import {captureCharacterSheet,fileToDataUrl} from './templates/singleSheetCapture'

const slots=[
  {id:'front',label:'FRENTE',required:true},
  {id:'back',label:'COSTAS',required:true},
  {id:'side',label:'LADO',required:true},
  {id:'weapon',label:'ARMA',required:false},
]
const downloadJson=(obj,name)=>{const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)}
const safeName=name=>(name||'character').toLowerCase().replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'')||'character'

export default function CharacterFactory({onClose}){
  const [templateId,setTemplateId]=useState('orc_large')
  const [files,setFiles]=useState({})
  const [previews,setPreviews]=useState({})
  const [inputMode,setInputMode]=useState('sheet')
  const [sheetLayout,setSheetLayout]=useState('auto')
  const [sheet,setSheet]=useState(null)
  const [name,setName]=useState('Orc Guerreiro')
  const [height,setHeight]=useState(2.15)
  const [bodyScale,setBodyScale]=useState(1.18)
  const [weaponSocket,setWeaponSocket]=useState('handR')
  const [showRig,setShowRig]=useState(true)
  const [message,setMessage]=useState('')
  const [generating,setGenerating]=useState(false)
  const [capturing,setCapturing]=useState(false)

  const selectedTemplate=getTemplate(templateId)
  const selectedRig=getRig(selectedTemplate.rig)
  const requiredOk=useMemo(()=>['front','back','side'].every(k=>files[k]),[files])
  const score=useMemo(()=>['front','back','side','weapon'].reduce((n,k)=>n+(files[k]?1:0),0),[files])

  const choose=async(id,file)=>{
    if(!file)return
    if(!file.type.startsWith('image/')){setMessage('Use PNG, JPG ou WebP nas vistas.');return}
    const url=await fileToDataUrl(file)
    setFiles(v=>({...v,[id]:file}))
    setPreviews(v=>({...v,[id]:url}))
    setMessage('')
  }

  const importSheet=async file=>{
    if(!file)return
    setCapturing(true)
    setMessage('Analisando a sheet e separando as vistas…')
    try{
      const result=await captureCharacterSheet(file,{layout:sheetLayout})
      const nextFiles={},nextPreviews={}
      slots.forEach((s,i)=>{
        if(result.files[i])nextFiles[s.id]=result.files[i]
        if(result.previews[i])nextPreviews[s.id]=result.previews[i]
      })
      setFiles(nextFiles)
      setPreviews(nextPreviews)
      setSheet({name:file.name,sourceUrl:result.sourceUrl,layout:result.layout,rects:result.rects,width:result.width,height:result.height})
      const count=result.files.length
      setMessage(count>=3?`Sheet captada: ${count} blocos. Frente, costas e lado já foram preenchidos.`:`Só encontrei ${count} blocos. Escolha outro layout ou ajuste os slots manualmente.`)
    }catch(err){
      console.error(err)
      setMessage(`Falha ao ler a sheet: ${err?.message||String(err)}`)
    }finally{setCapturing(false)}
  }

  const changeTemplate=id=>{
    const t=getTemplate(id)
    setTemplateId(id)
    if(t.heightDefault)setHeight(t.heightDefault)
    if(t.bodyScaleDefault)setBodyScale(t.bodyScaleDefault)
  }

  const referenceMeta=()=>Object.fromEntries(slots.filter(s=>files[s.id]).map(s=>[s.id,{name:files[s.id].name,type:files[s.id].type,size:files[s.id].size,source:inputMode==='sheet'?'single-sheet':'separate'}]))

  const createSpec=()=>{
    if(!requiredOk){setMessage('Adicione FRENTE, COSTAS e LADO.');return}
    const spec={
      format:'POSEMAKER_CHARACTER_FACTORY',version:4,
      createdAt:new Date().toISOString(),
      character:{name,templateId,heightMeters:Number(height),bodyScale:Number(bodyScale)},
      template:{id:selectedTemplate.id,name:selectedTemplate.name,status:selectedTemplate.status,body:selectedTemplate.body,proportions:selectedTemplate.proportions||{},materials:selectedTemplate.materials||[],parts:selectedTemplate.parts||[],projection:selectedTemplate.projection||{}},
      rig:selectedRig,
      input:{mode:inputMode,sheet:sheet?{name:sheet.name,layout:sheet.layout,width:sheet.width,height:sheet.height,rects:sheet.rects}:null},
      references:referenceMeta(),
      projection:{front:'front',back:'back',sideLeft:'side',mirrorSideRight:true,blendSeams:true},
      weapon:files.weapon?{reference:'weapon',socket:weaponSocket,separateMesh:true}:null,
      assembly:{sourceMode:inputMode==='sheet'?'single_sheet_capture':'template_projection',modularParts:true,keepRig:true,keepSockets:true,generateMaterials:true,exportTarget:'glb'},
      pipeline:['capture_or_validate_views','normalize_silhouette','load_universal_template','apply_body_scale','project_reference_textures','blend_side_seams','assemble_modular_parts','bind_pm_humanoid_rig','attach_sockets','export_glb'],
      glbStatus:'procedural-rigged-export-ready',
      note:'V4 aceita uma única sheet e transforma seus recortes diretamente nas referências usadas pelo gerador GLB.'
    }
    downloadJson(spec,`${safeName(name)}.pmfactory.json`)
    setMessage('Projeto V4 salvo.')
  }

  const injectIntoPoseMaker=file=>{
    try{
      const inputs=[...document.querySelectorAll('input[type="file"]')]
      const target=inputs.find(input=>(input.getAttribute('accept')||'').toLowerCase().includes('.gltf'))
      if(!target)return false
      const dt=new DataTransfer();dt.items.add(file);target.files=dt.files
      target.dispatchEvent(new Event('change',{bubbles:true}))
      return true
    }catch(err){console.warn('Pose Maker auto-import failed',err);return false}
  }

  const generateGLB=async openEditor=>{
    if(!requiredOk){setMessage('A sheet precisa fornecer frente, costas e lado antes de gerar o GLB.');return}
    if(templateId!=='orc_large'){setMessage('Por enquanto, o GLB real está habilitado para o Orc Grande Base.');return}
    setGenerating(true)
    setMessage(inputMode==='sheet'?'Usando os recortes da sheet para montar o GLB rigado…':'Montando malha, esqueleto e sockets…')
    try{
      const blob=await exportProceduralGLB({templateId,height:Number(height),bodyScale:Number(bodyScale),name,referenceMeta:referenceMeta()})
      const fileName=`${safeName(name)}-rigged.glb`
      if(openEditor){
        const file=new File([blob],fileName,{type:'model/gltf-binary'})
        if(injectIntoPoseMaker(file)){
          setMessage('GLB rigado gerado a partir da sheet e enviado ao Pose Maker.')
          setTimeout(()=>onClose?.(),220)
        }else{
          downloadGLB(blob,fileName)
          setMessage('GLB gerado. A abertura automática foi bloqueada, então baixei o arquivo.')
        }
      }else{
        downloadGLB(blob,fileName)
        setMessage('GLB rigado gerado com sucesso.')
      }
    }catch(err){console.error(err);setMessage(`Falha ao gerar GLB: ${err?.message||String(err)}`)}
    finally{setGenerating(false)}
  }

  return <div className="cf-backdrop"><div className="cf-shell">
    <header className="cf-header"><div><b>CHARACTER FACTORY V4</b><span>Sheet única → captura automática → Rig → GLB real</span></div><button onClick={onClose}>Fechar</button></header>

    <div className="cf-grid">
      <section className="cf-panel">
        <h2>1. Referências</h2>
        <div className="cf-mode-tabs"><button className={inputMode==='sheet'?'active':''} onClick={()=>setInputMode('sheet')}>Sheet única</button><button className={inputMode==='separate'?'active':''} onClick={()=>setInputMode('separate')}>Arquivos separados</button></div>
        {inputMode==='sheet'?<>
          <p>Envie uma prancha com frente + costas + lado. A arma pode estar como quarto bloco.</p>
          <div className="cf-sheet-tools"><label>Detecção<select value={sheetLayout} onChange={e=>setSheetLayout(e.target.value)}><option value="auto">Auto detectar</option><option value="horizontal-4">4 colunas</option><option value="horizontal-3">3 colunas</option><option value="grid-2x2">Grade 2×2</option><option value="vertical-4">4 linhas</option><option value="vertical-3">3 linhas</option></select></label><label className="cf-sheet-button"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>importSheet(e.target.files?.[0])}/>{capturing?'Captando…':sheet?'Trocar sheet':'Selecionar sheet'}</label></div>
          {sheet&&<div className="cf-sheet-source"><img src={sheet.sourceUrl} alt="Sheet original"/><div><b>{sheet.name}</b><span>{sheet.layout}</span><span>{sheet.rects.length} blocos detectados</span></div></div>}
        </>:<p>Envie cada vista separadamente.</p>}
        <div className="cf-views">{slots.map(s=><label className={`cf-drop ${files[s.id]?'ok':''}`} key={s.id}><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>choose(s.id,e.target.files?.[0])}/>{previews[s.id]?<img src={previews[s.id]} alt={s.label}/>:<div className="cf-empty"><strong>{s.label}</strong><small>{s.required?'Obrigatório':'Opcional'}</small><span>{inputMode==='sheet'?'Aguardando captura':'Selecionar imagem'}</span></div>}{files[s.id]&&<em>✓ {s.label} · tocar para trocar</em>}</label>)}</div>
        <small className="cf-note">Se a captura automática errar um bloco, toque apenas naquele cartão e substitua manualmente.</small>
      </section>

      <section className="cf-panel cf-settings"><h2>2. Template universal</h2><label>Nome<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Corpo<select value={templateId} onChange={e=>changeTemplate(e.target.value)}>{Object.values(UNIVERSAL_TEMPLATES).map(t=><option key={t.id} value={t.id}>{t.name}{t.status==='planned'?' (em breve)':''}</option>)}</select></label><div className="cf-info"><b>{selectedTemplate.name}</b><span>{selectedTemplate.body}</span><span>Rig: {selectedTemplate.rig}</span></div><label>Altura <b>{height} m</b><input type="range" min={selectedTemplate.heightRange?.[0]||1.2} max={selectedTemplate.heightRange?.[1]||3} step="0.05" value={height} onChange={e=>setHeight(e.target.value)}/></label><label>Volume <b>{bodyScale}×</b><input type="range" min="0.7" max="1.6" step="0.05" value={bodyScale} onChange={e=>setBodyScale(e.target.value)}/></label><label>Socket da arma<select value={weaponSocket} onChange={e=>setWeaponSocket(e.target.value)}>{selectedRig.sockets.map(s=><option key={s.id} value={s.id}>{s.id}</option>)}</select></label><button className={showRig?'cf-toggle active':'cf-toggle'} onClick={()=>setShowRig(v=>!v)}>{showRig?'✓ Mostrar rig':'Mostrar rig'}</button></section>
    </div>

    <section className="cf-panel cf-preview-panel"><div className="cf-preview-head"><div><h2>3. Preview 3D</h2><p>O GLB usa este template procedural e o PM-HUMANOID-V1.</p></div><div><b>{selectedRig.bones.length}</b><span>ossos</span><b>{selectedRig.sockets.length}</b><span>sockets</span></div></div><UniversalTemplatePreview templateId={templateId} height={Number(height)} bodyScale={Number(bodyScale)} showRig={showRig}/></section>

    <section className="cf-panel cf-pipeline"><h2>4. Gerar personagem</h2><div className="cf-steps"><span className={requiredOk?'done':''}>Captura</span><i>→</i><span className="done">Template</span><i>→</i><span className="done">Rig</span><i>→</i><span className="done">GLB</span></div><div className="cf-status"><b>{score}/4 referências</b><span>{requiredOk?'Pronto para gerar':'Faltam frente, costas ou lado'}</span></div><div className="cf-actions"><button disabled={!requiredOk||generating} onClick={createSpec}>Salvar .pmfactory</button><button className="cf-secondary" disabled={!requiredOk||generating} onClick={()=>generateGLB(false)}>{generating?'Gerando…':'Baixar GLB rigado'}</button><button className="cf-primary" disabled={!requiredOk||generating} onClick={()=>generateGLB(true)}>{generating?'Gerando…':'Gerar GLB e abrir no Pose Maker'}</button></div>{message&&<div className="cf-message">{message}</div>}<small className="cf-note">A sheet agora alimenta o GLB sem exigir novos uploads. A aparência ainda usa o template procedural; a projeção visual fiel das vistas na superfície é uma camada posterior, não geração por IA.</small></section>
  </div><style>{`
    .cf-backdrop{position:fixed;inset:0;z-index:99999;background:rgba(4,6,10,.96);color:#f3f5f7;overflow:auto;font-family:Inter,system-ui,sans-serif}.cf-shell{max-width:1250px;margin:0 auto;padding:18px}.cf-header{display:flex;justify-content:space-between;align-items:center;padding:14px 0 20px}.cf-header div{display:flex;flex-direction:column;gap:3px}.cf-header b{font-size:22px;letter-spacing:.06em}.cf-header span{font-size:12px;color:#9ca7b4}.cf-header button,.cf-primary,.cf-secondary,.cf-toggle,.cf-actions button{background:#202733;color:#fff;border:1px solid #394454;border-radius:10px;padding:10px 15px}.cf-grid{display:grid;grid-template-columns:1.6fr .7fr;gap:14px}.cf-panel{background:#0d1118;border:1px solid #242d39;border-radius:16px;padding:16px}.cf-panel h2{font-size:15px;margin:0 0 8px}.cf-panel p,.cf-note{color:#9ca7b4;font-size:12px}.cf-mode-tabs{display:flex;gap:8px;margin-bottom:10px}.cf-mode-tabs button{flex:1;background:#111722;color:#aeb9c8;border:1px solid #2c3543;border-radius:9px;padding:9px}.cf-mode-tabs button.active{background:#203054;border-color:#5874d8;color:#fff}.cf-sheet-tools{display:flex;gap:9px;align-items:end;flex-wrap:wrap;margin:12px 0}.cf-sheet-tools label{display:flex;flex-direction:column;gap:5px;font-size:11px;color:#aeb8c5}.cf-sheet-tools select,.cf-settings input,.cf-settings select{background:#090c11;color:#fff;border:1px solid #303947;border-radius:9px;padding:10px}.cf-sheet-button{position:relative;overflow:hidden;cursor:pointer;background:#1d2b50;border:1px solid #546fca;border-radius:9px;padding:10px 13px!important;color:#fff!important}.cf-sheet-button input{position:absolute;inset:0;opacity:0;cursor:pointer}.cf-sheet-source{display:flex;gap:10px;align-items:center;padding:8px;border:1px solid #283244;border-radius:10px;background:#090d13}.cf-sheet-source img{width:110px;height:72px;object-fit:contain;background:#fff;border-radius:7px}.cf-sheet-source div{display:flex;flex-direction:column;gap:3px}.cf-sheet-source span{font-size:10px;color:#8e9aaa}.cf-views{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.cf-drop{height:300px;border:1px dashed #3c4655;border-radius:12px;overflow:hidden;position:relative;background:#080b10;cursor:pointer}.cf-drop.ok{border-color:#4c8}.cf-drop input{display:none}.cf-drop img{width:100%;height:100%;object-fit:contain;background:#f4f4f4}.cf-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px}.cf-empty small{color:#818c99}.cf-empty span{font-size:10px;color:#8995a5}.cf-drop em{position:absolute;left:8px;bottom:8px;background:#000c;padding:5px 7px;border-radius:6px;font-size:9px;font-style:normal}.cf-settings{display:flex;flex-direction:column;gap:12px}.cf-settings label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#abb5c0}.cf-settings input[type=range]{padding:0}.cf-info{display:flex;flex-direction:column;gap:4px;background:#090c11;padding:11px;border-radius:10px}.cf-info span{font-size:11px;color:#94a0ae}.cf-toggle.active{border-color:#5376e8;background:#24345f}.cf-preview-panel,.cf-pipeline{margin-top:14px}.cf-preview-head{display:flex;justify-content:space-between;gap:20px}.cf-preview-head>div:last-child{display:grid;grid-template-columns:auto auto;gap:3px 8px;font-size:11px;color:#8d99aa}.cf-3d-preview{height:500px;position:relative;border:1px solid #283241;border-radius:14px;overflow:hidden;background:#080b10;margin-top:12px}.cf-preview-badge{position:absolute;left:10px;bottom:10px;padding:7px 9px;border-radius:8px;background:#0b0f17d9;border:1px solid #2b3545;font-size:10px}.cf-steps{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:14px 0}.cf-steps span{border:1px solid #343f4d;border-radius:999px;padding:7px 10px;font-size:11px}.cf-steps span.done{border-color:#4c8;color:#7ee0a5}.cf-steps i{color:#596575}.cf-status{display:flex;gap:14px;font-size:12px;margin-bottom:12px}.cf-status span{color:#9ca7b4}.cf-actions{display:flex;gap:8px;flex-wrap:wrap}.cf-primary{background:#f3f5f7!important;color:#080b10!important;font-weight:700}.cf-secondary{border-color:#546fca!important;background:#1d2b50!important}.cf-actions button:disabled{opacity:.35}.cf-message{margin-top:10px;padding:10px;background:#132219;border:1px solid #285238;border-radius:9px;font-size:12px;color:#a7efbd}.cf-note{display:block;margin-top:12px;line-height:1.45}@media(max-width:800px){.cf-shell{padding:10px}.cf-grid{grid-template-columns:1fr}.cf-views{grid-template-columns:1fr 1fr}.cf-drop{height:230px}.cf-header b{font-size:18px}.cf-3d-preview{height:400px}.cf-actions{display:grid}.cf-actions button{width:100%}.cf-sheet-source img{width:84px}}
  `}</style></div>
}
