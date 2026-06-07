/**
 * 简化版前端环境配置
 * API 指向本地服务器
 */

const clientImportMetaEnv = import.meta.env as Record<string, string | undefined>;

function getOptionalEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = clientImportMetaEnv[name];
    if (value) {
      return value;
    }
  }

  return undefined;
}

// 本地开发环境配置
const isLocalDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const clientEnv = {
  // Turnstile 站点密钥（本简化版本不需要）
  turnstileSiteKey: undefined,
  // 本地开发标志
  isLocalDev,
  // API 基础地址 - 本地开发时指向同端口服务器
  apiBase: isLocalDev ? '' : getOptionalEnv('VITE_API_BASE'),
};
