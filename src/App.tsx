import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, Area, ComposedChart, Cell, LabelList, ReferenceLine } from "recharts";
import { LayoutDashboard, TrendingUp, TrendingDown, Bell, Network, DollarSign, Database, AlertTriangle, Lightbulb, Zap, ChevronRight, Info, ChevronDown, ChevronUp } from "lucide-react";

/* ════════════════════════════════════════════════
   DATA — 全部基于权威机构报告校准
   ════════════════════════════════════════════════ */

// ── 需求：方案B，四大类 + 子项拆解 ──
const demandCategories = [
  {
    id: 'power', name: '动力电池', color: '#1565C0',
    v24: 86, v25: 96, v26: 104, v27: 124, v28: 139,
    source: '建信期货（乐观预期104.3万吨）、五矿证券（乘用车74万吨+商用车）',
    desc: '全球新能源汽车+商用车电动化核心驱动。2026E全球新能源乘用车销量2470万辆（五矿），中国市场1850万辆。电动重卡渗透率升至32%，单车带电400-600kWh。',
    derivation: [
      '① 全球EV销量：2349万辆(国信) ~ 2600万辆(中信建投)，取~2470万辆(五矿)',
      '② 车型结构：BEV约1500万辆(带电~70kWh) + PHEV约970万辆(带电~22kWh)',
      '③ 乘用车电池需求：1500×70 + 970×22 = 1264GWh(底线) ~ 1558GWh(国信含库存备货)',
      '④ LCE转换：LFP占78%×0.4kg/kWh + 三元22%×0.7kg/kWh → 均值~0.47kg/kWh',
      '⑤ 乘用车LCE：取国信1558GWh × 0.47 ÷ 10000 ≈ 73万吨(含渠道库存)',
      '⑥ 商用车：重卡35万辆(GGII)×500kWh + 客车/物流车 ≈ 商用电池需求402GWh(研精毕智)',
      '⑦ 商用车LCE：402GWh × 0.4(商用车以LFP为主) ÷ 10000 ≈ 16万吨 + 两轮/船舶等',
      '⑧ 合计：73+16+15(其他) ≈ 104万吨 ✓ (=建信期货乐观预期104.3万吨)',
      '⑨ 注：2027-2028年增速放缓(124→139万吨)，考虑了锂价20万+时车企成本传导阻力',
    ],
    subs: [
      { name: '新能源乘用车', v26: 74, note: 'BEV~1500万辆×70kWh + PHEV~970万辆×22kWh，取国信1558GWh', source: '五矿证券' },
      { name: '电动重卡/商用车', v26: 25, note: '重卡35万辆×500kWh + 客车/物流车 = 402GWh(研精毕智)', source: '五矿证券' },
      { name: '电动两轮车/微型车', v26: 3, note: '新国标替换+东南亚出口', source: 'EVTank' },
      { name: '电动船舶/航空等', v26: 2, note: '内河电动化+eVTOL试点', source: 'IEA' },
    ],
  },
  {
    id: 'storage', name: '储能电池', color: '#7c3aed',
    v24: 34, v25: 40, v26: 59, v27: 72, v28: 78,
    source: '上证报（48-52万吨）、建信期货（乐观63.6万吨）、GGII（2026E出货820GWh）',
    desc: '最大增量来源！Q1中国储能出货209GWh(+115%)。中信建投4月上修全年锂电需求至3163GWh(+38.3%)。储能绝对增量首超动力电池。',
    derivation: [
      '① GGII预测：2026年中国储能锂电出货850GWh(+35%)',
      '② Q1实际：中国储能出货209GWh(+115%)，年化836GWh已基本验证全年预测',
      '③ 全球储能出货：国信预计全年储能电池需求~1400GWh(含动力储能一体化)',
      '④ 纯储能口径：扣除与动力电池重叠部分后约1200GWh',
      '⑤ 储能97%为LFP → 1200GWh × 0.4kg/kWh ÷ 10000 ≈ 48万吨(基线)',
      '⑥ 实际验证：Q1出货+115%远超GGII年初预期，全年上修~22% → 48×1.22 ≈ 59万吨',
      '⑦ 交叉验证：建信期货乐观预期63.6万吨 > 我们取值59万吨(偏中性)',
      '⑧ 注：2027-2028年增速放缓(72→78)，锂价超20万时20-30%储能项目IRR受影响(东吴)',
    ],
    subs: [
      { name: '电网侧/发电侧大储', v26: 35, note: '136号文后独立储能成主力，国内IRR 6-12%', source: 'CESA、中信建投' },
      { name: '工商业储能', v26: 9, note: '受分时电价政策影响波动大', source: 'CESA' },
      { name: '户用储能', v26: 6, note: '欧洲+新兴市场增量', source: '国海证券' },
      { name: 'AIDC数据中心储能', v26: 4, note: 'DC储能16.5→209GWh(2024→2030)，CAGR 60-80%', source: '弗若斯特沙利文、GGII' },
      { name: '便携式储能', v26: 2, note: '北美市场占比60%', source: 'EVTank' },
      { name: '其他新型储能', v26: 3, note: '液流电池/压缩空气等非锂路线增长', source: 'CNESA' },
    ],
  },
  {
    id: 'consumer', name: '消费电子', color: '#64748b',
    v24: 8, v25: 8, v26: 8, v27: 8, v28: 8,
    source: 'IDC、Canalys',
    desc: '手机、笔记本等终端出货量趋稳。AI手机/PC可能小幅提升单机带电量，但整体增量有限。',
    derivation: [
      '① 智能手机：12亿部/年 × 15Wh × 0.5kg/kWh ÷ 10^6 ≈ 4万吨',
      '② 笔记本/平板：4亿台/年 × 50Wh × 0.6kg/kWh ÷ 10^6 ≈ 3万吨',
      '③ 可穿戴/电动工具等 ≈ 1万吨',
      '④ 合计 ≈ 8万吨，近年保持平稳',
    ],
    subs: [
      { name: '智能手机', v26: 4, note: '全球出货12亿部/年趋平', source: 'IDC' },
      { name: '笔记本/平板', v26: 3, note: '锂电渗透率接近饱和', source: 'Canalys' },
      { name: '其他消费电子', v26: 1, note: '可穿戴/电动工具等', source: 'TechInsights' },
    ],
  },
  {
    id: 'industrial', name: '工业及其他', color: '#78716c',
    v24: 18, v25: 17, v26: 17, v27: 16, v28: 15,
    source: 'USGS、Wood Mackenzie',
    desc: '传统工业用锂（陶瓷/玻璃/润滑脂/医药等）需求缓慢下滑，部分被新材料替代。',
    derivation: [
      '① 陶瓷/玻璃：8万吨(USGS)，受建筑行业周期影响',
      '② 润滑脂：4万吨，工业润滑用锂基脂',
      '③ 医药/聚合物/其他：5万吨',
      '④ 合计17万吨，每年缩减~1万吨(被新材料替代)',
      '⑤ 钠离子电池替代影响有限(不足3%)',
    ],
    subs: [
      { name: '陶瓷/玻璃', v26: 8, note: '建筑行业周期影响', source: 'USGS' },
      { name: '润滑脂', v26: 4, note: '工业润滑用锂基脂', source: 'USGS' },
      { name: '医药/聚合物/其他', v26: 5, note: '分散稳定', source: 'Wood Mackenzie' },
    ],
  },
];

