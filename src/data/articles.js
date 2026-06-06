// 文章数据：metadata 写在数组里，content 通过 Vite ?raw 导入 markdown 源文件
import helloWorld from '../../articles/notes/你好，世界.md?raw';
import ragFenCengJianSuo from '../../articles/ai/RAG分层检索.md?raw';
import openClawVsHermars from '../../articles/ai/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md?raw';
import agentXingNengLiangHua from '../../articles/ai/Agent 性能量化.md?raw';
import claudeCodeShangXiaWenGuanLi from '../../articles/ai/Claude-Code-上下文管理.md?raw';
import deepSeekJiangBenZengXiao from '../../articles/ai/DeepSeek 的“降本增效”之道.md?raw';
import changDuiHuaZhongMoXingWangJiXiTongZhiLing from '../../articles/ai/长对话中模型忘记系统指令.md?raw';
import aiJiShuDiCeng from '../../articles/ai/AI技术底层.md?raw';

const articles = [
  {
    slug: 'hello-world',
    title: '你好，世界',
    excerpt: '博客开篇语。',
    date: '2026-05-12',
    tags: ['随笔', 'Meta'],
    cover: null,
    content: helloWorld,
    category: 'notes'
  },
  {
    slug: 'RAG分层检索',
    title: 'RAG分层检索',
    excerpt: '在RAG（Retrieval-Augmented Generation）系统中，检索策略的设计直接影响最终生成效果。核心目标只有两个',
    date: '2026-06-03',
    tags: ['RAG', '检索'],
    cover: null,
    content: ragFenCengJianSuo,
    category: 'ai'
  },
  {
    slug: 'OpenClaw（龙虾）与Hermars（爱马仕）使用体验',
    title: 'OpenClaw（龙虾）与 Hermars（爱马仕）对比学习笔记',
    excerpt: '对比 OpenClaw 与 Hermars 两款智能体在记忆机制、多智能体稳定性、主动性与技能沉淀、交互细节四个维度上的差异。',
    date: '2026-06-03',
    tags: ['智能体', '对比', '工具'],
    cover: null,
    content: openClawVsHermars,
    category: 'ai'
  },
  {
    slug: 'Agent 性能量化',
    title: 'Agent 性能量化',
    excerpt: '量化 Agent 的性能，不能只看任务是否成功。需从结果、过程、系统三个维度，结合自动化评测方法与工程落地的坑全面评估。',
    date: '2026-06-03',
    tags: ['Agent', '评测'],
    cover: null,
    content: agentXingNengLiangHua,
    category: 'ai'
  },
  {
    slug: 'Claude-Code-上下文管理',
    title: 'Claude Code 上下文管理',
    excerpt: '上下文不是被动容器，而是最昂贵的战略资源，需要主动调度与防守。',
    date: '2026-06-03',
    tags: ['Claude Code', '上下文', '工程'],
    cover: null,
    content: claudeCodeShangXiaWenGuanLi,
    category: 'ai'
  },
  {
    slug: 'DeepSeek 的“降本增效”之道',
    title: 'DeepSeek 的“降本增效”之道',
    excerpt: '不是靠无限堆显卡，而是靠分工协作。MOE 架构用 256 个专家替代稠密模型，按需只激活 8 个，用空间换时间，实现更快推理 + 更低成本。',
    date: '2026-06-03',
    tags: ['DeepSeek', 'MOE', '大模型'],
    cover: null,
    content: deepSeekJiangBenZengXiao,
    category: 'ai'
  },
  {
    slug: '长对话中模型忘记系统指令',
    title: '长对话中模型忘记系统指令',
    excerpt: '在长对话中，模型可能忘记最早设定的系统指令（如“只能用中文回答”）。',
    date: '2026-06-03',
    tags: ['LLM', '系统指令', '上下文'],
    cover: null,
    content: changDuiHuaZhongMoXingWangJiXiTongZhiLing,
    category: 'ai'
  },
  {
    slug: 'AI技术底层',
    title: 'AI技术底层',
    excerpt: '从 LM/Token 到 Context/RAG，再到 Prompt、Tool/MCP 与 Agent/Skill，一文梳理 AI 技术的四层底层逻辑。',
    date: '2026-06-06',
    tags: ['LLM', 'Token', '智能体'],
    cover: null,
    content: aiJiShuDiCeng,
    category: 'ai'
  }
];

export default articles;
