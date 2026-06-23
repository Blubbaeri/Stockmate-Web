import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-file-upload-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/upload' && req.method === 'POST') {
            const filename = req.headers['x-filename'] as string;
            if (!filename) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing x-filename header' }));
              return;
            }

            const chunks: any[] = [];
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', () => {
              try {
                const buffer = Buffer.concat(chunks);
                const targetDir = path.resolve(__dirname, 'public/uploads');
                
                if (!fs.existsSync(targetDir)) {
                  fs.mkdirSync(targetDir, { recursive: true });
                }

                fs.writeFileSync(path.join(targetDir, filename), buffer);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, filename }));
              } catch (error: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
              }
            });
            return;
          }
          next();
        });
      }
    }
  ],
})