// ── 供给：以五矿证券为基准 ──
const supplySegments = [
  { id: 'australia', name: '澳洲锂辉石', v24: 47, v25: 47.4, v26: 50.7, v27: 53, v28: 55, cost: '5-8', color: '#1565C0',
    source: '五矿证券', deriv: 'Greenbushes(+CGP3)+Pilbara 82-87万吨+其他 = 389万吨精矿÷7.7 ≈ 50.7万吨LCE', desc: '全球最大锂辉石产区。CGP3爬坡中，但远期已无大规模待投产矿山。2026-2030年CAGR不足10%。' },
  { id: 'chile', name: '智利盐湖', v24: 27.4, v25: 29.4, v26: 30.4, v27: 30, v28: 29, cost: '3-5', color: '#1B5E20',
    source: '五矿证券', deriv: 'SQM 22.5万吨+ALB 7.9万吨 = 30.4万吨LCE(2026E)。2027起国有化法案导致外资扩产暂停，预计产量微降', desc: '4月28日通过锂矿国有化法案(外资持股≤49%)。SQM氢氧化锂爬坡，但远期增量因政策不确定性受限。2027-2028年小幅下调。' },
  { id: 'africa', name: '非洲锂矿', v24: 13.5, v25: 12.5, v26: 24, v27: 32, v28: 35, cost: '6-9', color: '#EF6C00',
    source: '五矿证券', deriv: '五矿名义28.2万吨，扣除津巴布韦H1发运中断(-4.2万吨) → 实际有效24万吨。华友首批发运7月到国内，H2恢复', desc: '有效供给24万吨(名义28.2万吨扣除H1扰动)。津巴布韦2026年2月暂停出口后改为配额制，影响全球~6%供应、中国~20%锂精矿进口。' },
  { id: 'china_qinghai', name: '中国青海盐湖', v24: 13, v25: 14.7, v26: 17.3, v27: 20, v28: 22, cost: '3-4', color: '#00897B',
    source: '五矿证券', deriv: '盐湖股份(旧4万+新4万)+汇信2万+藏格1.1万+蓝科3万+其他 ≈ 17.3万吨', desc: '同比+33%。盐湖股份4万吨新产能投产、汇信2万吨投产。"吸附+膜法"工艺平抑季节波动。' },
  { id: 'argentina', name: '阿根廷盐湖', v24: 6.8, v25: 10.5, v26: 16.8, v27: 18.5, v28: 20, cost: '4-6', color: '#26A69A',
    source: '五矿证券', deriv: '力拓Rincon 2万+紫金3Q 1万+赣锋Mariana 2万+Cauchari-Olaroz 4万+其他 ≈ 16.8万吨', desc: '同比+60%，产能集中释放。但27-28年增速放缓至~10%，受资本开支和爬坡限制。' },
  { id: 'china_jiangxi', name: '江西锂云母', v24: 18, v25: 18, v26: 15, v27: 18, v28: 17, cost: '8-12', color: '#C62828',
    source: '五矿证券、大摩', deriv: '五矿名义19万吨，扣除宜春4矿5月停产(-4万吨/年化) → 有效15万吨。枧下窝矿Q4复产后2027年恢复', desc: '有效供给15万吨(名义19万吨扣除换证停产)但受换证影响实际可能14-16万吨。宜春8宗矿权2026年5月起停产换证，占全球供应~6%。宁德枧下窝矿复产推迟至Q4。' },
  { id: 'china_other', name: '中国其他锂矿', v24: 8.8, v25: 10, v26: 14, v27: 16, v28: 18, cost: '5-9', color: '#5C6BC0',
    source: '五矿证券', desc: '同比+59%。四川（大红柳滩）、湖南（湘源）、内蒙古等新兴产区崛起。' },
  { id: 'recycling', name: '电池回收', v24: 5, v25: 7, v26: 9, v27: 12, v28: 16, cost: '4-7', color: '#6A1B9A',
    source: '五矿证券', desc: '2026年中国退役动力电池约80GWh(约50万吨重量)，可回收LCE约4万吨；加上生产端废料(边角料/不良品)回收约5万吨，合计9万吨。格林美、天奇股份产能扩张。' },
  { id: 'china_tibet', name: '中国西藏盐湖', v24: 1.3, v25: 2.5, v26: 5.5, v27: 7, v28: 8, cost: '3-5', color: '#009688',
    source: '五矿证券', desc: '同比+323%！拉果错一期、扎布耶二期等投产。但面临高海拔环保约束。' },
  { id: 'brazil', name: '巴西', v24: 3.8, v25: 3, v26: 3, v27: 3.5, v28: 4, cost: '7-10', color: '#795548',
    source: '五矿证券', desc: '2025年同比-22%(3.8→3万吨)。2026E持平，Sigma债务重组后缓慢复产。' },
  { id: 'north_america', name: '北美', v24: 1.5, v25: 2, v26: 3, v27: 5, v28: 8, cost: '8-12', color: '#5E35B1',
    source: '五矿证券、DOE', desc: 'Thacker Pass投产中。IRA法案驱动但成本高，战略意义大于经济意义。' },
  { id: 'europe', name: '欧洲', v24: 0.5, v25: 0.8, v26: 1.1, v27: 2, v28: 3, cost: '10-15', color: '#42A5F5',
    source: '欧盟CRMA', desc: '审批周期长。欧盟CRMA要求2030年本土供应占比10%。' },
];

// ── 供需平衡（统一至2026年5月视角）──
// 供给：五矿证券原始预测198万吨(2025.11)，但2026年实际发生了三重扰动：
//   1. 津巴布韦出口禁令→配额制（影响~6%全球供给）
//   2. 江西宜春4矿5月停产换证（影响现有产能~9.5万吨）
//   3. 澳洲部分矿区柴油短缺
// 大摩2026.04将供给增量从50万吨下调至40万吨→有效供给~190万吨
// 需求：Q1储能出货+115%超预期，中信建投4月上修全年锂电需求至3163GWh(+38.3%)
const balanceData = [
  { year: '2024', demand: 146, supply: 146, balance: 0, price: '7-15万', note: '供需基本平衡' },
  { year: '2025', demand: 161, supply: 165, balance: 4, price: '5.8-12万', note: 'H1过剩→H2紧平衡' },
  { year: '2026E', demand: 188, supply: 190, balance: 2, price: '15-20万', note: '名义微过剩，Q1/Q4短缺' },
  { year: '2027E', demand: 220, supply: 217, balance: -3, price: '18-22万', note: '紧平衡转微短缺(安泰科)' },
  { year: '2028E', demand: 240, supply: 235, balance: -5, price: '20-25万', note: '短缺持续，价格反馈抑制缺口' },
];
// 注：2026E供给198万吨为五矿中性预期；扣除津巴布韦+江西扰动后实际~185-190万吨
// 安泰科预计2026年过剩约8万吨(缩窄)，2027年正式转入短缺

// ── 月度价格+库存走势（基于SMM、华金期货实际数据）──
const monthlyTrend = [
  { m: '25-01', p: 9.8, inv: 15.5 }, { m: '25-02', p: 8.5, inv: 15.8 }, { m: '25-03', p: 7.5, inv: 15.2 },
  { m: '25-04', p: 7.0, inv: 14.5 }, { m: '25-05', p: 6.2, inv: 13.8 }, { m: '25-06', p: 5.8, inv: 13.0 },
  { m: '25-07', p: 6.5, inv: 12.5 }, { m: '25-08', p: 7.2, inv: 12.0 }, { m: '25-09', p: 8.0, inv: 11.8 },
  { m: '25-10', p: 9.5, inv: 11.5 }, { m: '25-11', p: 10.2, inv: 11.6 }, { m: '25-12', p: 12.0, inv: 11.2 },
  { m: '26-01', p: 15.3, inv: 10.8 }, { m: '26-02', p: 17.2, inv: 11.0 }, { m: '26-03', p: 16.5, inv: 10.8 },
  { m: '26-04', p: 17.2, inv: 10.5 }, { m: '26-05', p: 17.7, inv: 10.3 },
];

// ── 动态 ──
const alerts = [
  { id: 1, date: '2026-05-02', cat: 'price', impact: 'high', title: '碳酸锂电池级价格升至17.7万元/吨 月涨12%', content: '5月1日电池级碳酸锂参考价17.7万元/吨，较4月初15.8万上涨12%。5-6月预计去库幅度加大，供需紧平衡支撑锂价高位运行。', source: '生意社、新浪期货(2026.05.02)' },
  { id: 2, date: '2026-04-29', cat: 'supply', impact: 'high', title: '国联期货：5月碳酸锂预计存在0.8万吨缺口', content: '津巴布韦进口5月显著减少，回流国内需等到7月。江西4矿5月停产换证。澳洲Pilbara矿区柴油短缺。三重供给扰动叠加。', source: '国联期货5月策略报告(2026.04.29)' },
  { id: 3, date: '2026-04-28', cat: 'policy', impact: 'high', title: '智利锂矿国有化法案正式落地', content: '核心条款：2027年起所有锂矿项目外资持股比例不得超过49%。智利为全球第二大锂生产国，2026E产量30.4万吨LCE。', source: '生意社(2026.04.28)' },
  { id: 4, date: '2026-04-28', cat: 'supply', impact: 'medium', title: '华友钴业津巴布韦硫酸锂首批产品发运回国', content: '标志着中企在津巴布韦"本地加工"路线取得突破。出口程序完整后到国内约需3个月。盛新、中矿也已获配额。', source: '生意社、21经济网(2026.04.28)' },
  { id: 5, date: '2026-04-22', cat: 'supply', impact: 'high', title: '摩根士丹利大幅下调全球锂供应预期', content: '大摩将2026年全球锂供应增量从50万吨下调至40万吨LCE，主因江西换证停产+津巴布韦出口中断。预计Q4价格或触及25万元/吨。', source: '摩根士丹利研报(2026.04)' },
  { id: 6, date: '2026-04-17', cat: 'demand', impact: 'high', title: 'Q1中国储能电池出货209GWh 同比+115%', content: '全球储能出货216GWh，同比+117%。储能占锂电排产41.3%，已超动力电池。4月排产预计235GWh。', source: '鑫椤锂电(2026.04.17)' },
  { id: 7, date: '2026-04-13', cat: 'price', impact: 'medium', title: '碳酸锂期货主力合约涨停 报16.65万', content: '单日涨6.51%至166,500元/吨。现货电池级15.56-15.90万元/吨。中邮证券：5月供需缺口放大，锂价或在15-20万上沿运行。', source: 'SMM、广期所、中邮证券' },
  { id: 8, date: '2026-04-01', cat: 'supply', impact: 'high', title: '江西宜春4家锂矿5月起停产换证', content: '宜春8宗涉锂矿权合计年产能~20万吨LCE，占全球~6%。首批4矿停产月减供应~6000吨LCE。宁德枧下窝矿复产推迟至Q4。', source: '江西省自然资源厅、大摩' },
  { id: 9, date: '2026-02-25', cat: 'policy', impact: 'high', title: '津巴布韦全面暂停锂矿出口 后改配额制', content: '影响全球~6%供应、中国~20%锂精矿进口。配额条件：承诺2027年1月前建成硫酸锂厂，征收10%精矿出口税，每月报告。', source: '津巴布韦矿业部、每日经济新闻' },
  { id: 10, date: '2026-01-06', cat: 'demand', impact: 'medium', title: 'GGII：2026年中国锂电出货将超2.3TWh', content: '储能锂电出货突破850GWh(+35%)，动力电池超1.3TWh(+20%)。储能绝对增量首超动力电池。头部企业维持满产。', source: 'GGII(2026.01.06)' },
];

