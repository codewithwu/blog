// projects util 单元测试：listProjects / findProjectBySlug
import { describe, it, expect } from 'vitest';
import { findProjectBySlug, listProjects } from '../src/lib/projects.js';

describe('projects util', () => {
  it('listProjects returns a non-empty array', () => {
    const list = listProjects();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it('findProjectBySlug returns the project when slug matches', () => {
    const project = findProjectBySlug('_sample');
    expect(project).toBeDefined();
    expect(project.slug).toBe('_sample');
    expect(project.content).toContain('项目概览');
  });

  it('findProjectBySlug returns undefined when not found', () => {
    expect(findProjectBySlug('not-a-real-slug')).toBeUndefined();
  });
});
