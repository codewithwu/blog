---
title: 智能体应该一次性把所有工具都给它吗？
date: 2026-06-10
tags: [LangChain, Agent, Tool, 设计模式]
---

# 智能体应该一次性把所有工具都给它吗？

## 背景

用 LangChain（或任何 LLM agent 框架）搭 agent 时，一个绕不开的设计决策是：**该给 agent 提供多少个工具？**

直觉上似乎"工具越多能力越强"，但实际工程中往往会发现——工具塞得越多，效果反而越差。这篇笔记整理一下这个问题的标准答案与常见解法。

## 直接回答

**通常不建议。** 一次性把所有工具都塞给 agent，主要会带来三个问题：

### 1. Context 窗口膨胀

每个 tool 的 schema（`name`、`description`、参数定义）都会作为 system prompt 的一部分注入到 context 中。工具一多，prompt 就容易撞上下文窗口上限，留给真正对话历史的余量就被压缩。

### 2. 选错率上升

LLM 在多个相似工具之间会出现 **Lost in the Middle** 现象——对处于中间位置的工具关注度最低，导致决策准确率下降。LangChain 官方文档在讲 Tool calling 时也提到，工具数量增加会显著拉低选工具的精度。

### 3. 成本与延迟

每次 invoke 都要把全部 schema 重新送进 LLM，工具越多 token 消耗越大、首 token 延迟也越高。

## 解法：按场景动态选工具

实践中有四种常见方案，按复杂度递增排列：

| 方案 | 适用场景 | 核心思路 |
| :--- | :--- | :--- |
| **硬编码相关工具** | 工具数 ≤ 20、能按场景分桶 | 根据任务类型手动或配置化筛选，再注入 agent |
| **路由 Agent（Router）** | 多领域、子任务之间互不重叠 | 一个主 agent 决定调哪个子 agent，每个子 agent 自带小工具集 |
| **RAG-for-Tools** | 工具几十到上百个 | 用 embedding 检索出与当前 query 最相关的 top-k 个工具再注入 |
| **Multi-agent + 职责分离** | 复杂业务流 | 类似 LangGraph 的 supervisor 模式，让多个专门 agent 协作 |

> 注：LangGraph 里的 `supervisor` 模式，本质上就是 Router 思路的工程化实现。

## 经验阈值

工具数量和 agent 准确率不是线性关系——存在一个拐点，超过之后反而变差：

- **5–10 个工具**：差异不大，全部注入也能用
- **超过 20 个**：准确率明显下降，需要做选择
- **上百个**：必须用检索或路由，否则基本不可用

## 一些额外的工程经验

1. **工具描述比工具数量更重要。** 一个描述清晰的工具，比三个描述模糊的同类工具更好用。把 `description` 当 API 文档来写。
2. **优先合并相似工具。** 比如「查天气」「查温度」「查湿度」完全可以合并成一个 `get_weather(city, metric="temp"|"humidity")`。
3. **监控真实选错率。** 上线后用 LangSmith 之类的工具记录 agent 实际选了哪些 tool、调用是否成功，据此动态调整工具集。

## 小结

设计 agent 时应该**先想清楚它的职责边界**，再决定用什么策略提供工具。一上来就堆工具是最容易踩的坑——等到 prompt 撞窗口、或者 agent 频繁调错工具的时候再回头改，成本就高了。

## 参考

- LangChain 官方文档 — [Tools](https://python.langchain.com/docs/concepts/tools/)
- Liu et al., *Lost in the Middle: How Language Models Use Long Contexts*, 2023
