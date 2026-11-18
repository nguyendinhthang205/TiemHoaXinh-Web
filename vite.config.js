import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Thêm dòng này để mở cổng cho mạng LAN / điện thoại
    open: true
  }
});