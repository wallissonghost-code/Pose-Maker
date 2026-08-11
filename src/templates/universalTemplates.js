export const PM_HUMANOID_V1={
  id:'PM-HUMANOID-V1',
  version:1,
  upAxis:'Y',
  units:'meters',
  root:'hips',
  bones:[
    {id:'hips',parent:null,pos:[0,1.08,0]},
    {id:'spine',parent:'hips',pos:[0,.22,0]},
    {id:'chest',parent:'spine',pos:[0,.28,0]},
    {id:'neck',parent:'chest',pos:[0,.28,0]},
    {id:'head',parent:'neck',pos:[0,.19,0]},
    {id:'clavicleL',parent:'chest',pos:[-.18,.22,0]},
    {id:'upperArmL',parent:'clavicleL',pos:[-.30,0,0]},
    {id:'lowerArmL',parent:'upperArmL',pos:[-.37,0,0]},
    {id:'handL',parent:'lowerArmL',pos:[-.31,0,0]},
    {id:'clavicleR',parent:'chest',pos:[.18,.22,0]},
    {id:'upperArmR',parent:'clavicleR',pos:[.30,0,0]},
    {id:'lowerArmR',parent:'upperArmR',pos:[.37,0,0]},
    {id:'handR',parent:'lowerArmR',pos:[.31,0,0]},
    {id:'upperLegL',parent:'hips',pos:[-.18,-.10,0]},
    {id:'lowerLegL',parent:'upperLegL',pos:[0,-.50,0]},
    {id:'footL',parent:'lowerLegL',pos:[0,-.47,.08]},
    {id:'upperLegR',parent:'hips',pos:[.18,-.10,0]},
    {id:'lowerLegR',parent:'upperLegR',pos:[0,-.50,0]},
    {id:'footR',parent:'lowerLegR',pos:[0,-.47,.08]}
  ],
  sockets:[
    {id:'head',bone:'head',pos:[0,.18,0],rot:[0,0,0]},
    {id:'handL',bone:'handL',pos:[-.08,0,0],rot:[0,0,0]},
    {id:'handR',bone:'handR',pos:[.08,0,0],rot:[0,0,0]},
    {id:'spine',bone:'chest',pos:[0,.05,-.12],rot:[0,0,0]},
    {id:'back',bone:'chest',pos:[0,.10,-.22],rot:[0,0,0]},
    {id:'hips',bone:'hips',pos:[0,0,-.10],rot:[0,0,0]},
    {id:'footL',bone:'footL',pos:[0,0,.10],rot:[0,0,0]},
    {id:'footR',bone:'footR',pos:[0,0,.10],rot:[0,0,0]}
  ],
  humanoidMap:{
    hips:'hips',spine:'spine',chest:'chest',neck:'neck',head:'head',
    upperArmL:'upperArmL',lowerArmL:'lowerArmL',handL:'handL',
    upperArmR:'upperArmR',lowerArmR:'lowerArmR',handR:'handR',
    upperLegL:'upperLegL',lowerLegL:'lowerLegL',footL:'footL',
    upperLegR:'upperLegR',lowerLegR:'lowerLegR',footR:'footR'
  }
}

export const UNIVERSAL_TEMPLATES={
  orc_large:{
    id:'orc_large',name:'Orc Grande Base',status:'procedural-v1',rig:PM_HUMANOID_V1.id,
    body:'Humanoide pesado',heightDefault:2.15,heightRange:[1.9,2.5],bodyScaleDefault:1.18,
    proportions:{head:.32,neck:.14,chestWidth:.86,chestDepth:.43,waistWidth:.55,hipWidth:.58,shoulderWidth:1.18,armLength:.92,legLength:1.08,handScale:1.25,footScale:1.18},
    materials:[
      {id:'skin',label:'Pele',baseColor:'#79942b',roughness:.72,metalness:0},
      {id:'hair',label:'Cabelo',baseColor:'#151515',roughness:.82,metalness:0},
      {id:'cloth',label:'Tecido',baseColor:'#8c241d',roughness:.82,metalness:0},
      {id:'leather',label:'Couro',baseColor:'#4b2f1d',roughness:.78,metalness:.02},
      {id:'metal',label:'Metal',baseColor:'#343941',roughness:.38,metalness:.82},
      {id:'bone',label:'Osso',baseColor:'#d7c39a',roughness:.7,metalness:0}
    ],
    parts:[
      {id:'body',type:'body',material:'skin',rigged:true},
      {id:'hair',type:'hair',material:'hair',socket:'head'},
      {id:'shoulderArmorL',type:'armor',material:'metal',socket:'upperArmL'},
      {id:'shoulderArmorR',type:'armor',material:'metal',socket:'upperArmR'},
      {id:'bracerL',type:'armor',material:'metal',socket:'lowerArmL'},
      {id:'bracerR',type:'armor',material:'metal',socket:'lowerArmR'},
      {id:'belt',type:'armor',material:'leather',socket:'hips'},
      {id:'tabard',type:'cloth',material:'cloth',socket:'hips'},
      {id:'bootL',type:'armor',material:'leather',socket:'footL'},
      {id:'bootR',type:'armor',material:'leather',socket:'footR'}
    ],
    projection:{frontWeight:.48,backWeight:.30,sideWeight:.22,seamBlend:true,mirrorMissingRightSide:true},
    export:{preferred:'glb',embedTextures:true,skin:true,animations:true}
  },
  human_male:{id:'human_male',name:'Humano Masculino',status:'planned',rig:PM_HUMANOID_V1.id,body:'Humanoide padrão'},
  human_female:{id:'human_female',name:'Humano Feminino',status:'planned',rig:PM_HUMANOID_V1.id,body:'Humanoide padrão'},
  brute:{id:'brute',name:'Brutamontes',status:'planned',rig:PM_HUMANOID_V1.id,body:'Humanoide muito largo'},
  chibi:{id:'chibi',name:'Chibi',status:'planned',rig:'PM-HUMANOID-CHIBI',body:'Humanoide estilizado'}
}

export function getTemplate(id){return UNIVERSAL_TEMPLATES[id]||UNIVERSAL_TEMPLATES.orc_large}
export function getRig(id){return id===PM_HUMANOID_V1.id?PM_HUMANOID_V1:PM_HUMANOID_V1}
