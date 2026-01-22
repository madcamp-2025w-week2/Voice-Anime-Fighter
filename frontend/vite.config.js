import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    host: true,      // 0.0.0.0 (외부 접속 허용)
    port: 443,       // 443 포트 사용 (HTTPS 기본 포트)
    https: true,     // HTTPS 활성화 (마이크 사용 필수)
    hmr: {
      // 프로덕션 도메인에서 접속 시 HMR 올바르게 작동하도록 설정
      // 또는 false로 설정하여 HMR 비활성화
      host: 'voice-anime-fight.p-e.kr',
      protocol: 'wss',
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/assets': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
