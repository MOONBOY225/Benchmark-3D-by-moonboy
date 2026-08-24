import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages uses the repository subpath; Capacitor packages assets locally.
  base: process.env.VITE_BASE || '/Benchmark-3D-by-moonboy/',
  plugins: [react()],
})
