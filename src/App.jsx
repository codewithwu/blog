// 全局布局：Navbar + PageTransition(Outlet) + Footer
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Articles from './pages/Articles.jsx';
import ArticleDetail from './pages/ArticleDetail.jsx';
import Projects from './pages/Projects.jsx';
import Skills from './pages/Skills.jsx';
import Tools from './pages/Tools.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import PageTransition from './components/PageTransition.jsx';

export default function App() {
  return (
    <HashRouter>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <PageTransition>
          <Routes>
            <Route path="/" element={<Navigate to="/articles" replace />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
    </HashRouter>
  );
}
