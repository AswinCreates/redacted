import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// MoveForward client dev server.
// host: true  -> listen on all interfaces (IPv4 + IPv6) so `localhost`,
//                127.0.0.1 and other devices on the LAN can all reach the app.
// strictPort  -> never silently move off 5173, which is the origin the
//                backend allows via CLIENT_URL (CORS).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});