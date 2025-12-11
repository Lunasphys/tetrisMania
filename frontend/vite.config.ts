import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow access from network
    port: 5173,
    // Proxy disabled - using direct API URL from VITE_API_URL env variable
    // This allows remote clients to connect to the correct backend IP
  },
});

