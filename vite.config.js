import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/Benchmark-3D-by-moonboy/',
  plugins: [react()],
})