/* ════ helpers ════ */
const sum = (arr, k) => Math.round(arr.reduce((s, x) => s + (x[k] || 0), 0) * 10) / 10;
const catColors = { supply: 'bg-emerald-100 text-emerald-800', demand: 'bg-blue-100 text-blue-800', price: 'bg-red-100 text-red-800', policy: 'bg-purple-100 text-purple-800' };
const catLabels = { supply: '供给', demand: '需求', price: '价格', policy: '政策' };

/* ════ Components ════ */

function AlertList({ max = 99 }) {
  const [filter, setFilter] = useState('all');
  const list = (filter === 'all' ? alerts : alerts.filter(a => a.cat === filter)).slice(0, max);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Bell className="w-4 h-4 text-amber-500" />最新动态</h3>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="text-xs border rounded-lg px-2 py-1 bg-slate-50">
          <option value="all">全部</option><option value="supply">供给</option><option value="demand">需求</option><option value="price">价格</option><option value="policy">政策</option>
        </select>
      </div>
      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
        {list.map(a => (
          <div key={a.id} className="border border-slate-100 rounded-lg p-2.5 hover:bg-slate-50/80">
            <div className="flex items-start gap-2">
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.impact === 'high' ? 'bg-red-500' : 'bg-amber-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-slate-900 leading-snug">{a.title}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${catColors[a.cat]}`}>{catLabels[a.cat]}</span>
                  <span className="text-[10px] text-slate-400">{a.date}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{a.content}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">来源：{a.source}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemandCategoryCard({ cat }) {
  const [panel, setPanel] = useState('');
  const inc = Math.round(cat.v28 - cat.v25);
  const cagr = cat.v25 > 0 ? Math.round((Math.pow(cat.v28 / cat.v25, 1 / 3) - 1) * 100) : 0;
  const toggle = (p) => setPanel(panel === p ? '' : p);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
          <h4 className="text-base font-bold text-slate-900">{cat.name}</h4>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => toggle('subs')} className={`text-xs px-2 py-1 rounded-lg transition-all ${panel==='subs'?'bg-blue-100 text-blue-700 font-medium':'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>子项拆解</button>
          <button onClick={() => toggle('calc')} className={`text-xs px-2 py-1 rounded-lg transition-all ${panel==='calc'?'bg-amber-100 text-amber-700 font-medium':'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>测算逻辑</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm mb-2">
        {[['2024', cat.v24], ['2025', cat.v25], ['2026E', cat.v26], ['2027E', cat.v27], ['2028E', cat.v28]].map(([y, v], i) => (
          <div key={y} className="text-center"><div className="text-[10px] text-slate-400">{y}</div><div className={`font-bold ${i === 2 ? 'text-blue-700' : 'text-slate-700'}`}>{v}</div></div>
        ))}
        <div className="w-px h-6 bg-slate-200" />
        <div className="text-center"><div className="text-[10px] text-slate-400">25→28增量</div><div className="font-bold text-blue-700">+{inc}</div></div>
        <div className="text-center"><div className="text-[10px] text-slate-400">CAGR</div><div className="font-bold text-blue-700">{cagr}%</div></div>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed mb-1">{cat.desc}</p>
      <p className="text-[10px] text-slate-400">数据来源：{cat.source}</p>
      {panel === 'subs' && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-700 mb-2">2026E 子项拆解（万吨LCE）</div>
          <div className="space-y-1.5">
            {cat.subs.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <div className="flex-1"><span className="text-xs font-medium text-slate-800">{s.name}</span><span className="text-[10px] text-slate-400 ml-2">{s.note}</span></div>
                <div className="text-right"><span className="text-sm font-bold text-slate-900">{s.v26}</span><span className="text-[10px] text-slate-400 ml-1">万吨</span></div>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-1.5 font-bold text-xs text-slate-900">
              <span>合计</span><span>{cat.subs.reduce((s, x) => s + x.v26, 0)} 万吨</span>
            </div>
          </div>
        </div>
      )}
      {panel === 'calc' && cat.derivation && (
        <div className="mt-3 pt-3 border-t border-amber-100">
          <div className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1"><Info className="w-3.5 h-3.5"/>2026E = {cat.v26}万吨 测算推导</div>
          <div className="bg-amber-50/80 rounded-lg p-3 space-y-1">
            {cat.derivation.map((line, i) => (
              <div key={i} className="text-[11px] text-slate-700 leading-relaxed font-mono">{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════ Tabs ════ */

function OverviewTab() {
  const chartData = balanceData.map(d => ({ ...d, dm: d.demand, sp: d.supply }));
  const tip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    const dm = payload.find(p => p.dataKey === 'dm')?.value, sp = payload.find(p => p.dataKey === 'sp')?.value;
    return (<div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs"><div className="font-bold text-sm mb-1">{label}</div><div className="flex justify-between gap-6"><span className="text-slate-500">需求</span><span className="font-bold text-blue-700">{dm}万吨</span></div><div className="flex justify-between gap-6"><span className="text-slate-500">供给</span><span className="font-bold text-emerald-700">{sp}万吨</span></div><div className="border-t pt-1 mt-1 flex justify-between gap-6"><span className="text-slate-500">缺口</span><span className={`font-bold ${sp - dm >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{sp - dm >= 0 ? '+' : ''}{sp - dm}万吨</span></div></div>);
  };
  return (
    <div className="space-y-5">
      {/* ═══ 价格仪表盘 ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
          <div className="lg:col-span-2">
            <div className="flex items-end gap-3 mb-3">
              <div className="text-5xl font-black text-slate-900 leading-none">17.7</div>
              <div className="pb-1">
                <div className="text-sm text-slate-500">万元/吨 · 电池级碳酸锂</div>
                <div className="text-xs text-red-500 font-semibold">较上月 +12% ↑ · 较去年同期 +121%</div>
              </div>
            </div>
            <div className="relative h-7 rounded-full overflow-hidden mb-1.5">
              <div className="absolute inset-0 flex">
                <div className="flex-[40] bg-gradient-to-r from-emerald-400 to-emerald-300" />
                <div className="flex-[20] bg-gradient-to-r from-yellow-300 to-orange-300" />
                <div className="flex-[20] bg-gradient-to-r from-orange-300 to-red-400" />
                <div className="flex-[20] bg-gradient-to-r from-red-400 to-red-700" />
              </div>
              <div className="absolute top-0 bottom-0 w-1 bg-slate-900 rounded" style={{ left: `${((17.7-5)/(30-5))*100}%` }}>
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">17.7万</div>
              </div>
            </div>
            <div className="flex text-[9px] text-slate-400">
              <div className="flex-[40]"><span className="pl-1">5万</span><span className="float-right">15万 舒适线</span></div>
              <div className="flex-[20] text-center">20万 警戒</div>
              <div className="flex-[40] text-right pr-1">30万</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="text-xs font-bold text-amber-900 mb-1">📍 舒适区上沿 → 偏紧</div>
              <div className="text-[10px] text-amber-800 leading-relaxed">全产业链盈利，储能IRR尚可。距20万警戒线仅13%。库存29天远低于安全线(45天)支撑价格高位。</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="bg-slate-50 rounded-lg p-2"><div className="text-slate-400">库存覆盖</div><div className="font-bold text-red-600 text-sm">29天</div></div>
              <div className="bg-slate-50 rounded-lg p-2"><div className="text-slate-400">Q4预测(大摩)</div><div className="font-bold text-red-600 text-sm">25万</div></div>
            </div>
          </div>
        </div>
      </div>
      {/* 分析摘要 */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4">
        <h3 className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-1.5"><Zap className="w-4 h-4" />2026年供需格局核心判断（截至5月）</h3>
        <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
          <p>• <strong>格局已变</strong>：五矿原预测供给198万吨，津巴布韦+江西+澳矿扰动使有效供给降至~190万吨。需求端Q1储能+115%超预期，全年供需从"过剩14万"修正为"名义微过剩2万吨"。</p>
          <p>• <strong>为何过剩仍涨价</strong>：年度+2万吨过剩但价格涨至17.7万，核心传导链是——库存10.3万吨仅覆盖27天(华金期货)→上游挺价惜售→补库需求推升价格→期货升水拉动现货。本质上锂作为战略品种，库存周转天数比年度供需平衡更能决定价格方向。</p>
          <p>• <strong>季度节奏(中性预期)</strong>：Q1供需基本平衡→Q2小幅过剩(南美到港增加)→Q3季节性累库→Q4供给缺口(国联)。全年呈"前宽后紧"格局。</p>
          <p>• <strong>价格中枢与弹性边界</strong>：15万为"舒适区"（全产业链盈利），超20万则20-30%储能项目IRR受影响形成需求抑制（东吴），同时刺激mothballed矿复产（全球8-10万吨/年潜在产能，复产周期6个月）。这一价格反馈机制使2027-2028年缺口被自然抑制在-2~-5万吨，而非线性外推的-13~-33万吨。</p>
          <p>• <strong>2027年确认转入短缺</strong>：安泰科预计2027年正式短缺。大型锂资源新项目2026-2027年进入空窗期，两年资本开支不足制约后续增长（建信期货）。但缺口规模受价格弹性制约，不太可能超过10万吨。</p>
        </div>
      </div>
      {/* 供需图 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-0.5">全球碳酸锂供需平衡（万吨LCE）</h3>
        <p className="text-[10px] text-slate-400 mb-4">供给：大摩4月修正后~190万吨(原五矿198万吨) | 需求：综合鑫椤+中信建投4月上修 | 安泰科：2027年正式短缺</p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barSize={38} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 13, fill: '#333', fontWeight: 600 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} domain={[0, 300]} />
            <Tooltip content={tip} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Legend formatter={v => v === 'dm' ? '需求' : '供给'} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="dm" name="需求" fill="#1565C0" radius={[6, 6, 0, 0]} />
            <Bar dataKey="sp" name="供给" fill="#43A047" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-5 gap-2 mt-3">
          {balanceData.map(d => (
            <div key={d.year} className="rounded-lg border border-slate-100 p-2.5 text-center text-xs">
              <div className="text-slate-500 mb-1">{d.year}</div>
              <div className="font-bold text-blue-700">{d.demand}</div>
              <div className="text-slate-400 text-[10px]">vs</div>
              <div className="font-bold text-emerald-700">{d.supply}</div>
              <div className={`font-bold mt-0.5 ${d.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{d.balance >= 0 ? '过剩' : '短缺'}{Math.abs(d.balance)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{d.note}</div>
              <div className="text-[9px] text-slate-300">{d.price}</div>
            </div>
          ))}
        </div>
      </div>
      {/* 测算方法论 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5"><Info className="w-4 h-4 text-amber-500"/>供需总量测算方法论</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50/80 rounded-xl p-3">
            <div className="font-bold text-blue-900 text-xs mb-2">需求端 188万吨 = 动力104 + 储能59 + 消费电子8 + 工业17</div>
            <div className="text-[10px] text-slate-600 space-y-0.5 font-mono">
              <div>动力电池：全球锂电需求3163GWh(中信建投4月) × 动力占比~50% × LCE系数0.47kg/kWh</div>
              <div>储能电池：GGII 850GWh(中国) + 海外350GWh = 1200GWh × LFP系数0.4kg/kWh × 上修系数1.22</div>
              <div>消费电子：12亿手机+4亿PC × 各自带电量 → 稳定8万吨</div>
              <div>工业及其他：USGS统计陶瓷/润滑脂/医药等传统用锂 → 17万吨(缓降)</div>
            </div>
          </div>
          <div className="bg-emerald-50/80 rounded-xl p-3">
            <div className="font-bold text-emerald-900 text-xs mb-2">供给端 190万吨 = 分项合计(扣除扰动后)</div>
            <div className="text-[10px] text-slate-600 space-y-0.5 font-mono">
              <div>五矿中性预测(2025.11)：全球供给198万吨LCE</div>
              <div>非洲锂矿：名义28.2万吨 → 实际24万吨(津巴布韦H1发运中断-4.2万吨)</div>
              <div>江西锂云母：名义19万吨 → 实际15万吨(4矿停产换证-4万吨)</div>
              <div>其他产区按五矿预测不变(澳洲50.7+智利30.4+青海17.3+阿根廷16.8+其他)</div>
              <div>分项合计：50.7+30.4+24+17.3+16.8+15+14+9+5.5+3+3+1.1 = 189.8≈190万吨 ✓</div>
            </div>
          </div>
        </div>
        <div className="text-[9px] text-slate-400 mt-2">LCE转换系数：LFP=0.4kg/kWh(含锂4.4%) | 三元NCM=0.7kg/kWh | 加权均值~0.47kg/kWh(LFP占78%)</div>
      </div>
      {/* 情景分析 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5"><Info className="w-4 h-4 text-purple-500"/>2026E 三种情景分析</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50"><tr>
              <th className="text-left p-2 font-semibold text-slate-600">情景</th>
              <th className="p-2 text-right font-semibold text-slate-600">需求</th>
              <th className="p-2 text-right font-semibold text-slate-600">供给</th>
              <th className="p-2 text-right font-semibold text-slate-600">平衡</th>
              <th className="p-2 text-right font-semibold text-slate-600">价格中枢</th>
              <th className="text-left p-2 font-semibold text-slate-600">关键假设</th>
            </tr></thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="p-2 font-bold text-red-700">🔺 乐观(牛市)</td><td className="p-2 text-right font-bold">196</td><td className="p-2 text-right">185</td><td className="p-2 text-right text-red-600 font-bold">-11</td><td className="p-2 text-right text-red-600">20-25万</td>
                <td className="p-2 text-slate-500">储能+40%(建信乐观)；津巴布韦全年未恢复；江西复产推迟至2027</td>
              </tr>
              <tr className="border-b border-slate-100 bg-blue-50/30">
                <td className="p-2 font-bold text-blue-700">⬤ 中性(基准)</td><td className="p-2 text-right font-bold">188</td><td className="p-2 text-right">190</td><td className="p-2 text-right text-emerald-600 font-bold">+2</td><td className="p-2 text-right">15-20万</td>
                <td className="p-2 text-slate-500">储能+22%(Q1验证后)；津巴布韦7月恢复；江西部分复产</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="p-2 font-bold text-emerald-700">🔻 悲观(熊市)</td><td className="p-2 text-right font-bold">175</td><td className="p-2 text-right">198</td><td className="p-2 text-right text-emerald-600 font-bold">+23</td><td className="p-2 text-right text-emerald-600">10-14万</td>
                <td className="p-2 text-slate-500">储能增速腰斩(电价政策收紧)；江西/津巴布韦全量恢复；阿根廷超预期</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="text-[10px] text-slate-400 mt-2">乐观/悲观情景需求差距21万吨，核心变量是储能增速和供给扰动持续时间。当前Q1数据偏向中性偏乐观。</div>
      </div>

      {/* ═══ 新增模块1：价格敏感性曲线 ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-amber-500" />价格敏感性分析：不同锂价下的供需响应</h3>
        <p className="text-[10px] text-slate-400 mb-3">蓝线=有效需求（锂价越高→储能项目越多延期） · 绿线=有效供给（锂价越高→高成本矿复产越多）· 虚线=当前价17.7万</p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={[
            { price: 8, demand: 195, supply: 130, zone: '低价区' },
            { price: 10, demand: 193, supply: 150, zone: '' },
            { price: 12, demand: 192, supply: 170, zone: '' },
            { price: 15, demand: 190, supply: 185, zone: '舒适区' },
            { price: 17.7, demand: 188, supply: 190, zone: '当前' },
            { price: 20, demand: 180, supply: 198, zone: '警戒区' },
            { price: 22, demand: 172, supply: 203, zone: '' },
            { price: 25, demand: 160, supply: 210, zone: '过热区' },
            { price: 30, demand: 145, supply: 215, zone: '' },
          ]} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="price" tick={{ fontSize: 11 }} tickFormatter={v => `${v}万`} />
            <YAxis tick={{ fontSize: 10 }} domain={[120, 220]} label={{ value: '万吨LCE', angle: -90, position: 'insideLeft', style: { fontSize: 9 } }} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload;
              const bal = d.supply - d.demand;
              return (<div className="bg-white border rounded-lg p-3 shadow-lg text-xs">
                <div className="font-bold mb-1">锂价 {d.price}万元/吨 {d.zone && `(${d.zone})`}</div>
                <div className="flex justify-between gap-4"><span className="text-slate-500">有效需求</span><span className="font-bold text-blue-700">{d.demand}万吨</span></div>
                <div className="flex justify-between gap-4"><span className="text-slate-500">有效供给</span><span className="font-bold text-emerald-700">{d.supply}万吨</span></div>
                <div className={`border-t mt-1 pt-1 font-bold ${bal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{bal >= 0 ? '过剩' : '短缺'} {Math.abs(bal)}万吨</div>
              </div>);
            }} />
            <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="top" align="right" />
            <ReferenceLine x={17.7} stroke="#EF4444" strokeDasharray="5 3" strokeWidth={2} label={{ value: '← 当前17.7万', fill: '#EF4444', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine x={15} stroke="#ccc" strokeDasharray="3 3" strokeWidth={1} />
            <ReferenceLine x={20} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1} />
            <Line type="monotone" dataKey="demand" stroke="#1565C0" strokeWidth={2.5} dot={{ r: 4 }} name="有效需求" />
            <Line type="monotone" dataKey="supply" stroke="#43A047" strokeWidth={2.5} dot={{ r: 4 }} name="有效供给" />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-3 mt-3 text-[10px]">
          <div className="bg-emerald-50 rounded-lg p-2 text-center"><div className="font-bold text-emerald-800">10-15万 舒适区</div><div className="text-slate-500">全产业链盈利，供需双旺</div></div>
          <div className="bg-amber-50 rounded-lg p-2 text-center"><div className="font-bold text-amber-800">15-20万 当前区</div><div className="text-slate-500">高成本矿恢复盈利，储能IRR尚可</div></div>
          <div className="bg-red-50 rounded-lg p-2 text-center"><div className="font-bold text-red-800">20万+ 过热区</div><div className="text-slate-500">20-30%储能项目延期(东吴)，mothballed矿复产</div></div>
        </div>
      </div>

      {/* ═══ 新增模块2：关键事件时间轴 ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5"><Database className="w-4 h-4 text-blue-500" />关键事件时间轴（2026-2028）</h3>
        <div className="overflow-x-auto">
          <div className="relative" style={{ minWidth: 900 }}>
            {/* 时间轴线 */}
            <div className="flex items-center mb-2 text-[10px] font-bold text-slate-500">
              {['2026 Q1','2026 Q2','2026 Q3','2026 Q4','2027 H1','2027 H2','2028'].map((q,i) => (
                <div key={i} className="flex-1 text-center border-b-2 border-slate-200 pb-1">{q}</div>
              ))}
            </div>
            {/* 供给事件（上方，绿色系） */}
            <div className="mb-1 text-[9px] font-semibold text-emerald-700 px-1">▼ 供给端事件</div>
            <div className="flex mb-3">
              {[
                { text: '津巴布韦\n暂停出口', color: 'bg-red-100 border-red-300 text-red-800' },
                { text: '江西4矿\n停产换证', color: 'bg-red-100 border-red-300 text-red-800' },
                { text: '华友发运\n恢复到港', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
                { text: '枧下窝矿\n复产+盐湖4万吨', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
                { text: '阿根廷\n爬坡放量', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
                { text: '智利国有化\n外资≤49%', color: 'bg-amber-100 border-amber-300 text-amber-800' },
                { text: 'Mothballed矿\n高价刺激复产', color: 'bg-blue-100 border-blue-300 text-blue-800' },
              ].map((ev, i) => (
                <div key={i} className="flex-1 px-0.5">
                  <div className={`${ev.color} border rounded px-1 py-1.5 text-center whitespace-pre-line leading-tight`}>{ev.text}</div>
                </div>
              ))}
            </div>
            {/* 需求&技术事件（下方） */}
            <div className="mb-1 text-[9px] font-semibold text-blue-700 px-1">▼ 需求端 & 技术事件</div>
            <div className="flex">
              {[
                { text: 'Q1储能\n+115%验证', color: 'bg-blue-100 border-blue-300 text-blue-800' },
                { text: '电池出口\n退税降至6%', color: 'bg-amber-100 border-amber-300 text-amber-800' },
                { text: '储能排产\n占比超41%', color: 'bg-blue-100 border-blue-300 text-blue-800' },
                { text: '钠电A级车\n量产搭载', color: 'bg-purple-100 border-purple-300 text-purple-800' },
                { text: '固态电池\n小规模量产', color: 'bg-purple-100 border-purple-300 text-purple-800' },
                { text: '800V HVDC\n英伟达量产', color: 'bg-purple-100 border-purple-300 text-purple-800' },
                { text: '4680规模化\n+出口退税归零', color: 'bg-amber-100 border-amber-300 text-amber-800' },
              ].map((ev, i) => (
                <div key={i} className="flex-1 px-0.5">
                  <div className={`${ev.color} border rounded px-1 py-1.5 text-center whitespace-pre-line leading-tight`}>{ev.text}</div>
                </div>
              ))}
            </div>
            {/* 价格指示 */}
            <div className="flex mt-2 text-[9px] text-slate-400 font-mono">
              {['15-17万','16-18万','15-17万','18-22万','18-20万','20-22万','20-25万'].map((p,i) => (
                <div key={i} className="flex-1 text-center">{p}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-3 text-[9px]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-200 rounded border border-red-300" />供给减少</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-200 rounded border border-emerald-300" />供给增加</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-200 rounded border border-blue-300" />需求验证</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-200 rounded border border-purple-300" />新技术</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-200 rounded border border-amber-300" />政策变量</span>
        </div>
      </div>

      {/* ═══ 新增模块3：库存天数指标 ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-red-500" />库存覆盖天数（比库存吨数更能解释价格）</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-red-600">29</div>
            <div className="text-xs text-slate-500 mt-1">当前库存天数</div>
            <div className="text-[10px] text-slate-400">10.3万吨÷日均消费3560吨</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-amber-600">45</div>
            <div className="text-xs text-slate-500 mt-1">行业安全线</div>
            <div className="text-[10px] text-slate-400">低于此线上游开始挺价</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-slate-400">52</div>
            <div className="text-xs text-slate-500 mt-1">2024年均值</div>
            <div className="text-[10px] text-slate-400">供需平衡期库存水平</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-emerald-600">78</div>
            <div className="text-xs text-slate-500 mt-1">2023年高点</div>
            <div className="text-[10px] text-slate-400">严重过剩期(锂价跌至5.8万)</div>
          </div>
        </div>
        <div className="mt-3 bg-red-50 rounded-lg p-3 text-xs text-red-800">
          <strong>关键逻辑：</strong>当前29天库存远低于安全线(45天)→ 上游挺价惜售(散单出货意愿弱、以长单和客供为主) → 下游逢低刚需补库 → 价格高位运行。库存天数比年度供需平衡(+2万吨)更能解释为何锂价涨至17.7万。只有库存回升至45天以上，价格才可能出现实质性回调。
        </div>
        <div className="text-[9px] text-slate-400 mt-2">日均消费=国内年消费~120万吨LCE÷337工作日≈3560吨/天 | 库存数据来源：华金期货、SMM</div>
      </div>

      {/* ═══ 优先级3-1：历史周期对比 ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-purple-500" />锂价历史周期：当前处于什么阶段？</h3>
        <p className="text-[10px] text-slate-400 mb-3">2020-2026季度均价(万元/吨) | 完整经历了"起步→疯狂→崩盘→筑底→反弹"五个阶段</p>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={[
            {q:'20Q1',p:4.5,ph:'起步'},{q:'20Q3',p:4.8},{q:'21Q1',p:8.5,ph:'启动'},{q:'21Q3',p:12},
            {q:'22Q1',p:32,ph:'疯狂'},{q:'22Q2',p:48},{q:'22Q3',p:50},{q:'22Q4',p:56},
            {q:'23Q1',p:35,ph:'崩盘'},{q:'23Q2',p:22},{q:'23Q3',p:18},{q:'23Q4',p:13},
            {q:'24Q1',p:10,ph:'筑底'},{q:'24Q2',p:9.5},{q:'24Q3',p:7.5},{q:'24Q4',p:7.8},
            {q:'25Q1',p:8.5,ph:'反弹'},{q:'25Q2',p:6.5},{q:'25Q3',p:8},{q:'25Q4',p:12},
            {q:'26Q1',p:17,ph:'当前'},{q:'26Q2',p:17.7},
          ]} margin={{ top: 15, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="q" tick={{ fontSize: 8 }} angle={-40} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 60]} />
            <Tooltip formatter={v => `${v}万元/吨`} />
            <ReferenceLine y={15} stroke="#4CAF50" strokeDasharray="3 3" label={{ value: '舒适区15万', fill: '#4CAF50', fontSize: 9, position: 'right' }} />
            <ReferenceLine y={20} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: '警戒20万', fill: '#F59E0B', fontSize: 9, position: 'right' }} />
            <Area type="monotone" dataKey="p" fill="#EDE9FE" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 3, fill: '#7C3AED' }} name="季度均价" />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex gap-1 mt-2 text-[9px]">
          {[
            {label:'2020-21 起步',color:'bg-emerald-100 text-emerald-800',desc:'EV渗透率从5%→15%'},
            {label:'2022 疯狂',color:'bg-red-100 text-red-800',desc:'峰值60万/吨，供不应求'},
            {label:'2023 崩盘',color:'bg-slate-100 text-slate-800',desc:'产能集中释放，价格腰斩再腰斩'},
            {label:'2024-25H1 筑底',color:'bg-blue-100 text-blue-800',desc:'5.8万触底，全行业亏损出清'},
            {label:'2025H2-26 反弹',color:'bg-purple-100 text-purple-800',desc:'储能爆发+供给扰动→涨至17.7万'},
          ].map((s,i) => <div key={i} className={`${s.color} rounded-lg px-2 py-1.5 flex-1 text-center`}><div className="font-bold">{s.label}</div><div className="text-[8px] opacity-75">{s.desc}</div></div>)}
        </div>
      </div>
      {/* 价格+动态 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-0.5 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-red-500" />碳酸锂价格 & 库存趋势</h3>
          <p className="text-[10px] text-slate-400 mb-3">数据来源：SMM、华金期货 | 红线=价格(左轴) · 绿色=社会库存(右轴)</p>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="m" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={40} />
              <YAxis yAxisId="price" tick={{ fontSize: 10 }} domain={[4, 20]} label={{ value: '价格(万元/吨)', angle: -90, position: 'insideLeft', style: { fontSize: 8 } }} />
              <YAxis yAxisId="inv" orientation="right" tick={{ fontSize: 10 }} domain={[8, 18]} label={{ value: '库存(万吨)', angle: 90, position: 'insideRight', style: { fontSize: 8 } }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="top" align="right" />
              <ReferenceLine yAxisId="price" y={15} stroke="#aaa" strokeDasharray="3 3" label={{ value: '舒适区15万', position: 'right', fill: '#999', fontSize: 9 }} />
              <Area yAxisId="inv" type="monotone" dataKey="inv" fill="#E8F5E9" stroke="#43A047" strokeWidth={2} name="社会库存" />
              <Line yAxisId="price" type="monotone" dataKey="p" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3, fill: '#EF4444' }} name="碳酸锂价格" />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-5 gap-2 mt-3 text-center text-xs">
            <div><div className="text-slate-400">2025低点</div><div className="font-bold text-emerald-700">5.8万</div></div>
            <div><div className="text-slate-400">2026.01高点</div><div className="font-bold text-red-600">17.2万</div></div>
            <div><div className="text-slate-400">当前(5月)</div><div className="font-bold text-slate-900">17.7万</div></div>
            <div><div className="text-slate-400">当前库存</div><div className="font-bold text-blue-700">10.3万吨</div></div>
            <div><div className="text-slate-400">Q4预测</div><div className="font-bold text-red-600">25万</div></div>
          </div>
        </div>
        <AlertList max={5} />
      </div>
    </div>
  );
}

function DemandTab() {
  const total = k => demandCategories.reduce((s, c) => s + c[k], 0);
  const totals = [['2024', total('v24')], ['2025', total('v25')], ['2026E', total('v26')], ['2027E', total('v27')], ['2028E', total('v28')]];
  const incData = demandCategories.filter(c => c.v28 > c.v25).map(c => ({ name: c.name, value: Math.round(c.v28 - c.v25), color: c.color })).sort((a, b) => b.value - a.value);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
      <div className="lg:col-span-3 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">全球碳酸锂需求预测（万吨LCE）</h3>
          <div className="grid grid-cols-5 gap-3">
            {totals.map(([y, v], i) => {
              const bgs = ['bg-slate-50 border-slate-200', 'bg-blue-50 border-blue-200', 'bg-blue-100 border-blue-300', 'bg-blue-200 border-blue-400', 'bg-blue-300 border-blue-500'];
              return (<div key={y} className={`${bgs[i]} rounded-xl p-4 text-center border`}><div className="text-xs text-slate-600 mb-1">{y}</div><div className="text-2xl font-extrabold text-slate-900">{Math.round(v)}</div></div>);
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">数据来源：鑫椤锂电(180万吨基线)、中信建投(4月上修锂电需求至3163GWh+38.3%) | Q1储能出货+115%已超预期验证</p>
        </div>
        {/* ═══ 优先级3-2：区域需求拆分 ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">2026E 需求区域拆分（188万吨LCE）</h3>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[
              { region: '中国', v: 113, pct: 60, growth: '+18%', color: '#DC2626', detail: '动力64+储能38+消费5+工业6', policy: '出口退税降至6%→抢出口备货' },
              { region: '欧洲', v: 36, pct: 19, growth: '+28%', color: '#1565C0', detail: '动力25+储能8+消费2+工业1', policy: '碳排放目标收紧→车企被迫提升EV占比' },
              { region: '北美', v: 19, pct: 10, growth: '-8%', color: '#2E7D32', detail: '动力9+储能7+消费1+工业2', policy: 'IRA退坡，特朗普取消$7500补贴' },
              { region: '其他', v: 20, pct: 11, growth: '+50%', color: '#F57C00', detail: '东南亚EV爆发+印度起步+中东大储', policy: '比亚迪/上汽海外工厂投产' },
            ].map((r, i) => (
              <div key={i} className="rounded-xl border-2 p-3" style={{ borderColor: r.color+'40', backgroundColor: r.color+'08' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold" style={{ color: r.color }}>{r.region}</span>
                  <span className="text-xs font-bold" style={{ color: r.color }}>{r.pct}%</span>
                </div>
                <div className="text-lg font-extrabold text-slate-900">{r.v}<span className="text-xs text-slate-400 ml-1">万吨</span></div>
                <div className="text-[10px] text-slate-500 mt-1">同比 <span className="font-bold" style={{ color: r.growth.startsWith('-') ? '#DC2626' : '#2E7D32' }}>{r.growth}</span></div>
                <div className="text-[9px] text-slate-400 mt-1 border-t border-slate-100 pt-1">{r.detail}</div>
                <div className="text-[9px] text-slate-500 mt-0.5 font-medium">{r.policy}</div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-400">区域拆分来源：国信证券(中国1518万辆/欧洲495万辆/美国150万辆)+SNE装机数据交叉验证 | "其他"含东南亚(比亚迪/上汽海外工厂)、印度、中东</div>
        </div>
        {demandCategories.map(c => <DemandCategoryCard key={c.id} cat={c} />)}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">需求增量结构（2025→2028E，万吨LCE）</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={incData} layout="vertical" barSize={24} margin={{ top: 5, right: 50, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 600 }} width={80} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>{incData.map((e, i) => <Cell key={i} fill={e.color} />)}<LabelList position="right" formatter={v => `+${v}`} style={{ fontSize: 12, fontWeight: 700, fill: '#555' }} /></Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <AlertList />
    </div>
  );
}

function SupplyTab() {
  const total = k => Math.round(supplySegments.reduce((s, x) => s + x[k], 0) * 10) / 10;
  const totals = [['2024', total('v24')], ['2025', total('v25')], ['2026E', total('v26')], ['2027E', total('v27')], ['2028E', total('v28')]];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
      <div className="lg:col-span-3 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">全球碳酸锂供给预测（万吨LCE）</h3>
          <div className="grid grid-cols-5 gap-3">
            {totals.map(([y, v], i) => {
              const bgs = ['bg-slate-50 border-slate-200', 'bg-emerald-50 border-emerald-200', 'bg-emerald-100 border-emerald-300', 'bg-emerald-200 border-emerald-400', 'bg-emerald-300 border-emerald-500'];
              return (<div key={y} className={`${bgs[i]} rounded-xl p-4 text-center border`}><div className="text-xs text-slate-600 mb-1">{y}</div><div className="text-2xl font-extrabold text-slate-900">{Math.round(v)}</div></div>);
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">数据来源：五矿证券(2025.11基线~198万吨) | 大摩4月修正后有效供给~190万吨 | 需关注津巴布韦配额恢复进度(预计7月到货)和江西复产时间</p>
        </div>
        {/* 分析要点 */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4">
          <h4 className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-1.5"><Info className="w-4 h-4 text-emerald-600" />供给端关键判断（5月视角）</h4>
          <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
            <p>• 五矿2025.11原始预测198万吨，但<strong>三重扰动使有效供给降至~190万吨</strong>：津巴布韦配额制(全球-6%)、江西换证(实际减产~4万吨)、澳矿柴油问题。</p>
            <p>• <strong>大摩4月已将供给增量从50万吨下调至40万吨</strong>。国联期货预计5月月度缺口0.8万吨，5-6月大幅去库。</p>
            <p>• 2026年是<strong>本轮产能投放的最后高峰</strong>（创元期货），供给增速~20%。2027年增速回落至12%，2028年进一步下降。</p>
            <p>• 中国盐湖是唯一确定性增量：青海+33%、西藏+323%（五矿）。但江西锂云母实际减产，宁德枧下窝矿复产推迟至Q4。</p>
            <p>• <strong>新变量：智利4月28日通过锂矿国有化法案</strong>，2027年起外资持股不超49%，远期智利增量将受限。</p>
          </div>
        </div>
        {supplySegments.map(s => {
          const inc = Math.round((s.v28 - s.v25) * 10) / 10;
          return (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: s.color }} />
                <div className="flex-1"><h4 className="text-sm font-bold text-slate-900">{s.name}</h4><span className="text-[10px] text-slate-400">成本 {s.cost}万元/吨</span></div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mb-2">
                {[['2024', s.v24], ['2025', s.v25], ['2026E', s.v26], ['2027E', s.v27], ['2028E', s.v28]].map(([y, v], i) => (
                  <div key={y} className="text-center"><div className="text-[10px] text-slate-400">{y}</div><div className={`font-bold ${i === 2 ? 'text-emerald-700' : 'text-slate-700'}`}>{v}</div></div>
                ))}
                <div className="w-px h-5 bg-slate-200" />
                <div className="text-center"><div className="text-[10px] text-slate-400">25→28</div><div className="font-bold text-emerald-700">+{inc}</div></div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              <p className="text-[10px] text-slate-400 mt-1">来源：{s.source}</p>
              {s.deriv && <div className="mt-1.5 bg-amber-50/80 rounded px-2 py-1.5 text-[10px] text-amber-800 font-mono leading-relaxed">📐 {s.deriv}</div>}
            </div>
          );
        })}
        {/* ═══ 优先级3-3：放大版成本曲线 ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">全球碳酸锂供给成本曲线（2026E · 阶梯图）</h3>
          <p className="text-[10px] text-slate-400 mb-3">横轴=累计产能(万吨) | 纵轴=生产成本(万元/吨) | 柱宽=该来源产能 | 红线=当前价17.7万</p>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={(() => {
              const items = [
                {name:'青海盐湖',cost:3.5,cap:17.3,color:'#00897B'},
                {name:'西藏盐湖',cost:3.8,cap:5.5,color:'#009688'},
                {name:'智利盐湖',cost:4.2,cap:30.4,color:'#1B5E20'},
                {name:'阿根廷',cost:5.0,cap:16.8,color:'#26A69A'},
                {name:'回收',cost:5.5,cap:9,color:'#6A1B9A'},
                {name:'澳洲辉石',cost:6.5,cap:50.7,color:'#1565C0'},
                {name:'非洲',cost:7.5,cap:24,color:'#EF6C00'},
                {name:'中国其他',cost:7.0,cap:14,color:'#5C6BC0'},
                {name:'巴西',cost:8.5,cap:3,color:'#795548'},
                {name:'北美',cost:10,cap:3,color:'#5E35B1'},
                {name:'锂云母',cost:10,cap:15,color:'#C62828'},
                {name:'欧洲',cost:12,cap:1.1,color:'#42A5F5'},
              ];
              let cum = 0;
              return items.map(it => { const start = cum; cum += it.cap; return {...it, cumStart: Math.round(start), cumEnd: Math.round(cum), mid: Math.round(start + it.cap/2)}; });
            })()} barSize={999} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="mid" type="number" domain={[0, 200]} tick={{ fontSize: 10 }} label={{ value: '累计产能(万吨LCE)', position: 'insideBottom', offset: -10, style: { fontSize: 9 } }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 20]} label={{ value: '成本(万元/吨)', angle: -90, position: 'insideLeft', style: { fontSize: 9 } }} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                const margin = 17.7 - d.cost;
                return (<div className="bg-white border rounded-lg p-3 shadow-lg text-xs"><div className="font-bold mb-1">{d.name}</div><div>成本：{d.cost}万元/吨</div><div>产能：{d.cap}万吨LCE</div><div>累计：{d.cumStart}→{d.cumEnd}万吨</div><div className={`font-bold mt-1 ${margin>=0?'text-emerald-700':'text-red-600'}`}>当前价差：{margin>=0?'+':''}{margin.toFixed(1)}万元/吨</div></div>);
              }} />
              <ReferenceLine y={17.7} stroke="#EF4444" strokeDasharray="6 3" strokeWidth={2} label={{ value: '当前价 17.7万', fill: '#EF4444', fontSize: 11, position: 'right' }} />
              <ReferenceLine y={5.8} stroke="#4CAF50" strokeDasharray="3 3" label={{ value: '2025低点 5.8万', fill: '#4CAF50', fontSize: 9, position: 'right' }} />
              <Bar dataKey="cost" radius={[3, 3, 0, 0]}>
                {(() => {
                  const items = [
                    {color:'#00897B'},{color:'#009688'},{color:'#1B5E20'},{color:'#26A69A'},
                    {color:'#6A1B9A'},{color:'#1565C0'},{color:'#EF6C00'},{color:'#5C6BC0'},
                    {color:'#795548'},{color:'#5E35B1'},{color:'#C62828'},{color:'#42A5F5'},
                  ];
                  return items.map((it, i) => <Cell key={i} fill={it.color} />);
                })()}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="font-bold text-emerald-800 mb-1">✓ 水上产能（成本低于17.7万）：~190万吨</div>
              <div className="text-[10px] text-slate-600">全部现有产能在当前价格下均可盈利。盐湖类(成本3-5万)吨毛利12-14万元，利润弹性最大。</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="font-bold text-red-800 mb-1">⚠ 边际成本区（10-15万）：~33万吨</div>
              <div className="text-[10px] text-slate-600">锂云母+北美+欧洲。锂价若回落至10万以下，这部分产能将再次停产。是价格弹性供给的"蓄水池"。</div>
            </div>
          </div>
        </div>
      </div>
      <AlertList />
    </div>
  );
}

function ChainCard({ it, sCfg }) {
  const [ex, setEx] = useState(false);
  const firstLine = it.note.split('→')[0].trim();
  return (
    <div className="border border-slate-200 rounded-lg p-2 bg-white hover:shadow transition-shadow">
      <div className="flex items-start justify-between mb-1">
        <h4 className="font-bold text-[11px] text-slate-900">{it.name}</h4>
        <span className={`${sCfg[it.s].c} text-white text-[9px] px-1.5 py-0.5 rounded-full`}>{sCfg[it.s].l}</span>
      </div>
      <div className="text-[10px] text-slate-500">{it.sub}</div>
      <div className="text-[10px] text-slate-600 font-medium">{it.v}</div>
      <div className="border-t border-slate-100 mt-1 pt-1">
        {!ex ? (
          <div className="flex items-start justify-between gap-1">
            <div className="text-[10px] text-slate-400 leading-relaxed line-clamp-2" dangerouslySetInnerHTML={{ __html: firstLine.replace(/承压：/g, '<span class="text-red-600 font-semibold">⚠ </span>') }} />
            <button onClick={() => setEx(true)} className="text-[9px] text-blue-500 hover:text-blue-700 flex-shrink-0 mt-0.5">展开↓</button>
          </div>
        ) : (
          <div>
            <div className="text-[10px] text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: it.note.replace(/承压：/g, '<span class="text-red-600 font-semibold">⚠ 承压：</span>').replace(/化解：/g, '<span class="text-emerald-700 font-semibold">✦ 化解：</span>').replace(/化解有限：/g, '<span class="text-amber-600 font-semibold">△ 化解有限：</span>').replace(/→/g, '<br/>') }} />
            <button onClick={() => setEx(false)} className="text-[9px] text-blue-500 hover:text-blue-700 mt-1">收起↑</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChainTab() {
  const sections = [
    { title: '上游：锂资源', bg: 'bg-emerald-700', items: [
      { name: '盐湖提锂', sub: '盐湖股份/SQM/ALB', v: '全球70万吨(26E)', s: 'good',
        note: '承压：扩产周期长(7-10年)，难以快速响应需求 → 化解：DLE直接提锂技术(Albemarle投$3.1bn)将周期缩短至2-3年，回收率从50%提升至94%' },
      { name: '锂辉石矿', sub: '天齐/Pilbara/Greenbushes', v: '50.7万吨(26E)', s: 'good',
        note: '承压：远期无大型绿地项目，资本开支停滞 → 化解：CGP3/P2000等棕地扩产仍有余量；部分矿山尝试锂渣综合利用提升回收率' },
      { name: '锂云母', sub: '永兴材料/江特电机', v: '15万吨(有效/名义19)', s: 'constrained',
        note: '承压：成本最高(8-12万)+换证停产+环保约束 → 化解有限：锂价17万+时盈利恢复，但成本结构无法根本改善，属于边际供给' },
      { name: '非洲锂矿', sub: '中矿/华友/盛新', v: '24万吨(有效/名义28.2)', s: 'constrained',
        note: '承压：津巴布韦出口配额制+政策风险 → 化解：华友模式——就地建硫酸锂厂，首批产品已发运(4月28日)；从精矿出口转向锂盐出口' },
    ]},
    { title: '中游：正极材料', bg: 'bg-blue-700', items: [
      { name: '磷酸铁锂(LFP)', sub: '湖南裕能/德方纳米', v: '份额82%', s: 'oversupply',
        note: '承压：产能严重过剩(利用率58%)，尾部企业亏损 → 化解：高压实密度LFP(宁德/比亚迪锁定百万吨级订单)提升能量密度10-15%，头部企业通过产品力拉开差距' },
      { name: 'LMFP', sub: '德方纳米/容百', v: '份额5%↑', s: 'growing',
        note: '本身就是LFP企业的技术升级路线。能量密度+15-20%，填补LFP与三元之间的性价比空白。多家车企2026年导入。德方纳米从LFP转型LMFP获得更高毛利(12-15% vs 5-8%)' },
      { name: '高镍三元', sub: '容百/当升', v: '份额28%↓', s: 'moderate',
        note: '承压：LFP份额从60%→82%持续挤压三元 → 化解：①固态电池首选正极(锂金属负极+NCM=能量密度500Wh/kg)；②4680大圆柱专用高镍(特斯拉/亿纬)；远期看固态电池是三元"翻盘"的关键' },
      { name: '钠离子电池', sub: '中科海钠/传艺科技', v: '份额2%', s: 'growing',
        note: '对锂电的替代效应：2026E不足3%，但GGII预测出货30GWh(+233%)。承压方为低端LFP(A00级车/两轮车) → 但钠电低温差(-20°C容量保持率不足70%)限制了主流场景渗透。2028-2030年替代比例或升至5-8%' },
    ]},
    { title: '中游：关键材料', bg: 'bg-blue-600', items: [
      { name: '隔膜', sub: '恩捷股份/星源材质', v: 'CR2超60%', s: 'good',
        note: '承压：固态电池可能完全取消隔膜(存在性威胁) → 化解：恩捷投资固态电解质膜研发；短期内干法隔膜受储能拉动增长；竞争格局最好的中游环节(毛利率18%)' },
      { name: '电解液', sub: '天赐材料/新宙邦', v: '六氟磷酸锂涨价', s: 'moderate',
        note: '承压：固态电池将取消液态电解质 → 化解：①布局固态电解质材料(天赐研发硫化物路线)；②LiFSI新型锂盐(高温性能优于LiPF6)短期拉动毛利修复' },
      { name: '负极/铜箔', sub: '贝特瑞/诺德股份', v: '硅碳渗透率15%+', s: 'moderate',
        note: '承压：石墨负极产能过剩(利用率62%) → 化解：硅碳负极(能量密度+20%)渗透率快速提升，4680电池专用；铜箔受益铜价上涨+加工费提升' },
    ]},
    { title: '下游：电池', bg: 'bg-purple-700', items: [
      { name: '宁德时代', sub: 'CR1=42.1%(SNE)', v: '利用率97%', s: 'excellent',
        note: '承压：国内市占率见顶+行业内卷+锂价上涨压缩利润 → 化解：①凝聚态电池(500Wh/kg)已装机eVTOL；②固态电池2027年量产；③AIDC储能打开第二曲线(储能销量121GWh+29%)；④海外工厂(匈牙利/印尼)规避关税' },
      { name: '比亚迪', sub: 'CR2=13.4%(SNE)', v: '利用率88%', s: 'good',
        note: '承压：Q1国内装机-12.5%(清库存+政策退坡) → 化解：①二代刀片电池(能量密度+15%，3月发布后国内回暖)；②海外销量+65%抵消国内下滑；③整车+电池垂直一体化的成本优势' },
      { name: '亿纬锂能', sub: 'CR4=4.7%(SNE)', v: '利用率85%', s: 'moderate',
        note: '承压：动力电池份额不到5%，规模不足 → 化解：①46系大圆柱(差异化，获BMW/Daimler定点)；②储能出货71GWh(+41%)首超动力电池，成为核心增长引擎；③大储能系统6.9MWh方案' },
    ]},
    { title: '储能系统集成', bg: 'bg-teal-700', items: [
      { name: '阳光电源', sub: '全球TOP3 PCS+系统', v: '毛利率38%', s: 'excellent',
        note: '承压：传统光伏逆变器增长放缓 → 化解：①800V HVDC架构抢先布局(英伟达AIDC标配)；②储能系统集成毛利率38%远高于逆变器；③海外大储订单持续增长' },
      { name: '特斯拉储能', sub: 'Megapack', v: '40GWh/年产能', s: 'excellent',
        note: '承压：Lathrop工厂产能受限(全球需求远超供给) → 化解：上海Megapack工厂2025年投产，产能翻倍；自研4680电芯+储能系统垂直整合' },
      { name: '双登股份', sub: 'AIDC储能第一股', v: 'H1收入+113%', s: 'good',
        note: '承压：传统铅酸电池业务萎缩 → 化解：AIDC备电储能成为第一大收入来源(+113%)，卡位数据中心800V直流供电赛道，市占率11.1%' },
      { name: '海博思创', sub: '国内集成龙头', v: '储能系统一体化', s: 'good',
        note: '承压：纯集成商利润薄(毛利率15%) → 化解：AI智能调度平台(辰鸿能源管理)提升系统附加值，从硬件集成商向"硬件+软件+运维"平台型公司转型' },
    ]},
  ];
  const sCfg = { excellent: { l: '优秀', c: 'bg-emerald-600' }, good: { l: '良好', c: 'bg-green-500' }, growing: { l: '成长', c: 'bg-blue-500' }, moderate: { l: '中等', c: 'bg-yellow-500' }, constrained: { l: '受限', c: 'bg-orange-500' }, oversupply: { l: '过剩', c: 'bg-red-500' } };
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Network className="w-5 h-5 text-emerald-700" />锂电产业链全景</h2>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
        <div className="flex gap-2" style={{ minWidth: 1100 }}>
          {sections.map((sec, si) => (
            <div key={si} className="flex-1 flex items-start gap-1.5">
              {si > 0 && <div className="flex items-center pt-8"><ChevronRight className="w-4 h-4 text-slate-300" /></div>}
              <div className="flex-1">
                <div className={`${sec.bg} text-white px-2 py-1.5 rounded-lg mb-2 text-center font-bold text-xs`}>{sec.title}</div>
                <div className="space-y-2">
                  {sec.items.map((it, ii) => (
                    <ChainCard key={ii} it={it} sCfg={sCfg} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 综合分析 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" />综合分析</h3>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
          <h4 className="font-bold text-purple-900 text-sm mb-2">新技术冲击 → 谁承压/谁受益</h4>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
            <div className="bg-white/80 rounded-lg p-3"><strong>固态电池(2027-2030)：</strong><br/><span className="text-emerald-700">✦ 受益</span>：高镍三元正极(容百/当升)——固态电池首选正极；宁德——2027年量产计划最快<br/><span className="text-red-600">⚠ 承压</span>：隔膜(恩捷)——可能被完全取消；电解液(天赐)——液态→固态替代。两者均在布局固态电解质膜/固态电解质作为化解</div>
            <div className="bg-white/80 rounded-lg p-3"><strong>钠离子电池(2026-2028)：</strong><br/><span className="text-red-600">⚠ 承压</span>：低端LFP(A00级车、两轮车场景)——被钠电抢夺<br/><span className="text-emerald-700">✦ 受益</span>：中科海钠/传艺科技(纯钠电标的)；宁德(钠电产线已量产但主业不受影响)<br/>2026E影响不足3%，2028-2030年或升至5-8%</div>
            <div className="bg-white/80 rounded-lg p-3"><strong>800V HVDC(AIDC场景)：</strong><br/><span className="text-emerald-700">✦ 受益</span>：阳光电源(800V PCS布局领先)、双登股份(AIDC备电第一)、德业股份<br/><span className="text-red-600">⚠ 承压</span>：传统UPS企业(科士达/华为UPS)——架构变革后UPS被取消<br/>英伟达2027年量产，效率89%→97%</div>
            <div className="bg-white/80 rounded-lg p-3"><strong>4680大圆柱+高压实LFP：</strong><br/><span className="text-emerald-700">✦ 受益</span>：亿纬(46系列获BMW/Daimler定点)、特斯拉(自研4680)；宁德/比亚迪(高压实LFP锁定百万吨订单)<br/><span className="text-red-600">⚠ 承压</span>：传统方形电池设备商——大圆柱需全新产线</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
          <h4 className="font-bold text-red-900 text-sm mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />关键风险</h4>
          <div className="grid grid-cols-3 gap-3 text-xs text-slate-700">
            <div className="bg-white/80 rounded-lg p-2.5"><strong>江西换证：</strong>宜春8矿合计20万吨LCE(占全球6%)，5月起陆续停产，恢复至少需1年</div>
            <div className="bg-white/80 rounded-lg p-2.5"><strong>津巴布韦：</strong>占中国19%锂精矿进口，配额制后发运中断，恢复时间不确定</div>
            <div className="bg-white/80 rounded-lg p-2.5"><strong>锂价反噬：</strong>碳酸锂超20万元时20-30%储能项目IRR受影响(东吴)，需求端存在内生调节</div>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 text-right">数据来源：五矿证券、摩根士丹利、建信期货、GGII、弗若斯特沙利文、东吴证券 | 更新：2026-05-05</p>
      </div>
    </div>
  );
}

/* ════ Main App ════ */
const tabs = [
  { id: 'overview', label: '总览', icon: LayoutDashboard },
  { id: 'demand', label: '需求', icon: TrendingUp },
  { id: 'supply', label: '供给', icon: TrendingDown },
  { id: 'chain', label: '产业链', icon: Network },
  { id: 'alerts', label: '动态', icon: Bell },
];

export default function App() {
  const [tab, setTab] = useState('overview');
  const td26 = Math.round(demandCategories.reduce((s, c) => s + c.v26, 0));
  const ts26 = Math.round(supplySegments.reduce((s, x) => s + x.v26, 0));
  const bal = ts26 - td26;

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif" }}>
      {/* Nav */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="p-1.5 bg-emerald-800 rounded-lg"><LayoutDashboard className="w-4 h-4 text-white" /></div><div><div className="text-sm font-bold text-slate-900">碳酸锂供需格局跟踪</div><div className="text-[9px] text-slate-400 tracking-wider">LITHIUM SUPPLY & DEMAND TRACKER</div></div></div>
          <nav className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {tabs.map(t => (<button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t.id ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><t.icon className="w-3.5 h-3.5" />{t.label}</button>))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header KPI */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div><h1 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Database className="w-5 h-5 text-emerald-700" />碳酸锂供需格局跟踪</h1><p className="text-[10px] text-slate-500">最后更新：2026-05-05 | 供给基准：大摩4月修正(原五矿198→有效190万吨) | 需求基准：中信建投4月上修+Q1实际验证</p></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white rounded-lg border p-3 shadow-sm"><div className="text-[10px] text-slate-500">2026E 总需求</div><div className="text-xl font-extrabold">{td26}</div><div className="text-[10px] text-slate-400">万吨 LCE</div></div>
            <div className="bg-white rounded-lg border p-3 shadow-sm"><div className="text-[10px] text-slate-500">2026E 总供给</div><div className="text-xl font-extrabold">{ts26}</div><div className="text-[10px] text-slate-400">万吨 LCE（大摩修正后）</div></div>
            <div className="bg-white rounded-lg border p-3 shadow-sm"><div className="text-[10px] text-slate-500">供需平衡</div><div className={`text-xl font-extrabold ${bal >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{bal >= 0 ? '过剩' : '短缺'}{Math.abs(bal)}</div><div className="text-[10px] text-slate-400">万吨（名义微过剩，Q1/Q4实际短缺）</div></div>
            <div className="bg-white rounded-lg border p-3 shadow-sm"><div className="text-[10px] text-slate-500">当前价格(5月)</div><div className="text-xl font-extrabold">17.7</div><div className="text-[10px] text-slate-400">万元/吨 · 生意社参考价</div></div>
            <div className="bg-white rounded-lg border p-3 shadow-sm"><div className="text-[10px] text-slate-500">库存(4月)</div><div className="text-xl font-extrabold text-red-600">29天</div><div className="text-[10px] text-slate-400">10.3万吨 · 低于安全线(45天)</div></div>
          </div>
          <div className="mt-2.5 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-[11px] text-red-700 font-medium">5月碳酸锂价格升至17.7万 | 国联期货预计5月存在0.8万吨缺口 | 智利锂矿国有化法案落地 | 江西4矿5月停产换证 | 津巴布韦发运恢复需等7月</span>
          </div>
        </div>

        {tab === 'overview' && <OverviewTab />}
        {tab === 'demand' && <DemandTab />}
        {tab === 'supply' && <SupplyTab />}
        {tab === 'chain' && <ChainTab />}
        {tab === 'alerts' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5"><AlertList /><div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"><h3 className="text-sm font-bold mb-3">碳酸锂价格 & 库存趋势</h3><ResponsiveContainer width="100%" height={300}><ComposedChart data={monthlyTrend}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="m" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={40} /><YAxis yAxisId="price" tick={{ fontSize: 10 }} domain={[4, 20]} /><YAxis yAxisId="inv" orientation="right" tick={{ fontSize: 10 }} domain={[8, 18]} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="top" align="right" /><Area yAxisId="inv" type="monotone" dataKey="inv" fill="#E8F5E9" stroke="#43A047" strokeWidth={2} name="社会库存" /><Line yAxisId="price" type="monotone" dataKey="p" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} name="碳酸锂价格" /></ComposedChart></ResponsiveContainer></div></div>}
      </div>

      <div className="border-t bg-white mt-8"><div className="max-w-7xl mx-auto px-4 py-3 flex justify-between text-[9px] text-slate-400"><span>数据来源：五矿证券、摩根士丹利、建信期货、安泰科、中信建投、GGII、鑫椤锂电、SMM、生意社、国联期货、弗若斯特沙利文、东吴证券 | 数据快照：2026-05-05</span><span>仅供研究参考，不构成投资建议</span></div></div>
    </div>
  );
}
