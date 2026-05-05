import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT: change this to your GitHub repo name (e.g. '/kvota-si/' if your repo is github.com/USERNAME/kvota-si)
// If you use a custom domain, set this to '/'
export default defineConfig({
  plugins: [react()],
  base: '/kvota-si/',
});
