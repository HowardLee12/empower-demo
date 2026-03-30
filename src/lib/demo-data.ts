import { Banner, Coach, Event, Article, Course } from './types'

export const demoBanners: Banner[] = [
  {
    id: '1',
    title: 'EMPOWER 2026 夏季籃球營',
    subtitle: '點燃你的籃球夢想',
    image_url: '',
    link_url: '#events',
    is_active: true,
    sort_order: 1,
  },
  {
    id: '2',
    title: 'Team EMPOWER 菁英選手培訓',
    subtitle: '加入最頂尖的訓練團隊',
    image_url: '',
    link_url: '#events',
    is_active: true,
    sort_order: 2,
  },
]

export const demoCoaches: Coach[] = [
  {
    id: '1',
    name: '陳教練',
    title: '總教練',
    bio: '擁有15年籃球教學經驗，前職業球員。專精基礎動作訓練與比賽策略。',
    image_url: '',
    is_active: true,
    sort_order: 1,
  },
  {
    id: '2',
    name: '林教練',
    title: '助理教練',
    bio: '大學籃球隊出身，擅長體能訓練與投籃技巧指導。',
    image_url: '',
    is_active: true,
    sort_order: 2,
  },
  {
    id: '3',
    name: '王教練',
    title: '青少年組教練',
    bio: '專注青少年籃球發展，以趣味教學方式培養孩子對籃球的熱情。',
    image_url: '',
    is_active: true,
    sort_order: 3,
  },
]

export const demoEvents: Event[] = [
  {
    id: '1',
    title: 'WONDER 籃球探索營',
    description: '適合初學者的籃球體驗營，從基礎開始培養籃球興趣與技能。',
    image_url: '',
    date: '2026-07-15',
    location: '台北市信義運動中心',
    registration_url: 'https://www.empower.com.tw/',
    is_published: true,
    sort_order: 1,
  },
  {
    id: '2',
    title: 'Rookies 新秀訓練營',
    description: '針對有基礎的球員，進階技術訓練與團隊戰術養成。',
    image_url: '',
    date: '2026-07-22',
    location: '新北市板橋體育館',
    registration_url: 'https://www.empower.com.tw/',
    is_published: true,
    sort_order: 2,
  },
  {
    id: '3',
    title: 'SPARK 暑期特訓班',
    description: '密集訓練課程，提升球員的技術水平與比賽經驗。',
    image_url: '',
    date: '2026-08-01',
    location: '台北市大安運動中心',
    registration_url: 'https://www.empower.com.tw/',
    is_published: true,
    sort_order: 3,
  },
]

export const demoArticles: Article[] = [
  {
    id: '1',
    title: 'EMPOWER All-Star Game 精彩回顧',
    excerpt: '年度明星賽圓滿落幕，選手們展現了驚人的進步與團隊精神。',
    content: '年度明星賽圓滿落幕，選手們展現了驚人的進步與團隊精神。本屆比賽共有 48 位選手參加...',
    image_url: '',
    published_at: '2026-03-15',
    is_published: true,
  },
  {
    id: '2',
    title: '國際交流：日本東京移地訓練紀實',
    excerpt: 'Team EMPOWER 遠赴東京與當地球隊進行交流賽，拓展國際視野。',
    content: 'Team EMPOWER 遠赴東京與當地球隊進行交流賽，拓展國際視野。為期一週的行程中...',
    image_url: '',
    published_at: '2026-03-01',
    is_published: true,
  },
]

export const demoCourses: Course[] = [
  {
    id: '1',
    title: '基礎籃球班',
    description: '適合 6-10 歲初學者，培養基本運球、傳球、投籃技巧。',
    schedule: '每週六 09:00-11:00',
    location: '台北市信義運動中心',
    age_group: '6-10 歲',
    image_url: '',
    registration_url: 'https://www.empower.com.tw/',
    is_active: true,
    sort_order: 1,
  },
  {
    id: '2',
    title: '進階技術班',
    description: '適合有基礎的球員，專注個人技術提升與比賽觀念。',
    schedule: '每週六 14:00-16:00',
    location: '台北市大安運動中心',
    age_group: '10-14 歲',
    image_url: '',
    registration_url: 'https://www.empower.com.tw/',
    is_active: true,
    sort_order: 2,
  },
  {
    id: '3',
    title: '菁英培訓班',
    description: '針對校隊選手或有志參加比賽的球員，高強度訓練。',
    schedule: '每週日 10:00-13:00',
    location: '新北市板橋體育館',
    age_group: '14-18 歲',
    image_url: '',
    registration_url: 'https://www.empower.com.tw/',
    is_active: true,
    sort_order: 3,
  },
]
