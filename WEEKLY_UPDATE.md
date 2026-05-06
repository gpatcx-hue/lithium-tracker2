# 碳酸锂供需跟踪 — 每周更新SOP

## 更新频率
每周一次（建议周日或周一），保持数据不超过7天延迟。

## 你需要做的事

### 1. 来找我说一句话
```
碳酸锂网站每周更新
```

### 2. 我会自动完成以下工作
- 搜索过去一周的碳酸锂行业动态（价格、政策、供需事件）
- 更新 `src/data/initialData.ts` 中的：
  - `lastUpdated` 日期
  - `monthlyTrend` 最新月度价格/库存数据
  - `alerts` 最新动态（新增本周事件，移除超过2个月的旧事件）
- 如有重大变化（如机构修正预测），同步更新：
  - `balanceHistory` 供需平衡预测
  - `demandSegments` / `supplySegments` 各细分数据
- 生成更新后的文件

### 3. 你拿到文件后
- 替换本地项目中的 `src/data/initialData.ts`
- `git add . && git commit -m "weekly update YYYY-MM-DD" && git push`
- Cloudflare Pages 自动构建部署（约1-2分钟）

## 重大更新触发条件（需要改数据+分析）
- 锂价单周涨跌幅 > 10%
- 新的机构研报修正供需预测
- 重大政策变动（出口禁令、国有化、补贴调整等）
- 季度实际数据出炉（如Q2储能出货量）

## 文件更新范围

| 更新类型 | 涉及文件 | 频率 |
|---------|---------|------|
| 价格/库存/动态 | `src/data/initialData.ts` | 每周 |
| 供需预测修正 | `src/data/initialData.ts` | 每月或有重大事件时 |
| 产业链分析 | `src/sections/IndustryChain.tsx` | 每季度 |
| 成本曲线 | `src/sections/CostCurve.tsx` | 每季度 |

## Cloudflare Pages 部署配置

| 配置项 | 值 |
|-------|-----|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node.js version | 20 |

## 数据来源清单（按优先级）

### 价格类
- SMM（上海有色网）— 现货价格基准
- 生意社 — 每日参考价
- 广期所 — 期货行情

### 供给类
- 五矿证券研报 — 全球供给分产区预测
- 摩根士丹利 — 供给修正和事件影响
- 国联/建信/创元期货 — 月度供需平衡

### 需求类
- 鑫椤锂电 — 锂电排产和出货量
- GGII — 储能和动力电池出货
- 中信建投 — 需求上修/下修

### 政策/事件类
- 21经济网 — 产业链深度报道
- 证券时报 — 上市公司动态
- 各省自然资源厅 — 矿权变更
