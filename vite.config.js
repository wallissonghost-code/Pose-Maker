import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function poseMakerSafetyFixes(){
  return {
    name: 'pose-maker-safety-fixes',
    enforce: 'pre',
    transform(code,id){
      const normalized=id.replace(/\\/g,'/')
      if(!normalized.endsWith('/src/App.jsx')) return null

      const buggy="function CaptureBridge({onReady}){const three=useThree();useEffect(()=>onReady?.(three),[three,onReady]);return null}"
      const fixed="function CaptureBridge({onReady}){const three=useThree();useEffect(()=>{onReady?.(three);return undefined},[three,onReady]);return null}"

      if(!code.includes(buggy)){
        this.warn('CaptureBridge pattern not found; verify App.jsx manually.')
        return null
      }

      return {
        code: code.replace(buggy,fixed),
        map: null,
      }
    },
  }
}

export default defineConfig({
  plugins: [poseMakerSafetyFixes(), react()],
  base: './',
  build: {
    target: 'es2019',
    sourcemap: true,
    cssCodeSplit: true,
  },
})
