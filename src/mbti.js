export const MBTI_TYPES = [
  { code: 'ISTJ', zhName: '物流师',   enName: 'Logistician',  descZh: '务实、负责、可靠', descEn: 'Practical, responsible, dependable' },
  { code: 'ISFJ', zhName: '守卫者',   enName: 'Defender',     descZh: '温暖、体贴、忠诚', descEn: 'Warm, caring, loyal' },
  { code: 'INFJ', zhName: '提倡者',   enName: 'Advocate',     descZh: '理想主义、有洞察力', descEn: 'Idealistic, insightful, principled' },
  { code: 'INTJ', zhName: '建筑师',   enName: 'Architect',    descZh: '战略家、独立、果断', descEn: 'Strategic, independent, decisive' },
  { code: 'ISTP', zhName: '鉴赏家',   enName: 'Virtuoso',     descZh: '灵活、冒险、动手能力强', descEn: 'Flexible, adventurous, hands-on' },
  { code: 'ISFP', zhName: '探险家',   enName: 'Adventurer',   descZh: '安静、友善、艺术气质', descEn: 'Quiet, friendly, artistic' },
  { code: 'INFP', zhName: '调停者',   enName: 'Mediator',     descZh: '理想主义、富有同情心', descEn: 'Idealistic, compassionate, creative' },
  { code: 'INTP', zhName: '逻辑学家', enName: 'Logician',     descZh: '创新、理性、善于思考', descEn: 'Innovative, logical, analytical' },
  { code: 'ESTP', zhName: '企业家',   enName: 'Entrepreneur', descZh: '精力充沛、洞察力强', descEn: 'Energetic, perceptive, action-oriented' },
  { code: 'ESFP', zhName: '表演者',   enName: 'Entertainer',  descZh: '热情、友好、爱娱乐', descEn: 'Enthusiastic, friendly, entertaining' },
  { code: 'ENFP', zhName: '竞选者',   enName: 'Campaigner',   descZh: '热情、富有创造力', descEn: 'Passionate, creative, free-spirited' },
  { code: 'ENTP', zhName: '辩论家',   enName: 'Debater',      descZh: '聪明、好奇、爱挑战', descEn: 'Bright, curious, enjoys debate' },
  { code: 'ESTJ', zhName: '总经理',   enName: 'Executive',    descZh: '果断、高效、组织能力强', descEn: 'Decisive, efficient, organized' },
  { code: 'ESFJ', zhName: '执政官',   enName: 'Consul',       descZh: '热心、负责任、善于社交', descEn: 'Caring, responsible, sociable' },
  { code: 'ENFJ', zhName: '主人公',   enName: 'Protagonist',  descZh: '鼓舞人心、有魅力', descEn: 'Inspiring, charismatic, persuasive' },
  { code: 'ENTJ', zhName: '指挥官',   enName: 'Commander',    descZh: '天生领导者、战略家', descEn: 'Born leader, strategic, assertive' },
]

export const MBTI_MAP = Object.fromEntries(MBTI_TYPES.map(t => [t.code, t]))

export function mbtiDisplay(code, lang) {
  if (!code) return ''
  const t = MBTI_MAP[code]
  if (!t) return code
  return lang === 'zh' ? `${t.zhName}（${code}）` : `${t.enName} (${code})`
}
