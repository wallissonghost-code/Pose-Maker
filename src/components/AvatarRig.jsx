import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { TransformControls } from '@react-three/drei'

const matColor = (active) => active ? '#6f8cff' : '#d8dbe4'
const jointColor = (active) => active ? '#f0b35b' : '#2a2f3b'

function Bone({ a, b, radius=.12, color='#d8dbe4' }) {
  const {mid, len, quat} = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const delta = vb.clone().sub(va)
    const len = delta.length()
    const mid = va.clone().add(vb).multiplyScalar(.5)
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), delta.clone().normalize())
    return {mid, len, quat}
  }, [a[0],a[1],a[2],b[0],b[1],b[2]])
  return <mesh position={mid.toArray()} quaternion={quat}>
    <capsuleGeometry args={[radius, Math.max(.01, len-radius*2), 8, 16]}/>
    <meshStandardMaterial color={color}/>
  </mesh>
}

function Joint({p, active=false, size=.13, onClick}){
  return <mesh position={p} onClick={onClick}>
    <sphereGeometry args={[size,16,16]}/><meshStandardMaterial color={jointColor(active)}/>
  </mesh>
}

function solve2Bone(root, target, len1, len2, bendSign=1, planeZ=0){
  const r = new THREE.Vector3(...root)
  const t = new THREE.Vector3(...target)
  const dir = t.clone().sub(r)
  let d = Math.max(.001, dir.length())
  const max = len1 + len2 - .001
  if(d > max){ dir.setLength(max); t.copy(r).add(dir); d = max }
  const x = (len1*len1 - len2*len2 + d*d)/(2*d)
  const h = Math.sqrt(Math.max(0, len1*len1 - x*x))
  const n = dir.clone().normalize()
  let perp = new THREE.Vector3(-n.y, n.x, 0)
  if(perp.lengthSq() < .001) perp.set(1,0,0)
  perp.normalize().multiplyScalar(h*bendSign)
  const elbow = r.clone().add(n.multiplyScalar(x)).add(perp)
  elbow.z += planeZ
  return {joint:elbow.toArray(), end:t.toArray()}
}

function IKHandle({position, active, onSelect, onChange}){
  const ref = useRef()
  return <>
    <mesh ref={ref} position={position} onClick={(e)=>{e.stopPropagation();onSelect()}}>
      <sphereGeometry args={[active?.11:.075,18,18]}/>
      <meshStandardMaterial color={active?'#72e2ff':'#57657f'} emissive={active?'#164c59':'#000000'} emissiveIntensity={1.5}/>
    </mesh>
    {active && <TransformControls object={ref} mode="translate" size={.72} onObjectChange={()=>{
      if(ref.current) onChange(ref.current.position.toArray())
    }}/>} 
  </>
}

