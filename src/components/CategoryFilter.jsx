// 文章分类筛选 chip 栏：显示「全部」+ 所有有文章的分类，当前激活的实心高亮 + aria-current
import { NavLink, Link } from 'react-router-dom';

export default function CategoryFilter({ categories, active }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <NavLink
        to="/articles"
        end
        aria-current={active === null ? 'page' : undefined}
        className={({ isActive }) =>
          `px-3 py-1.5 rounded-full text-sm transition-colors ${
            isActive
              ? 'bg-brand-orange text-white'
              : 'border border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10'
          }`
        }
      >
        全部
      </NavLink>
      {categories.map((c) => {
        const isActive = active === c.slug;
        return (
          <Link
            key={c.slug}
            to={`/articles/category/${c.slug}`}
            aria-current={isActive ? 'page' : undefined}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              isActive
                ? 'bg-brand-orange text-white'
                : 'border border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10'
            }`}
          >
            {c.slug} <span className="opacity-70">({c.count})</span>
          </Link>
        );
      })}
    </div>
  );
}
