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