export default function AvatarRig({ selectedBone, setSelectedBone, pose, ikEnabled, ikTargets, setIkTarget, selectedIK, setSelectedIK, weaponAttached, skinColor='#d8dbe4', hairColor='#242832', exportYaw=0, showControls=true }) {
  const k = Math.PI/180
  const deg = (bone) => pose[bone] || {x:0,y:0,z:0}
  const rot = (bone) => { const p=deg(bone); return [p.x*k,p.y*k,p.z*k] }

  const shoulderY = 1.34
  const shoulderL = [-.48, shoulderY, 0]
  const shoulderR = [.48, shoulderY, 0]
  const hipL = [-.22, .02, 0]
  const hipR = [.22, .02, 0]

  const armL = solve2Bone(shoulderL, ikTargets.handL, .62, .58, -1)
  const armR = solve2Bone(shoulderR, ikTargets.handR, .62, .58, 1)
  const legL = solve2Bone(hipL, ikTargets.footL, .72, .72, 1)
  const legR = solve2Bone(hipR, ikTargets.footR, .72, .72, -1)

  const click = (name)=>(e)=>{e?.stopPropagation?.();setSelectedBone(name)}

  return <group position={[0,-.75,0]} rotation={[0,exportYaw,0]}>
    <group rotation={rot('hips')}>
      <mesh onClick={click('hips')} position={[0,.15,0]}><boxGeometry args={[.72,.34,.34]}/><meshStandardMaterial color={matColor(selectedBone==='hips')}/></mesh>
      <group rotation={rot('spine')}>
        <mesh onClick={click('spine')} position={[0,.78,0]}><boxGeometry args={[.9,.88,.36]}/><meshStandardMaterial color={matColor(selectedBone==='spine')}/></mesh>
        <group position={[0,1.55,0]} rotation={rot('head')} onClick={click('head')}>
          <mesh><sphereGeometry args={[.32,24,24]}/><meshStandardMaterial color={selectedBone==='head'?'#6f8cff':skinColor}/></mesh>
          <mesh position={[0,.18,0]}><sphereGeometry args={[.33,24,12,0,Math.PI*2,0,Math.PI*.55]}/><meshStandardMaterial color={hairColor}/></mesh>
          <mesh position={[0,.02,.30]}><boxGeometry args={[.24,.07,.04]}/><meshStandardMaterial color="#202634"/></mesh>
        </group>
      </group>
    </group>

    {ikEnabled ? <>
      <Bone a={shoulderL} b={armL.joint} color={matColor(selectedBone==='armL')}/><Bone a={armL.joint} b={armL.end} radius={.105} color={matColor(selectedBone==='armL')}/>
      <Joint p={armL.joint}/><Joint p={armL.end} active={selectedBone==='armL'} onClick={click('armL')}/>
      <Bone a={shoulderR} b={armR.joint} color={matColor(selectedBone==='armR')}/><Bone a={armR.joint} b={armR.end} radius={.105} color={matColor(selectedBone==='armR')}/>
      <Joint p={armR.joint}/><Joint p={armR.end} active={selectedBone==='armR'} onClick={click('armR')}/>
      <Bone a={hipL} b={legL.joint} radius={.14} color={matColor(selectedBone==='legL')}/><Bone a={legL.joint} b={legL.end} radius={.125} color={matColor(selectedBone==='legL')}/>
      <Joint p={legL.joint}/><Joint p={legL.end} active={selectedBone==='legL'} onClick={click('legL')}/>
      <Bone a={hipR} b={legR.joint} radius={.14} color={matColor(selectedBone==='legR')}/><Bone a={legR.joint} b={legR.end} radius={.125} color={matColor(selectedBone==='legR')}/>
      <Joint p={legR.joint}/><Joint p={legR.end} active={selectedBone==='legR'} onClick={click('legR')}/>

      {showControls&&<><IKHandle position={ikTargets.handL} active={selectedIK==='handL'} onSelect={()=>setSelectedIK('handL')} onChange={p=>setIkTarget('handL',p)} />
      <IKHandle position={ikTargets.handR} active={selectedIK==='handR'} onSelect={()=>setSelectedIK('handR')} onChange={p=>setIkTarget('handR',p)} />
      <IKHandle position={ikTargets.footL} active={selectedIK==='footL'} onSelect={()=>setSelectedIK('footL')} onChange={p=>setIkTarget('footL',p)} />
      <IKHandle position={ikTargets.footR} active={selectedIK==='footR'} onSelect={()=>setSelectedIK('footR')} onChange={p=>setIkTarget('footR',p)} /></>}
    </> : <>
      <group position={shoulderL} rotation={rot('armL')} onClick={click('armL')}><mesh position={[-.23,-.35,0]} rotation={[0,0,.3]}><capsuleGeometry args={[.12,.9,8,16]}/><meshStandardMaterial color={matColor(selectedBone==='armL')}/></mesh></group>
      <group position={shoulderR} rotation={rot('armR')} onClick={click('armR')}><mesh position={[.23,-.35,0]} rotation={[0,0,-.3]}><capsuleGeometry args={[.12,.9,8,16]}/><meshStandardMaterial color={matColor(selectedBone==='armR')}/></mesh></group>
      <group position={hipL} rotation={rot('legL')} onClick={click('legL')}><mesh position={[0,-.68,0]}><capsuleGeometry args={[.15,1.05,8,16]}/><meshStandardMaterial color={matColor(selectedBone==='legL')}/></mesh></group>
      <group position={hipR} rotation={rot('legR')} onClick={click('legR')}><mesh position={[0,-.68,0]}><capsuleGeometry args={[.15,1.05,8,16]}/><meshStandardMaterial color={matColor(selectedBone==='legR')}/></mesh></group>
    </>}

    {weaponAttached && <group position={ikEnabled ? armR.end : [1.05,.38,0]} rotation={[0,0,-.12]}>
      <mesh position={[.32,0,.03]}><boxGeometry args={[.72,.10,.13]}/><meshStandardMaterial color="#343a46" metalness={.45} roughness={.45}/></mesh>
      <mesh position={[.05,-.11,.03]} rotation={[0,0,-.25]}><boxGeometry args={[.10,.24,.11]}/><meshStandardMaterial color="#272d38"/></mesh>
      <mesh position={[.67,0,.03]}><boxGeometry args={[.20,.045,.05]}/><meshStandardMaterial color="#171b22"/></mesh>
    </group>}
  </group>
}
