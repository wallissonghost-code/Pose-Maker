const imageFromUrl=url=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url})
export const fileToDataUrl=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})

function foreground(r,g,b,a){
  if(a<22)return false
  const max=Math.max(r,g,b),min=Math.min(r,g,b)
  if(r>244&&g>244&&b>244)return false
  if(max-min<7&&r>230&&g>230&&b>230)return false
  return true
}

function buildDensity(img,axis='x'){
  const maxSide=700,scale=Math.min(1,maxSide/Math.max(img.width,img.height))
  const w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale))
  const c=document.createElement('canvas');c.width=w;c.height=h
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,w,h)
  const data=ctx.getImageData(0,0,w,h).data
  const n=axis==='x'?w:h,density=new Float32Array(n)
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4
    if(!foreground(data[i],data[i+1],data[i+2],data[i+3]))continue
    density[axis==='x'?x:y]++
  }
  const divisor=axis==='x'?h:w
  for(let i=0;i<n;i++)density[i]/=divisor
  return {density,scale,w,h}
}

function smooth(values,radius=3){
  const out=new Float32Array(values.length)
  for(let i=0;i<values.length;i++){
    let s=0,n=0
    for(let j=Math.max(0,i-radius);j<=Math.min(values.length-1,i+radius);j++){s+=values[j];n++}
    out[i]=s/n
  }
  return out
}

function rangesFromDensity(raw,minWidthRatio=.08){
  const density=smooth(raw,4),n=density.length
  let max=0;for(const v of density)if(v>max)max=v
  const threshold=Math.max(.006,max*.055)
  const ranges=[];let start=-1
  for(let i=0;i<n;i++){
    const active=density[i]>threshold
    if(active&&start<0)start=i
    if((!active||i===n-1)&&start>=0){
      const end=active&&i===n-1?i:i-1
      if(end-start+1>=n*minWidthRatio)ranges.push([start,end])
      start=-1
    }
  }
  // Merge ranges separated by tiny gaps: labels and body often create nearby islands.
  const merged=[]
  for(const r of ranges){
    const prev=merged[merged.length-1]
    if(prev&&r[0]-prev[1]<n*.018)prev[1]=r[1]
    else merged.push([...r])
  }
  return merged
}

function cropRect(img,rect,padRatio=.018){
  const pad=Math.round(Math.max(img.width,img.height)*padRatio)
  const x=Math.max(0,Math.floor(rect.x-pad)),y=Math.max(0,Math.floor(rect.y-pad))
  const w=Math.min(img.width-x,Math.ceil(rect.w+pad*2)),h=Math.min(img.height-y,Math.ceil(rect.h+pad*2))
  const c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h)
  c.getContext('2d').drawImage(img,x,y,w,h,0,0,w,h)
  return c
}

function canvasToBlob(canvas){return new Promise(resolve=>canvas.toBlob(resolve,'image/png'))}

async function canvasesToFiles(canvases,baseName){
  const files=[]
  for(let i=0;i<canvases.length;i++){
    const blob=await canvasToBlob(canvases[i])
    if(blob)files.push(new File([blob],`${baseName}-${i+1}.png`,{type:'image/png'}))
  }
  return files
}

function fixedRects(img,layout){
  const W=img.width,H=img.height
  if(layout==='horizontal-3')return Array.from({length:3},(_,i)=>({x:i*W/3,y:0,w:W/3,h:H}))
  if(layout==='horizontal-4')return Array.from({length:4},(_,i)=>({x:i*W/4,y:0,w:W/4,h:H}))
  if(layout==='vertical-3')return Array.from({length:3},(_,i)=>({x:0,y:i*H/3,w:W,h:H/3}))
  if(layout==='vertical-4')return Array.from({length:4},(_,i)=>({x:0,y:i*H/4,w:W,h:H/4}))
  if(layout==='grid-2x2')return [{x:0,y:0,w:W/2,h:H/2},{x:W/2,y:0,w:W/2,h:H/2},{x:0,y:H/2,w:W/2,h:H/2},{x:W/2,y:H/2,w:W/2,h:H/2}]
  return []
}

export async function captureCharacterSheet(file,{layout='auto'}={}){
  if(!file?.type?.startsWith('image/'))throw new Error('Use PNG, JPG ou WebP.')
  const sourceUrl=await fileToDataUrl(file),img=await imageFromUrl(sourceUrl)
  let rects=[],detectedLayout=layout
  if(layout!=='auto'){
    rects=fixedRects(img,layout)
  }else{
    const dx=buildDensity(img,'x'),xr=rangesFromDensity(dx.density,.07)
    if(xr.length>=3&&xr.length<=6){
      rects=xr.slice(0,4).map(([a,b])=>({x:a/dx.scale,y:0,w:(b-a+1)/dx.scale,h:img.height}))
      detectedLayout=`auto-horizontal-${rects.length}`
    }else{
      const dy=buildDensity(img,'y'),yr=rangesFromDensity(dy.density,.07)
      if(yr.length>=3&&yr.length<=6){
        rects=yr.slice(0,4).map(([a,b])=>({x:0,y:a/dy.scale,w:img.width,h:(b-a+1)/dy.scale}))
        detectedLayout=`auto-vertical-${rects.length}`
      }else{
        // Conservative fallback for common turnaround sheets.
        rects=fixedRects(img,img.width>=img.height?'horizontal-4':'grid-2x2')
        detectedLayout=img.width>=img.height?'fallback-horizontal-4':'fallback-grid-2x2'
      }
    }
  }
  const canvases=rects.slice(0,4).map(r=>cropRect(img,r))
  const base=(file.name||'sheet').replace(/\.[^.]+$/,'')
  const files=await canvasesToFiles(canvases,base)
  const previews=[]
  for(const f of files)previews.push(await fileToDataUrl(f))
  return {sourceUrl,files,previews,rects:rects.slice(0,files.length),layout:detectedLayout,width:img.width,height:img.height}
}
