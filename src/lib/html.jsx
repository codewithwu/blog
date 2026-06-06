// 渲染项目详情正文：纯 HTML 片段直接注入。
// 内容由作者控制（projects/<slug>.html），不做消毒。
export default function Html({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
