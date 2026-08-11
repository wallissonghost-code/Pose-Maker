import React,{useMemo} from 'react'
import {useLoader} from '@react-three/fiber'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {clone} from 'three/addons/utils/SkeletonUtils.js'

function Actor({actor}){
 const gltf=useLoader(GLTFLoader,actor.url)
 const scene=useMemo(()=>clone(gltf.scene),[gltf.scene])
 const d=Math.PI/180
 return <group position={actor.position||[0,0,0]} rotation={(actor.rotation||[0,0,0]).map(v=>v*d)} scale={actor.scale||1} visible={actor.visible!==false}>
  <primitive object={scene}/>
 </group>
}
export default function SceneActors({actors=[]}){return <>{actors.filter(a=>a.url).map(a=><Actor key={a.id} actor={a}/>)}</>}
