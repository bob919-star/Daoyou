#!/bin/bash
# 简化版启动脚本 - 无需 PostgreSQL、Redis 或外部 API Key
cd "$(dirname "$0")"
bun run dev
