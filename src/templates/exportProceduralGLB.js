import * as THREE from 'three'
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js'
import {getRig,getTemplate} from './universalTemplates'

const BASE_HEIGHT=2.15

function matFrom(def){
  return new THREE.MeshStandardMaterial({
    name:def.id,
    color:new THREE.Color(def.baseColor||'#ffffff'),
    roughness:def.roughness??.7,
    metalness:def.metalness??0,
  })
}

function addPrimitive(parent,name,geometry,material,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
  const mesh=new THREE.Mesh(geometry,material)
  mesh.name=name
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.scale.set(...scale)
  mesh.castShadow=true
  mesh.receiveShadow=true
  parent.add(mesh)
  return mesh
}

function capsuleAlongX(length,radius,material,name,sign=1){
  const g=new THREE.CapsuleGeometry(radius,Math.max(.01,length-radius*2),8,12)
  g.rotateZ(sign>0?-Math.PI/2:Math.PI/2)
  g.translate(sign*length/2,0,0)
  const m=new THREE.Mesh(g,material)
  m.name=name
  m.castShadow=true
  return m
}

function capsuleAlongY(length,radius,material,name,sign=-1){
  const g=new THREE.CapsuleGeometry(radius,Math.max(.01,length-radius*2),8,12)
  g.translate(0,sign*length/2,0)
  const m=new THREE.Mesh(g,material)
  m.name=name
  m.castShadow=true
  return m
}

function buildBones(rig,height,bodyScale){
  const s=height/BASE_HEIGHT
  const bones={}
  for(const def of rig.bones){
    const b=new THREE.Bone()
    b.name=def.id
    b.userData.poseMakerBone=def.id
    const widen=/clavicle|upperArm|upperLeg/.test(def.id)?bodyScale:1
    b.position.set(def.pos[0]*s*widen,def.pos[1]*s,def.pos[2]*s)
    bones[def.id]=b
  }
  for(const def of rig.bones){
    const b=bones[def.id]
    if(def.parent) bones[def.parent].add(b)
  }
  return {bones,root:bones[rig.root],ordered:rig.bones.map(x=>bones[x.id])}
}

function attachSockets(rig,bones,height){
  const s=height/BASE_HEIGHT
  const sockets={}
  for(const def of rig.sockets){
    const o=new THREE.Object3D()
    o.name=`socket_${def.id}`
    o.userData={poseMakerSocket:def.id,bone:def.bone}
    o.position.set(def.pos[0]*s,def.pos[1]*s,def.pos[2]*s)
    o.rotation.set(...def.rot)
    bones[def.bone]?.add(o)
    sockets[def.id]=o
  }
  return sockets
}

function addOrcParts(group,bones,mats,height,bodyScale){
  const s=height/BASE_HEIGHT,b=bodyScale
  const sphere=(r=1,w=18,h=14)=>new THREE.SphereGeometry(r,w,h)
  const box=()=>new THREE.BoxGeometry(1,1,1)
  const cyl=()=>new THREE.CylinderGeometry(1,1,1,16)

  addPrimitive(bones.hips,'body_hips',sphere(),mats.skin,[0,0,0],[0,0,0],[.46*b*s,.28*s,.34*b*s])
  addPrimitive(bones.spine,'body_waist',sphere(),mats.skin,[0,.05*s,0],[0,0,0],[.43*b*s,.25*s,.31*b*s])
  addPrimitive(bones.chest,'body_chest',sphere(),mats.skin,[0,-.08*s,0],[0,0,0],[.62*b*s,.47*s,.36*b*s])
  addPrimitive(bones.neck,'body_neck',cyl(),mats.skin,[0,.05*s,0],[0,0,0],[.15*b*s,.18*s,.15*b*s])
  addPrimitive(bones.head,'body_head',sphere(),mats.skin,[0,.02*s,0],[0,0,0],[.25*b*s,.30*s,.24*b*s])
  addPrimitive(bones.head,'hair_top',sphere(),mats.hair,[0,.24*s,-.02*s],[0,0,0],[.23*b*s,.18*s,.22*b*s])
  addPrimitive(bones.head,'beard',sphere(),mats.hair,[0,-.18*s,.12*s],[0,0,0],[.20*b*s,.15*s,.12*b*s])

  const armLen=.37*s,foreLen=.31*s
  for(const side of ['L','R']){
    const sign=side==='R'?1:-1
    const ua=bones[`upperArm${side}`],la=bones[`lowerArm${side}`],hand=bones[`hand${side}`]
    ua.add(capsuleAlongX(armLen,.145*b*s,mats.skin,`upper_arm_${side}`,sign))
    la.add(capsuleAlongX(foreLen,.125*b*s,mats.skin,`lower_arm_${side}`,sign))
    addPrimitive(hand,`hand_${side}`,sphere(),mats.skin,[sign*.06*s,0,0],[0,0,0],[.16*b*s,.14*s,.13*b*s])
    addPrimitive(ua,`shoulder_armor_${side}`,sphere(),mats.metal,[0,.02*s,0],[0,0,0],[.25*b*s,.16*s,.25*b*s])
    addPrimitive(la,`bracer_${side}`,cyl(),mats.metal,[sign*.10*s,0,0],[0,0,Math.PI/2],[.18*b*s,.20*s,.18*b*s])
  }

  const thigh=.50*s,shin=.47*s
  for(const side of ['L','R']){
    const ul=bones[`upperLeg${side}`],ll=bones[`lowerLeg${side}`],foot=bones[`foot${side}`]
    ul.add(capsuleAlongY(thigh,.18*b*s,mats.skin,`upper_leg_${side}`,-1))
    ll.add(capsuleAlongY(shin,.15*b*s,mats.leather,`lower_leg_${side}`,-1))
    addPrimitive(foot,`boot_${side}`,box(),mats.leather,[0,-.08*s,.12*s],[0,0,0],[.22*b*s,.12*s,.34*s])
    addPrimitive(ll,`knee_armor_${side}`,sphere(),mats.metal,[0,0,.02*s],[0,0,0],[.22*b*s,.14*s,.21*b*s])
  }

  addPrimitive(bones.hips,'belt',box(),mats.leather,[0,.08*s,.08*s],[0,0,0],[.50*b*s,.12*s,.28*b*s])
  const tabard=addPrimitive(bones.hips,'tabard',new THREE.PlaneGeometry(1,1),mats.cloth,[0,-.24*s,.20*s],[0,0,0],[.34*b*s,.58*s,.035*s])
  tabard.material=tabard.material.clone();tabard.material.side=THREE.DoubleSide
  addPrimitive(bones.chest,'chest_bone_ornament',sphere(),mats.bone,[0,.02*s,.32*s],[0,0,0],[.11*s,.13*s,.06*s])

  group.userData.modularParts=['body','hair','shoulderArmorL','shoulderArmorR','bracerL','bracerR','belt','tabard','bootL','bootR']
}

