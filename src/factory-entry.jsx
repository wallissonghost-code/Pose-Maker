import React from 'react'
import {createRoot} from 'react-dom/client'
import FactoryLauncher from './FactoryLauncher'

const mount=document.createElement('div')
mount.id='posemaker-character-factory-root'
document.body.appendChild(mount)
createRoot(mount).render(<FactoryLauncher />)
