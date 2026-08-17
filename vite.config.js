import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    root: '.', // Ensure root is set correctly
    publicDir: 'client/public', // Serve card images from client/public
    server: {
        port: 3000,
        hmr: true,
        proxy: {
            '/socket.io': {
                target: 'http://localhost:3005',
                ws: true,
                changeOrigin: true
            }
        }
    },
});
