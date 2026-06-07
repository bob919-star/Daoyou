/**
 * 简化版入口文件 - 使用内存存储，无需外部依赖
 * 使用 simple-server.ts 替代完整的 PostgreSQL + Redis 服务器
 */

import { readFile } from 'node:fs/promises';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import simpleApp from './server/simple-server';

const indexHtmlUrl = new URL('../dist/index.html', import.meta.url);
const fileRequestPattern = /\/[^/?]+\.[^/]+$/;

let indexHtmlPromise: Promise<string> | undefined;

const getIndexHtml = () => {
  indexHtmlPromise ??= readFile(indexHtmlUrl, 'utf8');
  return indexHtmlPromise;
};

const isStaticFileRequest = (path: string) =>
  path.startsWith('/assets/') || fileRequestPattern.test(path);

type RootAppOptions = {
  enableLogger?: boolean;
  isProd?: boolean;
  loadIndexHtml?: () => Promise<string>;
};

export function createRootApp(options: RootAppOptions = {}) {
  const {
    enableLogger = true,
    isProd = import.meta.env.PROD,
    loadIndexHtml = getIndexHtml,
  } = options;
  const app = new Hono();

  if (enableLogger) {
    app.use('/api/*', logger());
  }

  // 使用简化版服务器
  app.route('/', simpleApp);

  // 处理前端路由 - 返回 index.html
  app.notFound(async (c) => {
    if (c.req.path.startsWith('/api')) {
      return Response.json(
        {
          success: false,
          error: 'Not Found',
        },
        { status: 404 },
      );
    }

    const isPageRequest = c.req.method === 'GET' || c.req.method === 'HEAD';
    if (!isProd || !isPageRequest || isStaticFileRequest(c.req.path)) {
      return new Response('Not Found', { status: 404 });
    }

    return c.html(await loadIndexHtml(), 200, {
      'Cache-Control': 'no-cache',
    });
  });

  return app;
}

const app = createRootApp();

export default app;
