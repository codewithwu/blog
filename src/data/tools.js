// 工具数据：源文件 content/工具.md，运行时通过 parseTools 解析
// 修改内容请改 content/工具.md，不要改这里
import toolMd from '../../content/工具.md?raw';
import { parseTools } from '../lib/content.js';

export default parseTools(toolMd);
