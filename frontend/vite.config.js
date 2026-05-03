import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts:['stellar-inspiration-production-70cc.up.railway.app'],
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
