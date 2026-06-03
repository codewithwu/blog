// 项目查找工具：从 data 层封装列表与单条查询
// 不排序：项目无 date 字段，按数组声明顺序展示
import projects from '../data/projects.js';

export function listProjects() {
  return [...projects];
}

export function findProjectBySlug(slug) {
  return projects.find((p) => p.slug === slug);
}
