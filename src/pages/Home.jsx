// Home 已通过 <Navigate> 在 App.jsx 中重定向到 /articles，本组件仅作 fallback
import { Navigate } from 'react-router-dom';

export default function Home() {
  return <Navigate to="/articles" replace />;
}
