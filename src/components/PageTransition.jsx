// 页面切换淡入淡出：包裹 Outlet，给子页面加 fadeIn 动画
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fadeIn">
      {children}
    </div>
  );
}
