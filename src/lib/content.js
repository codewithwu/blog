// content 解析器：把 content/*.md 文本解析为页面所需的数据结构
// 不引入 gray-matter 等依赖，纯字符串处理
//
// 文件约定：
//   ## category    → 一个分组
//   - name: level  → 一条技能（level ∈ {进阶, 熟练, 精通}，未知回退 进阶）
//   # / 空行 / 其他 → 忽略

const SKILL_LEVELS = ['进阶', '熟练', '精通'];

function normalizeLevel(raw) {
  return SKILL_LEVELS.includes(raw) ? raw : '进阶';
}

export function parseSkills(md) {
  if (!md) return [];
  const groups = [];
  let current = null;

  for (const rawLine of md.split('\n')) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    if (line.startsWith('## ')) {
      const category = line.slice(3).trim();
      current = { category, items: [] };
      groups.push(current);
      continue;
    }

    if (line.startsWith('- ') && current) {
      const body = line.slice(2).trim();
      const colonIdx = body.indexOf(':');
      if (colonIdx === -1) continue;
      const name = body.slice(0, colonIdx).trim();
      const level = normalizeLevel(body.slice(colonIdx + 1).trim());
      if (name) current.items.push({ name, level });
    }
  }

  return groups;
}

export function parseTools(_md) {
  throw new Error('parseTools not implemented');
}

export function parseAbout(_md) {
  throw new Error('parseAbout not implemented');
}
