import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In local development, serve POST /api/rpc from server/rpc.ts so the whole
// app runs with `npm run dev` (no Vercel CLI needed).
function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/rpc', async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const { handleRpc } = await server.ssrLoadModule('/server/rpc.ts');
        const out = await handleRpc({
          method: req.method ?? 'GET',
          headers: req.headers,
          body: Buffer.concat(chunks).toString('utf8'),
          ip: req.socket.remoteAddress ?? '',
        });
        for (const [k, v] of Object.entries(out.headers)) res.setHeader(k, v as string);
        res.statusCode = out.status;
        res.end(JSON.stringify(out.body));
      });
      // Photos: same handlers as api/photo.ts and api/photo-upload.ts. Without
      // Blob credentials in .env.local, files go to ./.local-blobs.
      server.middlewares.use('/api/photo-upload', async (req, res) => {
        const a = await server.ssrLoadModule('/server/node-adapter.ts');
        const { handleUpload } = await server.ssrLoadModule('/server/photos.ts');
        a.send(res, await handleUpload(a.toPhotoRequest(req, await a.readBody(req))));
      });
      server.middlewares.use('/api/photo', async (req, res) => {
        const a = await server.ssrLoadModule('/server/node-adapter.ts');
        const { handlePhoto } = await server.ssrLoadModule('/server/photos.ts');
        // connect strips the mount path; put it back so the query is parsed.
        req.url = '/api/photo' + (req.url ?? '');
        a.send(res, await handlePhoto(a.toPhotoRequest(req)));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Make DATABASE_URL etc. from .env.local available to the dev API.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return {
    plugins: [react(), tailwindcss(), devApi()],
    server: { host: true },
  };
});
