import React,{useState} from 'react'
import CharacterFactory from './CharacterFactory'

export default function FactoryLauncher(){
  const [open,setOpen]=useState(false)
  return <>
    <button onClick={()=>setOpen(true)} style={{position:'fixed',right:14,top:14,zIndex:5000,border:'1px solid #3a4655',background:'#111722',color:'#fff',padding:'10px 13px',borderRadius:10,fontWeight:700,boxShadow:'0 6px 18px rgba(0,0,0,.28)'}}>Character Factory</button>
    {open&&<CharacterFactory onClose={()=>setOpen(false)}/>} 
  </>
}
