// 统一 markdown 渲染：GFM（表格、任务列表）+ 代码高亮
// 样式在 index.css 中通过 .hljs-* 定制
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export default function Markdown({ children }) {
  return (
    <div className="prose prose-invert max-w-none
      prose-headings:font-[Poppins] prose-headings:text-brand-light
      prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
      prose-p:text-brand-light/90 prose-p:leading-relaxed
      prose-a:text-brand-blue hover:prose-a:text-brand-orange
      prose-strong:text-brand-orange
      prose-code:text-brand-orange prose-code:bg-brand-surface prose-code:px-1 prose-code:rounded
      prose-pre:bg-transparent prose-pre:p-0
      prose-table:border-collapse
      prose-th:border prose-th:border-brand-mid/30 prose-th:px-3 prose-th:py-2
      prose-td:border prose-td:border-brand-mid/30 prose-td:px-3 prose-td:py-2
      prose-blockquote:border-brand-orange prose-blockquote:text-brand-mid
      prose-li:text-brand-light/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
