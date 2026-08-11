import React from 'react'
import {Canvas} from '@react-three/fiber'
import {OrbitControls} from '@react-three/drei'
import * as THREE from 'three'
import {getTemplate} from './templates/universalTemplates'

function Limb({from,to,radius,color}){
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to)
  const mid=a.clone().add(b).multiplyScalar(.5)
  const len=a.distanceTo(b)
  const dir=b.clone().sub(a).normalize()
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir)
  return <mesh position={mid.toArray()} quaternion={q} castShadow receiveShadow>
    <capsuleGeometry args={[radius,Math.max(.01,len-radius*2),8,14]}/>
    <meshStandardMaterial color={color} roughness={.72}/>
  </mesh>
}

function OrcBlockout({height=2.15,bodyScale=1.18,showRig=true}){
  const s=height/2.15
  const bulk=bodyScale
  const skin='#79942b',dark='#171717',metal='#343941',cloth='#8c241d',leather='#4b2f1d',bone='#d7c39a'
  const shoulder=.58*bulk*s,hip=.26*bulk*s
  const yHip=1.04*s,yChest=1.47*s,yShoulder=1.68*s,yHead=1.98*s
  const upperArm=.38*s,lowerArm=.36*s,upperLeg=.52*s,lowerLeg=.48*s
  const handY=yShoulder-upperArm-lowerArm
  const kneeY=yHip-upperLeg,footY=kneeY-lowerLeg
  return <group position={[0,-1.05*s,0]}>
    <mesh position={[0,yHip,0]} scale={[.46*bulk*s,.28*s,.34*bulk*s]} castShadow><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color={skin} roughness={.72}/></mesh>
    <mesh position={[0,yChest,0]} scale={[.62*bulk*s,.47*s,.36*bulk*s]} castShadow><sphereGeometry args={[1,24,18]}/><meshStandardMaterial color={skin} roughness={.72}/></mesh>
    <mesh position={[0,yHead,0]} scale={[.25*bulk*s,.30*s,.24*bulk*s]} castShadow><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color={skin} roughness={.72}/></mesh>
    <mesh position={[0,yHead+.22*s,-.02*s]} scale={[.23*bulk*s,.18*s,.22*bulk*s]} castShadow><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color={dark} roughness={.9}/></mesh>
    <mesh position={[0,yHead-.18*s,.12*s]} scale={[.20*bulk*s,.15*s,.12*bulk*s]} castShadow><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color={dark} roughness={.9}/></mesh>
    {[-1,1].map(side=>{
      const x=side*shoulder
      const elbow=[side*(shoulder+.07*s),yShoulder-upperArm,0]
      const hand=[side*(shoulder+.04*s),handY,0]
      return <group key={side}>
        <Limb from={[x,yShoulder,0]} to={elbow} radius={.145*bulk*s} color={skin}/>
        <Limb from={elbow} to={hand} radius={.125*bulk*s} color={skin}/>
        <mesh position={hand} scale={[.16*bulk*s,.14*s,.13*bulk*s]} castShadow><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={skin} roughness={.72}/></mesh>
        <mesh position={[side*(shoulder-.01*s),yShoulder+.02*s,0]} scale={[.25*bulk*s,.16*s,.25*bulk*s]} castShadow><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color={metal} metalness={.8} roughness={.35}/></mesh>
        <mesh position={[side*(shoulder+.05*s),yShoulder-upperArm-.18*s,0]} scale={[.19*bulk*s,.22*s,.18*bulk*s]} castShadow><cylinderGeometry args={[1,1,1,16]}/><meshStandardMaterial color={metal} metalness={.78} roughness={.4}/></mesh>
      </group>
    })}
    {[-1,1].map(side=>{
      const hipX=side*hip
      const knee=[hipX,kneeY,0]
      const foot=[hipX,footY,.06*s]
      return <group key={'leg'+side}>
        <Limb from={[hipX,yHip,0]} to={knee} radius={.18*bulk*s} color={skin}/>
        <Limb from={knee} to={foot} radius={.15*bulk*s} color={leather}/>
        <mesh position={[foot[0],foot[1]-.08*s,.11*s]} scale={[.22*bulk*s,.12*s,.34*s]} castShadow><boxGeometry args={[1,1,1]}/><meshStandardMaterial color={leather} roughness={.8}/></mesh>
        <mesh position={[hipX,kneeY+.02*s,0]} scale={[.22*bulk*s,.14*s,.21*bulk*s]} castShadow><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={metal} metalness={.78} roughness={.4}/></mesh>
      </group>
    })}
    <mesh position={[0,yHip+.10*s,.08*s]} scale={[.50*bulk*s,.12*s,.28*bulk*s]} castShadow><boxGeometry args={[1,1,1]}/><meshStandardMaterial color={leather} roughness={.82}/></mesh>
    <mesh position={[0,yHip-.24*s,.13*s]} rotation={[0,0,0]} scale={[.22*bulk*s,.38*s,.035*s]} castShadow><planeGeometry args={[1,1]}/><meshStandardMaterial color={cloth} side={THREE.DoubleSide} roughness={.85}/></mesh>
    <mesh position={[0,yChest+.03*s,.30*s]} scale={[.11*s,.13*s,.06*s]} castShadow><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={bone} roughness={.75}/></mesh>
    {showRig&&<group>
      <mesh position={[0,yHip,0]}><sphereGeometry args={[.035*s,10,8]}/><meshBasicMaterial color="#83a1ff"/></mesh>
      <mesh position={[0,yChest,0]}><sphereGeometry args={[.035*s,10,8]}/><meshBasicMaterial color="#83a1ff"/></mesh>
      <mesh position={[0,yHead,0]}><sphereGeometry args={[.035*s,10,8]}/><meshBasicMaterial color="#83a1ff"/></mesh>
      <Limb from={[0,yHip,0]} to={[0,yChest,0]} radius={.012*s} color="#83a1ff"/>
      <Limb from={[0,yChest,0]} to={[0,yHead,0]} radius={.012*s} color="#83a1ff"/>
      {[-1,1].map(side=><group key={'rig'+side}>
        <Limb from={[0,yChest,0]} to={[side*shoulder,yShoulder,0]} radius={.01*s} color="#83a1ff"/>
        <Limb from={[side*shoulder,yShoulder,0]} to={[side*(shoulder+.07*s),yShoulder-upperArm,0]} radius={.01*s} color="#83a1ff"/>
        <Limb from={[side*(shoulder+.07*s),yShoulder-upperArm,0]} to={[side*(shoulder+.04*s),handY,0]} radius={.01*s} color="#83a1ff"/>
        <Limb from={[0,yHip,0]} to={[side*hip,kneeY,0]} radius={.01*s} color="#83a1ff"/>
        <Limb from={[side*hip,kneeY,0]} to={[side*hip,footY,.06*s]} radius={.01*s} color="#83a1ff"/>
      </group>)}
    </group>}
  </group>
}

export default function UniversalTemplatePreview({templateId='orc_large',height=2.15,bodyScale=1.18,showRig=true}){
  const template=getTemplate(templateId)
  return <div className="cf-3d-preview">
    <Canvas shadows camera={{position:[3.1,1.85,4.2],fov:38}} gl={{antialias:true,alpha:true}}>
      <ambientLight intensity={1.15}/>
      <directionalLight position={[3,5,4]} intensity={2.2} castShadow/>
      <directionalLight position={[-3,2,-3]} intensity={.65}/>
      {template.id==='orc_large'?<OrcBlockout height={height} bodyScale={bodyScale} showRig={showRig}/>:<OrcBlockout height={height} bodyScale={1} showRig={showRig}/>} 
      <gridHelper args={[8,16,0x2f3745,0x1a2029]} position={[0,-1.05,0]}/>
      <OrbitControls makeDefault target={[0,.05,0]} enableDamping dampingFactor={.08}/>
    </Canvas>
    <div className="cf-preview-badge">{template.name} • {template.status}</div>
  </div>
}