function addSkinAnchor(group,orderedBones){
  const geometry=new THREE.BoxGeometry(.006,.006,.006)
  const count=geometry.attributes.position.count
  const indices=new Uint16Array(count*4)
  const weights=new Float32Array(count*4)
  for(let i=0;i<count;i++) weights[i*4]=1
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4))
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4))
  const material=new THREE.MeshBasicMaterial({transparent:true,opacity:.001,depthWrite:false})
  material.name='PM_RIG_ANCHOR'
  const mesh=new THREE.SkinnedMesh(geometry,material)
  mesh.name='PM_RIG_SKIN_ANCHOR'
  group.add(mesh)
  group.updateMatrixWorld(true)
  const skeleton=new THREE.Skeleton(orderedBones)
  mesh.bind(skeleton)
  mesh.userData.poseMakerRigAnchor=true
  return mesh
}

export function buildProceduralCharacter({templateId='orc_large',height=2.15,bodyScale=1.18,name='Pose Maker Character',referenceMeta=null}={}){
  const template=getTemplate(templateId)
  const rig=getRig(template.rig)
  const group=new THREE.Group()
  group.name=name
  group.userData={
    poseMakerTemplate:template.id,
    poseMakerRig:rig.id,
    poseMakerVersion:3,
    referenceMeta:referenceMeta||undefined,
  }

  const mats={}
  for(const def of template.materials||[]) mats[def.id]=matFrom(def)
  if(!mats.skin) mats.skin=new THREE.MeshStandardMaterial({color:'#79942b',roughness:.72})
  if(!mats.hair) mats.hair=new THREE.MeshStandardMaterial({color:'#151515',roughness:.82})
  if(!mats.metal) mats.metal=new THREE.MeshStandardMaterial({color:'#343941',roughness:.38,metalness:.82})
  if(!mats.leather) mats.leather=new THREE.MeshStandardMaterial({color:'#4b2f1d',roughness:.78})
  if(!mats.cloth) mats.cloth=new THREE.MeshStandardMaterial({color:'#8c241d',roughness:.82})
  if(!mats.bone) mats.bone=new THREE.MeshStandardMaterial({color:'#d7c39a',roughness:.7})

  const {bones,root,ordered}=buildBones(rig,height,bodyScale)
  group.add(root)
  attachSockets(rig,bones,height)
  addOrcParts(group,bones,mats,height,bodyScale)
  addSkinAnchor(group,ordered)
  group.updateMatrixWorld(true)
  return {group,bones,rig,template}
}

export async function exportProceduralGLB(options={}){
  const {group}=buildProceduralCharacter(options)
  const exporter=new GLTFExporter()
  const result=await new Promise((resolve,reject)=>{
    exporter.parse(group,resolve,reject,{
      binary:true,
      trs:true,
      onlyVisible:true,
      includeCustomExtensions:false,
      animations:[],
    })
  })
  if(!(result instanceof ArrayBuffer)) throw new Error('O exportador não retornou GLB binário.')
  return new Blob([result],{type:'model/gltf-binary'})
}

export function downloadGLB(blob,fileName){
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url
  a.download=fileName
  a.click()
  setTimeout(()=>URL.revokeObjectURL(url),1500)
}
