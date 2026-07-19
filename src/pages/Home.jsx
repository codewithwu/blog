// Home：瀑布流首页。
//
// 结构（见 design.md §6/§7）：顶部 <Hero /> + CSS columns 多列瀑布流。
// 用 CSS columns 而非第三方 masonry 库，避免依赖膨胀（trade-off 见 design.md §12）：
//   - columns-1 / sm:columns-2 / lg:columns-3 / 2xl:columns-4 响应式列数
//   - CSS columns 不支持 flex/grid gap，故列间距用 gap-*，卡片纵向间距用每张卡的 mb-6
//   - break-inside-avoid 防止单张卡被列断开
import Hero from '../components/Hero.jsx';
import EntryCard from '../components/EntryCard.jsx';
import { listEntries } from '../lib/entries.js';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Home() {
  usePageTitle(''); // 首页只用站名，不加前缀
  const entries = listEntries();

  return (
    <div className="max-w-6xl mx-auto px-6 pb-20">
      <Hero />
      <div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-6">
        {entries.map((entry) => (
          <div key={entry.slug} className="mb-6 break-inside-avoid">
            <EntryCard entry={entry} />
          </div>
        ))}
      </div>
    </div>
  );
}
