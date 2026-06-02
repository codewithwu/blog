// 设置当前页面标题，并附加站点名后缀
// react-helmet-async v2 没有 useHelmet 钩子；直接用 useEffect 设置 document.title
// （HelmetProvider 仍然在 main.jsx 中包裹 <App/>，为后续 meta / OG 标签预留空间）
import { useEffect } from 'react';

const SITE_NAME = 'cooper.dev';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
