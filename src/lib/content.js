// content 解析器：把 content/*.md 文本解析为页面所需的数据结构
// 不引入 gray-matter 等依赖，纯字符串处理
//
// 文件约定：
//   ## category              → 一个分组
//   - name: level            → 技能（level ∈ {进阶, 熟练, 精通}，未知回退 进阶）
//   - name (icon): desc      → 工具（icon 与 desc 各自可选）
//   # / 空行 / 其他          → 忽略

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

export function parseTools(md) {
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
      // 拆分 name/icon 与 desc：以第一个 ':' 切
      const colonIdx = body.indexOf(':');
      let namePart, desc;
      if (colonIdx === -1) {
        namePart = body;
        desc = '';
      } else {
        namePart = body.slice(0, colonIdx).trim();
        desc = body.slice(colonIdx + 1).trim();
      }

      // 提取 name 末尾括号里的 icon
      const m = namePart.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      const item = {};
      if (m) {
        item.name = m[1].trim();
        item.icon = m[2].trim();
      } else {
        item.name = namePart;
      }
      if (desc) item.desc = desc;
      if (item.name) current.items.push(item);
    }
  }

  return groups;
}

export function parseAbout(md) {
  const empty = { tagline: '', intro: '', contacts: [], timeline: [], motto: '' };
  if (!md) return empty;

  // 按 ## 切分章节，未带 ## 的内容归到 __preamble
  const sections = { __preamble: [] };
  let current = '__preamble';
  for (const line of md.split('\n')) {
    if (line.startsWith('## ')) {
      current = line.slice(3).trim();
      sections[current] = sections[current] || [];
    } else {
      sections[current].push(line);
    }
  }

  // Preamble：第一非空行 = tagline，其余 = intro
  const preambleText = sections.__preamble.join('\n').trim();
  const preambleLines = preambleText.split('\n').map(l => l.trim()).filter(Boolean);
  const tagline = preambleLines[0] || '';
  const intro = preambleLines.slice(1).join('\n').trim();

  // 联系方式
  const contacts = [];
  for (const raw of sections['联系方式'] || []) {
    const line = raw.trim();
    if (!line.startsWith('- ')) continue;
    const body = line.slice(2);
    const colonIdx = body.indexOf(':');
    if (colonIdx === -1) continue;
    const label = body.slice(0, colonIdx).trim();
    const href = body.slice(colonIdx + 1).trim();
    let icon = null;
    if (label === 'GitHub') icon = 'Github';
    else if (label === '邮箱') icon = 'Mail';
    contacts.push({ label, href, icon });
  }

  // 经历（时间轴）
  const timeline = [];
  const expLines = sections['经历'] || [];
  let i = 0;
  while (i < expLines.length) {
    const line = expLines[i];
    const m = line.match(/^-\s+\*\*(.+?)\*\*\s+(.+?)\s+@\s+(.+?)\s*$/);
    if (m) {
      const [, year, title, subtitle] = m;
      // 紧跟其后的缩进非 '-' 行视为 desc
      const descLines = [];
      let j = i + 1;
      while (j < expLines.length) {
        const next = expLines[j];
        if (next.match(/^\s+\S/) && !next.match(/^-\s/)) {
          descLines.push(next.trim());
          j++;
        } else {
          break;
        }
      }
      timeline.push({ year, title, subtitle, desc: descLines.join('\n').trim() });
      i = j;
    } else {
      i++;
    }
  }

  // 座右铭
  const motto = (sections['座右铭'] || [])
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => l.replace(/^>\s*/, ''))
    .join(' ')
    .trim();

  return { tagline, intro, contacts, timeline, motto };
}
