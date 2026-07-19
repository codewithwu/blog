// 全局布局与路由。
//
// 瀑布流重构后路由收敛（见 design.md §2）：
//   /            → Home（瀑布流首页，自带品牌 hero，无需全局 Navbar）
//   /p/:slug     → EntryDetail（统一详情，100vh iframe，全屏无壳）
//   旧路由全部 302 重定向（replace 保证历史栈干净），避免外链失效：
//     /articles, /articles/category/:cat, /projects, /skills, /tools, /about → /
//     /articles/:slug, /projects/:slug → /p/:slug
//   *            → NotFound（fallback）
//
// Navbar / Footer 已随重构删除——首页 hero 承担品牌位，详情页只有返回按钮。
// 每个页面自带布局容器，所以 AppShell 不再需要统一 <main> 壳或 Navbar 显隐逻辑。
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Home from './pages/Home.jsx';
import EntryDetail from './pages/EntryDetail.jsx';
import NotFound from './pages/NotFound.jsx';

// 把旧文章/项目详情 slug 转发到统一 /p/:slug。
// 用一个小组件读取 :slug 参数再 Navigate，保持 replace 语义（历史栈干净）。
function RedirectToEntry() {
  const { slug } = useParams();
  return <Navigate to={`/p/${slug}`} replace />;
}

function AppShell() {
  return (
    <Routes>
      {/* 瀑布流首页 */}
      <Route path="/" element={<Home />} />
      {/* 统一详情 */}
      <Route path="/p/:slug" element={<EntryDetail />} />

      {/* 旧列表 / 分类 / 页签 → 首页 */}
      <Route path="/articles" element={<Navigate to="/" replace />} />
      <Route path="/articles/category/:category" element={<Navigate to="/" replace />} />
      <Route path="/projects" element={<Navigate to="/" replace />} />
      <Route path="/skills" element={<Navigate to="/" replace />} />
      <Route path="/tools" element={<Navigate to="/" replace />} />
      <Route path="/about" element={<Navigate to="/" replace />} />

      {/* 旧详情 → 统一 /p/:slug */}
      <Route path="/articles/:slug" element={<RedirectToEntry />} />
      <Route path="/projects/:slug" element={<RedirectToEntry />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
