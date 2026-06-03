// 关于页：内容源 content/关于.md，运行时通过 parseAbout 解析
// 修改内容请改 content/关于.md
import { Github, Mail } from 'lucide-react';
import TimelineItem from '../components/TimelineItem.jsx';
import usePageTitle from '../hooks/usePageTitle.js';
import aboutMd from '../../content/关于.md?raw';
import { parseAbout } from '../lib/content.js';

const { tagline, intro, contacts, timeline, motto } = parseAbout(aboutMd);

// 联系方式图标映射：解析出的 icon 字符串（'Github' / 'Mail' / null）→ 实际组件
const ICON_MAP = { Github, Mail };

export default function About() {
  usePageTitle('关于');
  return (
    <section className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand-orange to-brand-blue
                        flex items-center justify-center text-2xl font-bold text-brand-light">
          极客
        </div>
        <div>
          <h1 className="text-3xl font-bold text-brand-light">极客熊猫</h1>
          {tagline && <p className="mt-1 text-brand-orange">{tagline}</p>}
          {intro   && <p className="mt-4 text-brand-light/80 leading-relaxed">{intro}</p>}
          {contacts.length > 0 && (
            <div className="mt-4 flex gap-3 flex-wrap">
              {contacts.map((c) => {
                const Icon = ICON_MAP[c.icon];
                return (
                  <a key={c.label} href={c.href}
                     target={c.href.startsWith('http') ? '_blank' : undefined}
                     rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
                     className="inline-flex items-center gap-1 text-sm text-brand-blue hover:text-brand-orange">
                    {Icon && <Icon size={16} />} {c.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {timeline.length > 0 && (
        <>
          <h2 className="mt-12 text-2xl font-semibold text-brand-light">经历</h2>
          <ul className="mt-6">
            {timeline.map((t) => (
              <TimelineItem key={t.year} {...t} />
            ))}
          </ul>
        </>
      )}

      {motto && (
        <blockquote className="mt-12 p-6 rounded-xl border-l-4 border-brand-orange bg-brand-surface
                               text-brand-light/80 italic">
          {motto}
        </blockquote>
      )}
    </section>
  );
}
