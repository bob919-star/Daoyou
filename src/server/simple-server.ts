/**
 * 简化版服务器 - 使用内存存储，无需 PostgreSQL 和 Redis
 * 运行命令: bun run dev (端口 3000)
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';

// 简单的内存数据库
interface Player {
  id: string;
  name: string;
  level: number;
  exp: number;
  qi: number; // 气
  maxQi: number;
  body: number; // 体魄
  spirit: number; // 神识
  destiny: number; // 命魂
  lifespan: number;
  maxLifespan: number;
  gold: number;
  inventory: InventoryItem[];
  techniques: string[];
  statusEffects: StatusEffect[];
  createdAt: number;
}

interface InventoryItem {
  id: string;
  name: string;
  type: 'material' | 'pill' | 'artifact' | 'technique';
  quantity: number;
  quality?: number;
}

interface StatusEffect {
  id: string;
  name: string;
  description: string;
  turnsRemaining: number;
}

// 内存存储
const players = new Map<string, Player>();
const nextPlayerId = { value: 1 };

// 创建新玩家
function createPlayer(name: string): Player {
  const id = `player_${nextPlayerId.value++}`;
  const player: Player = {
    id,
    name,
    level: 1,
    exp: 0,
    qi: 100,
    maxQi: 100,
    body: 10,
    spirit: 10,
    destiny: 10,
    lifespan: 100,
    maxLifespan: 100,
    gold: 1000,
    inventory: [
      { id: 'item_1', name: '灵气草', type: 'material', quantity: 5 },
      { id: 'item_2', name: '筑基丹', type: 'pill', quantity: 1, quality: 3 },
    ],
    techniques: ['基础呼吸法'],
    statusEffects: [],
    createdAt: Date.now(),
  };
  players.set(id, player);
  return player;
}

// 获取或创建默认玩家
function getOrCreateDefaultPlayer(): Player {
  const defaultId = 'player_1';
  if (!players.has(defaultId)) {
    return createPlayer('默认修士');
  }
  return players.get(defaultId)!;
}

// 创建 Hono 应用
const app = new Hono();

// 中间件
app.use('*', logger());

// ===== 根路由 =====
app.get('/api', (c) => {
  return c.json({
    success: true,
    message: '道途游戏服务器 (简化版)',
    version: '1.0.0',
    features: ['玩家管理', '背包系统', '修为系统'],
  });
});

// ===== 健康检查 =====
app.get('/api/health-check', (c) => {
  return c.json({
    success: true,
    message: 'OK',
    storage: 'memory',
    playerCount: players.size,
  });
});

// ===== 认证相关 (简化版 - 模拟) =====

// 获取 session - 简化版总是返回已登录
app.get('/api/auth/get-session', (c) => {
  return c.json({
    data: {
      session: {
        id: 'mock-session-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: 'user_1',
          name: '默认修士',
          email: 'player@daoyou.local',
          emailVerified: true,
        },
      },
    },
  });
});

// 登录相关 - 简化版直接成功
app.post('/api/auth/sign-in/email', async (c) => {
  const body = await c.req.json();
  return c.json({
    data: {
      session: {
        id: 'mock-session-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: 'user_1',
          name: body?.email?.split('@')[0] || '修士',
          email: body?.email || 'player@daoyou.local',
          emailVerified: true,
        },
      },
    },
  });
});

// 注册相关 - 简化版直接成功
app.post('/api/auth/sign-up/email', async (c) => {
  const body = await c.req.json();
  return c.json({
    data: {
      session: {
        id: 'mock-session-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: 'user_1',
          name: body?.name || '新修士',
          email: body?.email || 'player@daoyou.local',
          emailVerified: true,
        },
      },
    },
  });
});

// 登出 - 简化版直接成功
app.post('/api/auth/sign-out', (c) => {
  return c.json({ data: {} });
});

// 发送验证码 - 简化版直接成功
app.post('/api/auth/verification-email/send', (c) => {
  return c.json({ data: {} });
});

// 邮箱验证码登录 - 简化版直接成功
app.post('/api/auth/sign-in/email-otp', (c) => {
  return c.json({
    data: {
      session: {
        id: 'mock-session-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: 'user_1',
          name: '修士',
          email: 'player@daoyou.local',
          emailVerified: true,
        },
      },
    },
  });
});

// ===== 玩家相关 API =====

// 获取玩家信息
app.get('/api/player', (c) => {
  const player = getOrCreateDefaultPlayer();
  return c.json({
    success: true,
    data: player,
  });
});

// 创建新玩家
app.post('/api/player', async (c) => {
  const body = await c.req.json();
  const name = body?.name || `修士_${Date.now()}`;
  const player = createPlayer(name);
  return c.json({
    success: true,
    data: player,
  }, 201);
});

// 更新玩家信息
app.patch('/api/player', async (c) => {
  const player = getOrCreateDefaultPlayer();
  const updates = await c.req.json();

  // 只允许更新特定字段
  const allowedUpdates = ['name', 'level', 'exp', 'qi', 'maxQi', 'body', 'spirit', 'destiny', 'lifespan', 'maxLifespan', 'gold'];
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      (player as any)[key] = updates[key];
    }
  }

  return c.json({
    success: true,
    data: player,
  });
});

// ===== 背包相关 API =====

// 获取背包
app.get('/api/player/inventory', (c) => {
  const player = getOrCreateDefaultPlayer();
  return c.json({
    success: true,
    data: player.inventory,
  });
});

// 添加物品到背包
app.post('/api/player/inventory', async (c) => {
  const player = getOrCreateDefaultPlayer();
  const item = await c.req.json();

  // 检查是否已存在同类物品
  const existingItem = player.inventory.find((i) => i.name === item.name && i.type === item.type);
  if (existingItem) {
    existingItem.quantity += item.quantity || 1;
  } else {
    player.inventory.push({
      id: `item_${Date.now()}`,
      name: item.name,
      type: item.type || 'material',
      quantity: item.quantity || 1,
      quality: item.quality,
    });
  }

  return c.json({
    success: true,
    data: player.inventory,
  });
});

// 删除背包物品
app.delete('/api/player/inventory/:itemId', (c) => {
  const player = getOrCreateDefaultPlayer();
  const itemId = c.req.param('itemId');

  const index = player.inventory.findIndex((i) => i.id === itemId);
  if (index !== -1) {
    player.inventory.splice(index, 1);
  }

  return c.json({
    success: true,
    data: player.inventory,
  });
});

// ===== 修炼相关 API =====

// 模拟修炼
app.post('/api/cultivator/meditate', async (c) => {
  const player = getOrCreateDefaultPlayer();
  const body = await c.req.json();
  const duration = body?.duration || 1; // 默认修炼1次

  // 简单的修炼收益计算
  const expGain = Math.floor(10 * duration * (1 + player.spirit * 0.1));
  const qiGain = Math.floor(5 * duration * (1 + player.body * 0.05));

  player.exp += expGain;
  player.qi = Math.min(player.maxQi, player.qi + qiGain);

  // 检查是否升级
  const expForNextLevel = player.level * 100;
  if (player.exp >= expForNextLevel) {
    player.level += 1;
    player.exp -= expForNextLevel;
    player.maxQi += 10;
    player.qi = player.maxQi;
  }

  return c.json({
    success: true,
    data: {
      expGain,
      qiGain,
      currentExp: player.exp,
      currentLevel: player.level,
      currentQi: player.qi,
    },
  });
});

// 获取修为信息
app.get('/api/cultivator', (c) => {
  const player = getOrCreateDefaultPlayer();
  return c.json({
    success: true,
    data: {
      level: player.level,
      exp: player.exp,
      expForNextLevel: player.level * 100,
      qi: player.qi,
      maxQi: player.maxQi,
      body: player.body,
      spirit: player.spirit,
      destiny: player.destiny,
      lifespan: player.lifespan,
      maxLifespan: player.maxLifespan,
      techniques: player.techniques,
      statusEffects: player.statusEffects,
    },
  });
});

// ===== 任务相关 API =====

// 获取任务列表
app.get('/api/tasks', (c) => {
  const tasks = [
    { id: 'task_1', name: '日常修炼', description: '完成一次修炼', reward: { exp: 50, gold: 10 }, completed: false },
    { id: 'task_2', name: '收集材料', description: '收集5个灵气草', reward: { exp: 100, gold: 50 }, completed: false },
    { id: 'task_3', name: '突破境界', description: '尝试突破到下一境界', reward: { exp: 500, gold: 200 }, completed: false },
  ];
  return c.json({
    success: true,
    data: tasks,
  });
});

// ===== 市场相关 API =====

// 获取市场数据
app.get('/api/market', (c) => {
  const items = [
    { id: 'market_1', name: '灵气草', price: 10, type: 'material' },
    { id: 'market_2', name: '筑基丹', price: 100, type: 'pill' },
    { id: 'market_3', name: '聚灵阵图', price: 500, type: 'artifact' },
  ];
  return c.json({
    success: true,
    data: items,
  });
});

// ===== 地图相关 API =====

// 获取地图节点
app.get('/api/dungeon', (c) => {
  const nodes = [
    { id: 'node_1', name: '灵气洞穴', level: 1, status: 'available' },
    { id: 'node_2', name: '妖兽森林', level: 3, status: 'available' },
    { id: 'node_3', name: '古修遗迹', level: 5, status: 'locked' },
  ];
  return c.json({
    success: true,
    data: nodes,
  });
});

// 排行榜（模拟数据）
app.get('/api/rankings', (c) => {
  const rankings = [
    { rank: 1, name: '天道宗掌门', level: 50, power: 99999 },
    { rank: 2, name: '逍遥派宗主', level: 48, power: 95000 },
    { rank: 3, name: '剑阁阁主', level: 45, power: 88000 },
    { rank: 4, name: '默认修士', level: getOrCreateDefaultPlayer().level, power: getOrCreateDefaultPlayer().body * 100 },
  ];
  return c.json({
    success: true,
    data: rankings,
  });
});

// ===== 公告相关 =====
app.get('/api/community/announcement', (c) => {
  return c.json({
    success: true,
    announcement: '欢迎来到道途！这是一个简化版的演示服务器。',
  });
});

// 导出 app
export default app;
