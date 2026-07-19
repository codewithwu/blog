// 友好的 404 页面
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle.js';

export default function NotFound() {
  usePageTitle('404');
  return (
    <div className="py-24 text-center">
      <h1 className="text-6xl font-bold text-brand-orange">404</h1>
      <p className="mt-4 text-brand-mid">这里什么都没有...</p>
      <Link
        to="/"
        className="inline-block mt-8 px-6 py-2 rounded-lg bg-brand-orange text-brand-dark font-semibold hover:opacity-90 transition-opacity"
      >
        回到首页
      </Link>
    </div>
  );
}
