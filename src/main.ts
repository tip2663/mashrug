import { ViteSSG } from 'vite-ssg/single-page'
import './style.css'
import App from './App.vue'

export const createApp = ViteSSG(App)
