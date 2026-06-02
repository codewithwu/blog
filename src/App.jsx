// 全局路由：HashRouter + 5 个核心页面 + 重定向与 404
// 详细路由表见 docs/superpowers/specs/2026-06-02-blog-design.md §5.1
// 重要：必须使用 HashRouter，因为 GitHub Pages 不支持 BrowserRouter（见 CLAUDE.md）
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Articles from './pages/Articles.jsx';
import ArticleDetail from './pages/ArticleDetail.jsx';
import Projects from './pages/Projects.jsx';
import Skills from './pages/Skills.jsx';
import Tools from './pages/Tools.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:slug" element={<ArticleDetail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
