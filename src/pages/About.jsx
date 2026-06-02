// 关于页：头像 + 简介 + 联系方式 + 时间轴 + 座右铭
import { Github, Mail } from 'lucide-react';
import TimelineItem from '../components/TimelineItem.jsx';

const timeline = [
  { year: '2024 – 今',  title: '高级前端工程师', subtitle: '某科技公司',  desc: '负责内部 SaaS 平台架构与性能优化。' },
  { year: '2021 – 2024', title: '前端工程师',     subtitle: '某创业公司',  desc: '从 0 到 1 搭建 B 端产品。' },
  { year: '2017 – 2021', title: '计算机科学学士', subtitle: '某大学',      desc: '主修软件工程。' }
];

export default function About() {
  return (
    <section className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand-orange to-brand-blue
                        flex items-center justify-center text-3xl font-bold text-brand-light">
          C
        </div>
        <div>
          <h1 className="text-3xl font-bold text-brand-light">Cooper</h1>
          <p className="mt-1 text-brand-orange">前端工程师 / 终身学习者</p>
          <p className="mt-4 text-brand-light/80 leading-relaxed">
            喜欢写干净的代码，热爱开源。业余时间折腾个人项目、写博客、跑马拉松。
          </p>
          <div className="mt-4 flex gap-3">
            <a href="https://github.com/cooper" target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-1 text-sm text-brand-blue hover:text-brand-orange">
              <Github size={16} /> GitHub
            </a>
            <a href="mailto:hi@cooper.dev"
               className="inline-flex items-center gap-1 text-sm text-brand-blue hover:text-brand-orange">
              <Mail size={16} /> 邮箱
            </a>
          </div>
        </div>
      </div>

      <h2 className="mt-12 text-2xl font-semibold text-brand-light">经历</h2>
      <ul className="mt-6">
        {timeline.map((t) => (
          <TimelineItem key={t.year} {...t} />
        ))}
      </ul>

      <blockquote className="mt-12 p-6 rounded-xl border-l-4 border-brand-orange bg-brand-surface
                             text-brand-light/80 italic">
        "Stay hungry, stay foolish."
      </blockquote>
    </section>
  );
}
