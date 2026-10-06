import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/predict_wage': 'http://127.0.0.1:5000',
      '/predict_jobs': 'http://127.0.0.1:5000',
      '/predict_match': 'http://127.0.0.1:5000',
      '/predict_disease': 'http://127.0.0.1:5000',
      '/health': 'http://127.0.0.1:5000',
      '/api': 'http://127.0.0.1:5000',
    }
  }
})
