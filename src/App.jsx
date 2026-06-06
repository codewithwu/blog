// 全局布局：路由级 Navbar 显隐（见 AppShell）
// 这里只是 HashRouter 包装层。useLocation 必须在 Router 内部调用，所以具体布局
// 逻辑放到 AppShell。
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Articles from './pages/Articles.jsx';
import ArticleDetail from './pages/ArticleDetail.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Skills from './pages/Skills.jsx';
import Tools from './pages/Tools.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import PageTransition from './components/PageTransition.jsx';

function AppShell() {
  const location = useLocation();
  const isProjectDetail = /^\/projects\/[^/]+/.test(location.pathname);

  return (
    <>
      {!isProjectDetail && <Navbar />}
      <main className={isProjectDetail ? '' : 'max-w-5xl mx-auto px-6 py-8'}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Navigate to="/articles" replace />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/category/:category" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
