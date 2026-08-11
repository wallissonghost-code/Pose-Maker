import React,{useMemo,useState} from 'react'

const TEMPLATES=[
  {id:'orc_large',name:'Orc Grande',body:'Humanoide pesado',rig:'PM-HUMANOID-V1',status:'ready-spec'},
  {id:'human_male',name:'Humano Masculino',body:'Humanoide padrão',rig:'PM-HUMANOID-V1',status:'planned'},
  {id:'human_female',name:'Humano Feminino',body:'Humanoide padrão',rig:'PM-HUMANOID-V1',status:'planned'},
  {id:'brute',name:'Brutamontes',body:'Humanoide muito largo',rig:'PM-HUMANOID-V1',status:'planned'},
  {id:'chibi',name:'Chibi',body:'Humanoide estilizado',rig:'PM-HUMANOID-CHIBI',status:'planned'},
]

const slots=[
  {id:'front',label:'FRENTE',required:true},
  {id:'back',label:'COSTAS',required:true},
  {id:'side',label:'LADO',required:true},
  {id:'weapon',label:'ARMA',required:false},
]

const readFile=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})
const downloadJson=(obj,name)=>{const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)}

export default function CharacterFactory({onClose}){
  const [template,setTemplate]=useState('orc_large')
  const [files,setFiles]=useState({})
  const [previews,setPreviews]=useState({})
  const [name,setName]=useState('Orc Guerreiro')
  const [height,setHeight]=useState(2.15)
  const [bodyScale,setBodyScale]=useState(1.15)
  const [weaponSocket,setWeaponSocket]=useState('handR')
  const [message,setMessage]=useState('')

  const selectedTemplate=TEMPLATES.find(t=>t.id===template)
  const requiredOk=useMemo(()=>['front','back','side'].every(k=>files[k]),[files])
  const score=useMemo(()=>['front','back','side','weapon'].reduce((n,k)=>n+(files[k]?1:0),0),[files])

  const choose=async(id,file)=>{
    if(!file)return
    if(!file.type.startsWith('image/')){setMessage('Use PNG, JPG ou WebP nas vistas.');return}
    const url=await readFile(file)
    setFiles(v=>({...v,[id]:file}))
    setPreviews(v=>({...v,[id]:url}))
    setMessage('')
  }

  const createSpec=()=>{
    if(!requiredOk){setMessage('Adicione pelo menos FRENTE, COSTAS e LADO.');return}
    const spec={
      format:'POSEMAKER_CHARACTER_FACTORY',version:1,
      createdAt:new Date().toISOString(),
      character:{name,template:template,heightMeters:Number(height),bodyScale:Number(bodyScale)},
      rig:{profile:selectedTemplate.rig,yUp:true,units:'meters',fps:30},
      references:Object.fromEntries(slots.filter(s=>files[s.id]).map(s=>[s.id,{name:files[s.id].name,type:files[s.id].type,size:files[s.id].size}])),
      projection:{front:'front',back:'back',sideLeft:'side',mirrorSideRight:true,blendSeams:true},
      weapon:files.weapon?{reference:'weapon',socket:weaponSocket,separateMesh:true}:null,
      pipeline:[
        'validate_multiview','normalize_silhouette','load_template_mesh','project_reference_textures','blend_side_seams','attach_universal_rig','export_glb'
      ],
      note:'Este arquivo descreve a montagem. O GLB final requer um template 3D real correspondente ao templateId.'
    }
    downloadJson(spec,`${name.toLowerCase().replace(/[^a-z0-9]+/gi,'-')||'character'}.pmfactory.json`)
    setMessage('Projeto da fábrica criado. As vistas foram validadas e o pipeline está definido.')
  }

  return <div className="cf-backdrop">
    <div className="cf-shell">
      <header className="cf-header">
        <div><b>CHARACTER FACTORY</b><span>Multi-view → Template → Rig → GLB</span></div>
        <button onClick={onClose}>Fechar</button>
      </header>

      <div className="cf-grid">
        <section className="cf-panel">
          <h2>1. Referências</h2>
          <p>Use imagens consistentes do mesmo personagem. Frente, costas e lado são obrigatórios.</p>
          <div className="cf-views">
            {slots.map(s=><label className={`cf-drop ${files[s.id]?'ok':''}`} key={s.id}>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>choose(s.id,e.target.files?.[0])}/>
              {previews[s.id]?<img src={previews[s.id]} alt={s.label}/>:<div className="cf-empty"><strong>{s.label}</strong><small>{s.required?'Obrigatório':'Opcional'}</small><span>Selecionar imagem</span></div>}
              {files[s.id]&&<em>✓ {s.label}</em>}
            </label>)}
          </div>
        </section>

        <section className="cf-panel cf-settings">
          <h2>2. Template</h2>
          <label>Nome<input value={name} onChange={e=>setName(e.target.value)}/></label>
          <label>Corpo<select value={template} onChange={e=>setTemplate(e.target.value)}>{TEMPLATES.map(t=><option key={t.id} value={t.id}>{t.name}{t.status==='planned'?' (em breve)':''}</option>)}</select></label>
          <div className="cf-info"><b>{selectedTemplate.name}</b><span>{selectedTemplate.body}</span><span>Rig: {selectedTemplate.rig}</span></div>
          <label>Altura <b>{height} m</b><input type="range" min="1.2" max="3" step="0.05" value={height} onChange={e=>setHeight(e.target.value)}/></label>
          <label>Volume corporal <b>{bodyScale}×</b><input type="range" min="0.7" max="1.6" step="0.05" value={bodyScale} onChange={e=>setBodyScale(e.target.value)}/></label>
          <label>Socket da arma<select value={weaponSocket} onChange={e=>setWeaponSocket(e.target.value)}><option value="handR">Mão direita</option><option value="handL">Mão esquerda</option><option value="spine">Costas</option></select></label>
        </section>
      </div>

      <section className="cf-panel cf-pipeline">
        <h2>3. Pipeline</h2>
        <div className="cf-steps"><span className={requiredOk?'done':''}>Vistas</span><i>→</i><span>Template 3D</span><i>→</i><span>Projeção</span><i>→</i><span>Rig universal</span><i>→</i><span>GLB</span></div>
        <div className="cf-status"><b>{score}/4 referências</b><span>{requiredOk?'Pronto para montar o projeto':'Faltam vistas obrigatórias'}</span></div>
        <button className="cf-primary" disabled={!requiredOk} onClick={createSpec}>Preparar personagem</button>
        {message&&<div className="cf-message">{message}</div>}
        <small className="cf-note">A primeira etapa cria o projeto técnico real da fábrica. Para sair um GLB fiel, o próximo passo é adicionarmos o arquivo 3D do template “Orc Grande”; depois o mesmo pipeline será reutilizado para os outros corpos.</small>
      </section>
    </div>
    <style>{`
      .cf-backdrop{position:fixed;inset:0;z-index:99999;background:rgba(4,6,10,.96);color:#f3f5f7;overflow:auto;font-family:Inter,system-ui,sans-serif}
      .cf-shell{max-width:1250px;margin:0 auto;padding:18px}
      .cf-header{display:flex;justify-content:space-between;align-items:center;padding:14px 0 20px}.cf-header div{display:flex;flex-direction:column;gap:3px}.cf-header b{font-size:22px;letter-spacing:.06em}.cf-header span{font-size:12px;color:#9ca7b4}.cf-header button,.cf-primary{background:#202733;color:white;border:1px solid #394454;border-radius:10px;padding:10px 15px}
      .cf-grid{display:grid;grid-template-columns:1.6fr .7fr;gap:14px}.cf-panel{background:#0d1118;border:1px solid #242d39;border-radius:16px;padding:16px}.cf-panel h2{font-size:15px;margin:0 0 6px}.cf-panel p,.cf-note{color:#9ca7b4;font-size:12px}
      .cf-views{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.cf-drop{height:320px;border:1px dashed #3c4655;border-radius:12px;overflow:hidden;position:relative;background:#080b10;cursor:pointer}.cf-drop.ok{border-color:#4c8}.cf-drop input{display:none}.cf-drop img{width:100%;height:100%;object-fit:contain;background:#f4f4f4}.cf-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px}.cf-empty strong{font-size:14px}.cf-empty small{color:#818c99}.cf-empty span{font-size:11px;padding:7px 10px;border-radius:8px;background:#171d26}.cf-drop em{position:absolute;left:8px;bottom:8px;background:rgba(0,0,0,.72);padding:5px 7px;border-radius:6px;font-size:10px;font-style:normal}
      .cf-settings{display:flex;flex-direction:column;gap:12px}.cf-settings label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#abb5c0}.cf-settings input,.cf-settings select{background:#090c11;color:white;border:1px solid #303947;border-radius:9px;padding:10px}.cf-settings input[type=range]{padding:0}.cf-info{display:flex;flex-direction:column;gap:4px;background:#090c11;padding:11px;border-radius:10px}.cf-info span{font-size:11px;color:#94a0ae}
      .cf-pipeline{margin-top:14px}.cf-steps{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:14px 0}.cf-steps span{border:1px solid #343f4d;border-radius:999px;padding:7px 10px;font-size:11px}.cf-steps span.done{border-color:#4c8;color:#7ee0a5}.cf-steps i{color:#596575}.cf-status{display:flex;gap:14px;font-size:12px;margin-bottom:12px}.cf-status span{color:#9ca7b4}.cf-primary{background:#f3f5f7;color:#080b10;font-weight:700}.cf-primary:disabled{opacity:.35}.cf-message{margin-top:10px;padding:10px;background:#132219;border:1px solid #285238;border-radius:9px;font-size:12px;color:#a7efbd}.cf-note{display:block;margin-top:12px;line-height:1.45}
      @media(max-width:800px){.cf-shell{padding:10px}.cf-grid{grid-template-columns:1fr}.cf-views{grid-template-columns:1fr 1fr}.cf-drop{height:240px}.cf-header b{font-size:18px}}
    `}</style>
  </div>
}
