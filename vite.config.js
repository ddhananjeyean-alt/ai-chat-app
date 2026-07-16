import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { join } from 'path'

// A Vite plugin to emulate Vercel serverless functions in api/
function vercelApiPlugin() {
  return {
    name: 'vercel-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const apiPath = url.pathname;
          
          // Construct the local serverless handler file path
          const filePath = join(process.cwd(), apiPath + '.js');
          
          try {
            // Import the serverless module dynamically with cache busting
            const modulePath = filePath.replace(/\\/g, '/');
            const handlerModule = await import(`file://${modulePath}?t=${Date.now()}`);
            
            // Parse POST/PUT request bodies
            let body = {};
            if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
              const buffers = [];
              for await (const chunk of req) {
                buffers.push(chunk);
              }
              const data = Buffer.concat(buffers).toString();
              if (data) {
                try {
                  body = JSON.parse(data);
                } catch (e) {
                  body = data;
                }
              }
            }
            
            // Mock Vercel req/res helpers
            const mockReq = req;
            mockReq.body = body;
            mockReq.query = Object.fromEntries(url.searchParams);
            
            const mockRes = res;
            mockRes.status = (code) => {
              res.statusCode = code;
              return mockRes;
            };
            mockRes.json = (jsonBody) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(jsonBody));
              return mockRes;
            };
            
            await handlerModule.default(mockReq, mockRes);
          } catch (err) {
            console.error('Error running local API route:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal Server Error', details: err.message }));
          }
        } else {
          next();
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables into process.env for Node compatibility in api endpoints
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), vercelApiPlugin()],
  };
});
