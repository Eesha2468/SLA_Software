import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const parts = id.toString().split('node_modules/');
            const name = parts[parts.length - 1].split('/')[0];
            // Group all ant design related packages together to prevent circular links
            if (
              name.includes('antd') || 
              name.startsWith('@ant-design') || 
              name.startsWith('rc-') || 
              name.startsWith('@rc-component')
            ) {
              return 'antd-framework';
            }
            // Group React core together
            if (name === 'react' || name === 'react-dom' || name === 'scheduler' || name.startsWith('@remix-run')) {
              return 'react-framework';
            }
            // Keep other packages (html2canvas, dayjs, etc.) separate
            return name;
          }
        }
      }
    }
  }
})
