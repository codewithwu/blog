// 顶部固定导航：6 个 NavLink，当前路由高亮
import { NavLink, Link } from 'react-router-dom';

const links = [
  { to: '/articles', label: '文章' },
  { to: '/projects', label: '项目' },
  { to: '/skills',   label: '技能' },
  { to: '/tools',    label: '工具' },
  { to: '/about',    label: '关于' }
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-brand-dark/90 backdrop-blur border-b border-brand-mid/20">
      <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/articles" className="text-xl font-semibold text-brand-orange tracking-wide">
          cooper.dev
        </Link>
        <ul className="flex gap-1 sm:gap-2">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'text-brand-orange bg-brand-orange/10'
                      : 'text-brand-light/80 hover:text-brand-orange hover:bg-brand-mid/10'
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
