// 技能数据：源文件 content/技能.md，运行时通过 parseSkills 解析
// 修改内容请改 content/技能.md，不要改这里
import skillMd from '../../content/技能.md?raw';
import { parseSkills } from '../lib/content.js';

export default parseSkills(skillMd);
