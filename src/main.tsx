import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { NextUIProvider } from '@nextui-org/react'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')!).render(
    <NextUIProvider>
        <Toaster></Toaster>
        <App />
    </NextUIProvider>
)
