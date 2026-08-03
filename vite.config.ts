import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  base: '/ctl-overlay/',
  plugins: [react(), svgr(), tsconfigPaths()],
  server: {
    host: true,
    port: 3000,
  },
})