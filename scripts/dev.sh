#!/usr/bin/env bash
# dev.sh — 快速启停本博客前端 dev server
#
# 用法：
#   ./scripts/dev.sh start      # 后台启动，端口默认 5173
#   ./scripts/dev.sh stop       # 停止后台进程
#   ./scripts/dev.sh restart    # 重启
#   ./scripts/dev.sh status     # 查看运行状态
#   ./scripts/dev.sh logs       # 跟踪日志（tail -f）
#
# 环境变量：
#   VITE_PORT     端口（默认 5173）
#   BLOG_DIR      项目根目录（默认脚本所在目录的上级）
#
# 状态文件：
#   <BLOG_DIR>/.dev-server.pid   存放后台进程 PID
#   <BLOG_DIR>/.dev-server.log   启动日志（npm/vite 输出）
#
# 注意：脚本只能在 WSL/Linux/macOS 下运行（用了 setsid、kill -0 等 POSIX 工具）。
# Windows 原生 cmd/PowerShell 不支持。

set -euo pipefail

# ---------- 路径与配置 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOG_DIR="${BLOG_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
PID_FILE="$BLOG_DIR/.dev-server.pid"
LOG_FILE="$BLOG_DIR/.dev-server.log"
PORT="${VITE_PORT:-5173}"

# ---------- 颜色（仅在终端输出） ----------
if [[ -t 1 ]]; then
  C_OK="\033[32m"; C_WARN="\033[33m"; C_ERR="\033[31m"; C_OFF="\033[0m"
else
  C_OK=""; C_WARN=""; C_ERR=""; C_OFF=""
fi

ok()   { echo -e "${C_OK}✓${C_OFF} $*"; }
warn() { echo -e "${C_WARN}!${C_OFF} $*"; }
err()  { echo -e "${C_ERR}✗${C_OFF} $*" >&2; }

# ---------- 子命令：start ----------
cmd_start() {
  # 已经在跑就直接返回
  if is_running; then
    warn "已在运行 (PID $(cat "$PID_FILE"), http://localhost:$PORT)"
    return 0
  fi

  # 清理残留 PID 文件
  [[ -f "$PID_FILE" ]] && rm -f "$PID_FILE"

  echo "启动 dev server (port $PORT)..."
  cd "$BLOG_DIR"

  # setsid 创建新会话，让后台进程脱离当前 shell 控制，
  # 这样脚本退出后 dev server 不会被 SIGHUP 杀掉。
  # 用 nohup + disown 双重保险；输出全部重定向到日志文件。
  setsid nohup npm run dev -- --port "$PORT" \
    > "$LOG_FILE" 2>&1 < /dev/null &
  local pid=$!
  echo "$pid" > "$PID_FILE"
  disown "$pid" 2>/dev/null || true

  # 等待端口就绪（最多 30 秒）
  echo -n "等待端口响应"
  for ((i = 1; i <= 30; i++)); do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo
      err "进程已退出，查看日志: $LOG_FILE"
      tail -n 20 "$LOG_FILE" >&2 || true
      rm -f "$PID_FILE"
      return 1
    fi
    if curl -sf "http://localhost:$PORT" > /dev/null 2>&1; then
      echo
      ok "启动成功 (PID $pid, http://localhost:$PORT)"
      echo "  日志: $LOG_FILE"
      echo "  停止: $0 stop"
      return 0
    fi
    echo -n "."
    sleep 1
  done
  echo
  warn "超时 30s 端口未响应；进程仍在后台，可能启动较慢。"
  echo "  状态: $0 status"
  echo "  日志: $LOG_FILE"
  return 0
}

# ---------- 子命令：stop ----------
cmd_stop() {
  if [[ ! -f "$PID_FILE" ]]; then
    warn "未运行（无 PID 文件）"
    return 0
  fi

  local pid
  pid="$(cat "$PID_FILE")"

  if ! kill -0 "$pid" 2>/dev/null; then
    warn "PID $pid 已不存在，清理残留 PID 文件"
    rm -f "$PID_FILE"
    return 0
  fi

  echo "停止 (PID $pid)..."
  # 先 TERM，让 vite/npm 优雅退出
  kill -TERM "$pid" 2>/dev/null || true

  # 等 5 秒
  for ((i = 1; i <= 5; i++)); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 1
  done

  # 还活着就强杀
  if kill -0 "$pid" 2>/dev/null; then
    warn "TERM 无效，改用 KILL"
    kill -KILL "$pid" 2>/dev/null || true
  fi

  # vite 实际监听端口的子进程可能不是 npm，确保端口被释放
  if command -v lsof > /dev/null 2>&1; then
    # 找出占用端口的 PID 并杀掉（如果还存在）
    local leftover
    leftover="$(lsof -ti tcp:"$PORT" 2>/dev/null || true)"
    if [[ -n "$leftover" ]]; then
      kill -KILL $leftover 2>/dev/null || true
    fi
  fi

  rm -f "$PID_FILE"
  ok "已停止"
}

# ---------- 子命令：restart ----------
cmd_restart() {
  cmd_stop || true
  cmd_start
}

# ---------- 子命令：status ----------
cmd_status() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE")"
    if kill -0 "$pid" 2>/dev/null; then
      ok "运行中 (PID $pid, http://localhost:$PORT)"
      echo "  日志: $LOG_FILE"
      return 0
    fi
    warn "PID 文件存在但进程已退出 (PID $pid)"
    return 1
  fi
  warn "未运行"
  return 1
}

# ---------- 子命令：logs ----------
cmd_logs() {
  if [[ ! -f "$LOG_FILE" ]]; then
    warn "日志文件不存在: $LOG_FILE"
    return 1
  fi
  echo "跟踪日志: $LOG_FILE（Ctrl+C 退出）"
  tail -n 50 -f "$LOG_FILE"
}

# ---------- 工具函数 ----------
is_running() {
  [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

# ---------- 入口 ----------
usage() {
  sed -n '3,11p' "$0" | sed 's/^# \?//'
}

cmd="${1:-}"
shift || true

case "$cmd" in
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  restart) cmd_restart ;;
  status)  cmd_status ;;
  logs)    cmd_logs ;;
  -h|--help|help|"")
    usage
    exit 0
    ;;
  *)
    err "未知命令: $cmd"
    usage
    exit 1
    ;;
esac
