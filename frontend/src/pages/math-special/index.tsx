import React, { useState } from 'react';
import { Card, Tabs, Button, Space, Select, Modal, Tag, Collapse, message } from 'antd';
import { DownloadOutlined, EyeOutlined, CalculatorOutlined, BulbOutlined, BookOutlined, ReloadOutlined } from '@ant-design/icons';
import MainLayout from '../../components/layout/MainLayout';

const { Panel } = Collapse;

// ==================== 工具函数 ====================
const shuffle = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// ==================== 思维题数据 ====================
const thinkingProblems: Record<number, { category: string; problems: { title: string; content: string; answer: string }[] }[]> = {
  3: [
    { category: '找规律', problems: [
      { title: '数列规律', content: '找出规律：2, 5, 8, 11, __, __', answer: '14, 17（每次加3）' },
      { title: '图形规律', content: '○△□○△□○__□，空格应填什么？', answer: '△' },
      { title: '数字规律', content: '1, 4, 9, 16, __, __', answer: '25, 36（平方数）' },
      { title: '递增规律', content: '1, 2, 4, 7, 11, __', answer: '16（差值递增：1,2,3,4,5）' },
      { title: '交替规律', content: '2, 5, 3, 6, 4, 7, __, __', answer: '5, 8' },
    ]},
    { category: '和差问题', problems: [
      { title: '基本和差', content: '两数之和是20，差是4，求这两个数。', answer: '大数=(20+4)÷2=12，小数=(20-4)÷2=8' },
      { title: '应用题', content: '小明和小红共有45元，小明比小红多5元，各有多少元？', answer: '小明=25元，小红=20元' },
      { title: '三人和差', content: '甲乙丙三人共有60元，甲比乙多5元，乙比丙多5元，各有多少元？', answer: '乙=20元，甲=25元，丙=15元' },
    ]},
    { category: '年龄问题', problems: [
      { title: '年龄差不变', content: '哥哥今年15岁，弟弟今年10岁，几年后两人年龄之和是45岁？', answer: '(45-15-10)÷2=10年后' },
      { title: '年龄倍数', content: '爸爸今年40岁，儿子今年10岁，几年前爸爸是儿子的5倍？', answer: '约7年前' },
    ]},
    { category: '植树问题', problems: [
      { title: '两端都种', content: '一条路长100米，每隔5米种一棵树，两端都种，共需多少棵树？', answer: '100÷5+1=21棵' },
      { title: '两端不种', content: '一条路长100米，每隔5米种一棵树，两端不种，共需多少棵树？', answer: '100÷5-1=19棵' },
      { title: '环形植树', content: '一个圆形花坛周长50米，每隔5米种一棵花，共需多少棵？', answer: '50÷5=10棵' },
    ]},
    { category: '等量代换', problems: [
      { title: '图形代换', content: '○+○+△=25，○+△=15，求○和△各是多少？', answer: '○=10，△=5' },
      { title: '动物代换', content: '2只鸡=1只兔，3只兔=1只羊，1只羊=几只鸡？', answer: '1只羊=3只兔=6只鸡' },
    ]},
    { category: '排队问题', problems: [
      { title: '基本排队', content: '小明前面有5人，后面有8人，这排共有几人？', answer: '5+1+8=14人' },
      { title: '从前往后', content: '小红从前往后数第6个，从后往前数第8个，共有几人？', answer: '6+8-1=13人' },
    ]},
    { category: '图形计数', problems: [
      { title: '线段计数', content: '一条线段上有3个点（不含端点），共有多少条线段？', answer: '5+4+3+2+1=15条' },
      { title: '三角形计数', content: '一个三角形内部有2条从顶点出发的线，共形成多少个三角形？', answer: '3个' },
    ]},
    { category: '时间问题', problems: [
      { title: '钟表问题', content: '3点整时，时针和分针的夹角是多少度？', answer: '90度' },
      { title: '经过时间', content: '从上午8:30到下午2:15，经过了多长时间？', answer: '5小时45分钟' },
    ]},
  ],
  4: [
    { category: '鸡兔同笼', problems: [
      { title: '基本鸡兔同笼', content: '鸡和兔共20只，脚共56只，鸡兔各几只？', answer: '兔=8只，鸡=12只' },
      { title: '变式题', content: '5元和10元的纸币共8张，共60元，各几张？', answer: '10元=4张，5元=4张' },
      { title: '三轮车', content: '三轮车和轿车共10辆，轮子共34个，各有几辆？', answer: '轿车=4辆，三轮车=6辆' },
    ]},
    { category: '盈亏问题', problems: [
      { title: '一盈一亏', content: '小朋友分苹果，每人分5个剩3个，每人分6个少2个，几个小朋友？', answer: '人数=5人，苹果=28个' },
      { title: '双盈', content: '小朋友分糖，每人分8颗剩10颗，每人分10颗剩2颗，几人？', answer: '人数=4人，糖=42颗' },
    ]},
    { category: '行程问题', problems: [
      { title: '相遇问题', content: '甲乙两地相距240km，甲车每小时60km，乙车每小时40km，几小时相遇？', answer: '2.4小时' },
      { title: '追及问题', content: '甲每小时走5km，乙每小时走3km，乙先走2小时，甲几小时追上？', answer: '3小时' },
      { title: '往返问题', content: '去时每小时60km，回来每小时40km，求平均速度。', answer: '48km/h' },
    ]},
    { category: '周期问题', problems: [
      { title: '星期问题', content: '今天是星期三，100天后是星期几？', answer: '星期五' },
      { title: '彩旗问题', content: '按红黄蓝绿顺序排列，第50面是什么颜色？', answer: '黄色' },
    ]},
    { category: '逻辑推理', problems: [
      { title: '真假判断', content: '甲说乙在说谎，乙说丙在说谎，丙说甲和乙都在说谎。谁说真话？', answer: '乙说真话' },
      { title: '排名问题', content: '甲比乙高，丙比丁矮，乙比丙高，丁比甲高。谁最高？', answer: '丁最高' },
    ]},
    { category: '数阵图', problems: [
      { title: '三阶幻方', content: '将1-9填入3×3方格，使每行每列对角线之和相等，和是多少？', answer: '15' },
      { title: '数字填空', content: '在○中填入1-6，使每条线上三个数之和相等。', answer: '每条线和为12' },
    ]},
    { category: '枚举法', problems: [
      { title: '搭配问题', content: '3件上衣，4条裤子，有几种搭配方式？', answer: '3×4=12种' },
      { title: '路线问题', content: '从A到B有3条路，从B到C有2条路，从A经B到C有几种走法？', answer: '3×2=6种' },
    ]},
  ],
  5: [
    { category: '工程问题', problems: [
      { title: '合作完成', content: '甲单独做需10天，乙单独做需15天，合作几天完成？', answer: '6天' },
      { title: '分段合作', content: '甲乙合作3天后甲离开，乙单独做2天完成。验证。', answer: '(1/10+1/15)×3+1/15×2=1 ✓' },
    ]},
    { category: '浓度问题', problems: [
      { title: '稀释问题', content: '200克含盐10%的盐水，加多少水后变成5%？', answer: '加水200克' },
      { title: '混合问题', content: '20%盐水100克和10%盐水200克混合，浓度多少？', answer: '约13.3%' },
    ]},
    { category: '利润问题', problems: [
      { title: '基本利润', content: '成本100元，售价150元，利润率是多少？', answer: '50%' },
      { title: '打折问题', content: '商品标价200元，打8折后再打9折，最终价格？', answer: '144元' },
      { title: '亏本问题', content: '打7折亏24元，打9折赚16元，成本多少？', answer: '成本=164元' },
    ]},
    { category: '几何面积', problems: [
      { title: '组合图形', content: '正方形边长10cm，内部最大圆的面积？', answer: '78.5cm²' },
      { title: '阴影面积', content: '长方形长8cm宽6cm，内部最大半圆面积？', answer: '14.13cm²' },
    ]},
    { category: '数论问题', problems: [
      { title: '最大公因数', content: '求48和36的最大公因数。', answer: '12' },
      { title: '最小公倍数', content: '求6和8的最小公倍数。', answer: '24' },
      { title: '奇偶性', content: '1+2+3+...+100的和是奇数还是偶数？', answer: '偶数（5050）' },
    ]},
    { category: '比例问题', problems: [
      { title: '比例分配', content: '甲乙丙按2:3:5分配150元，各得多少？', answer: '甲=30，乙=45，丙=75' },
      { title: '正反比例', content: '速度一定，路程和时间成什么比例？', answer: '正比例' },
    ]},
    { category: '优化问题', problems: [
      { title: '烙饼问题', content: '锅里每次最多烙2张饼，每面3分钟，烙3张饼最少几分钟？', answer: '9分钟' },
      { title: '排队问题', content: '甲乙丙三人打水，用时1、3、5分钟，怎样安排等待时间最短？', answer: '甲→乙→丙，总等待=14分钟' },
    ]},
  ],
};

// ==================== 计算题生成 ====================
const generateCalculationProblems = (grade: number) => {
  const problems: { category: string; items: string[] }[] = [];

  // 四则混合运算 - 20题
  const mixProblems: string[] = [];
  for (let i = 0; i < 20; i++) {
    const type = randInt(1, 4);
    if (grade === 3) {
      if (type === 1) { const a = randInt(10, 99), b = randInt(10, 99), c = randInt(2, 9); mixProblems.push(`${a} + ${b} × ${c} =`); }
      else if (type === 2) { const a = randInt(100, 999), b = randInt(10, 99), c = randInt(2, 9); mixProblems.push(`${a} - ${b} × ${c} =`); }
      else if (type === 3) { const a = randInt(10, 99), b = randInt(2, 9), c = randInt(10, 99), d = randInt(2, 9); mixProblems.push(`${a} × ${b} + ${c} ÷ ${d} =`); }
      else { const a = randInt(100, 999), b = randInt(10, 99), c = randInt(10, 99); mixProblems.push(`(${a} - ${b}) × ${c % 9 + 1} =`); }
    } else if (grade === 4) {
      if (type === 1) { const a = randInt(100, 999), b = randInt(10, 99), c = randInt(2, 9); mixProblems.push(`${a} - (${b} + ${randInt(10, 99)}) × ${c} =`); }
      else if (type === 2) { const a = randInt(10, 99), b = randInt(10, 99); mixProblems.push(`${a} × ${b} + ${100 - a} × ${b} =`); }
      else if (type === 3) { const a = randInt(100, 999), b = randInt(10, 99); mixProblems.push(`(${a} + ${randInt(100, 999)}) × ${b % 8 + 2} =`); }
      else { const a = randInt(100, 999), b = randInt(10, 99); mixProblems.push(`${a} ÷ ${b % 9 + 2} + ${randInt(100, 999)} ÷ ${b % 9 + 2} =`); }
    } else {
      if (type === 1) { const a = randInt(10, 99) / 10, b = randInt(10, 99) / 10; mixProblems.push(`(${a} + ${b}) × (${randInt(10, 99) / 10} - ${randInt(10, 99) / 10}) =`); }
      else if (type === 2) { const a = randInt(100, 999) / 10, b = randInt(10, 30) / 10; mixProblems.push(`${a} ÷ ${b} - ${randInt(10, 99) / 10} × ${randInt(2, 5)} =`); }
      else if (type === 3) { const a = randInt(10, 99) / 10; mixProblems.push(`${a} × ${randInt(2, 5)} + ${randInt(10, 99) / 10} × ${randInt(2, 5)} =`); }
      else { const a = randInt(10, 99) / 10, b = randInt(10, 99) / 10; mixProblems.push(`(${a} + ${b}) × ${randInt(2, 5)} =`); }
    }
  }
  problems.push({ category: '四则混合运算', items: shuffle(mixProblems) });

  // 竖式计算 - 12题
  const verticalProblems: string[] = [];
  for (let i = 0; i < 12; i++) {
    const type = randInt(1, 3);
    if (grade === 3) {
      if (type === 1) verticalProblems.push(`${randInt(10, 99)} × ${randInt(2, 9)} =`);
      else if (type === 2) verticalProblems.push(`${randInt(100, 999)} ÷ ${randInt(2, 9)} =`);
      else verticalProblems.push(`${randInt(100, 999)} + ${randInt(100, 999)} =`);
    } else if (grade === 4) {
      if (type === 1) verticalProblems.push(`${randInt(1000, 9999)} × ${randInt(10, 99)} =`);
      else if (type === 2) verticalProblems.push(`${randInt(1000, 9999)} ÷ ${randInt(10, 99)} =`);
      else verticalProblems.push(`${randInt(1000, 9999)} + ${randInt(1000, 9999)} =`);
    } else {
      if (type === 1) verticalProblems.push(`${(randInt(10, 99) / 10).toFixed(1)} × ${(randInt(10, 99) / 10).toFixed(1)} =`);
      else if (type === 2) verticalProblems.push(`${(randInt(100, 999) / 10).toFixed(1)} ÷ ${(randInt(10, 99) / 10).toFixed(1)} =`);
      else verticalProblems.push(`${(randInt(100, 999) / 10).toFixed(1)} + ${(randInt(100, 999) / 10).toFixed(1)} =`);
    }
  }
  problems.push({ category: '竖式计算', items: shuffle(verticalProblems) });

  // 巧算 + 分数 - 10题
  let cleverProblems: string[] = [];
  if (grade <= 3) {
    cleverProblems = [
      '99 × 7 = (100-1)×7 = 693', '25 × 36 = 25 × 4 × 9 = 900',
      '125 × 8 = 1000', '999 × 6 = (1000-1)×6 = 5994',
      '25 × 44 = 25 × 4 × 11 = 1100', '125 × 32 = 125 × 8 × 4 = 4000',
      '99 × 99 = (100-1)×99 = 9801',
    ];
  } else {
    cleverProblems = [
      '99 × 7 = (100-1)×7 = 693', '25 × 36 = 25 × 4 × 9 = 900',
      '125 × 8 = 1000', '999 × 6 = (1000-1)×6 = 5994',
      '25 × 44 = 25 × 4 × 11 = 1100', '125 × 32 = 125 × 8 × 4 = 4000',
      '99 × 99 = (100-1)×99 = 9801', '9.9 × 7 = (10-0.1)×7 = 69.3',
      '2.5 × 4.4 = 2.5 × 4 × 1.1 = 11', '0.99 × 101 = (1-0.01)×101 = 99.99',
    ];
  }
  problems.push({ category: '巧算', items: shuffle(cleverProblems) });

  // 分数题 - 8题 (仅三年级)
  if (grade === 3) {
    const fractionProblems = [
      '½ + ½ =', '⅓ + ⅓ =', '¼ + ¼ =', '⅕ + ⅕ =',
      '1 - ½ =', '1 - ⅓ =', '1 - ¼ =', '⅖ + ⅖ =',
      '⅜ + ⅛ =', '⅚ - ⅙ =', '½ + ¼ =', '⅔ - ⅓ =',
    ];
    problems.push({ category: '分数计算', items: shuffle(fractionProblems) });
  }

  // 应用题 - 15题
  const appProblems: { title: string; content: string; answer: string }[] = [
    { title: '购物问题', content: '小明买了3支铅笔，每支2元，又买了一个笔记本15元，一共花了多少钱？', answer: '3×2+15=21元' },
    { title: '路程问题', content: '小红从家到学校要走15分钟，每分钟走60米，她家到学校有多远？', answer: '15×60=900米' },
    { title: '倍数问题', content: '果园里有苹果树24棵，梨树是苹果树的3倍，果园一共有多少棵树？', answer: '24+24×3=96棵' },
    { title: '平均数问题', content: '小明三次数学成绩分别是85分、92分、88分，平均每次考多少分？', answer: '(85+92+88)÷3≈88.3分' },
    { title: '剩余问题', content: '图书馆有故事书350本，借出128本，又还回来45本，现在有多少本？', answer: '350-128+45=267本' },
    { title: '购物问题', content: '书店促销，每本书原价25元，买4本送1本。小明要买5本书，最少花多少钱？', answer: '4×25=100元' },
    { title: '路程问题', content: '甲乙两地相距480千米，一辆汽车每小时行80千米，几小时到达？', answer: '480÷80=6小时' },
    { title: '工程问题', content: '修一条路，甲队每天修120米，乙队每天修150米，两队合修8天，共修多少米？', answer: '(120+150)×8=2160米' },
    { title: '面积问题', content: '一块长方形菜地，长25米，宽16米，每平方米收白菜8千克，共收多少千克？', answer: '25×16×8=3200千克' },
    { title: '倍数问题', content: '学校图书馆有科技书480本，故事书是科技书的2倍多50本，故事书有多少本？', answer: '480×2+50=1010本' },
    { title: '购物问题', content: '商场打折，一件衣服原价350元，先打8折，再用优惠券减30元，最终多少钱？', answer: '350×0.8-30=250元' },
    { title: '路程问题', content: '甲乙两车从相距360千米的两地同时出发相向而行，甲车60km/h，乙车40km/h，几小时相遇？', answer: '360÷(60+40)=3.6小时' },
    { title: '工程问题', content: '一项工程，甲单独做10天完成，乙单独做15天完成，两人合作几天完成？', answer: '1÷(1/10+1/15)=6天' },
    { title: '浓度问题', content: '有含盐20%的盐水300克，要变成含盐15%的盐水，需要加多少克水？', answer: '盐=60克，新总量=400克，加水=100克' },
    { title: '利润问题', content: '一件商品成本价120元，标价200元，打8折出售，利润率是多少？', answer: '售价=160元，利润率≈33.3%' },
  ];
  problems.push({ category: '应用题', items: shuffle(appProblems).map(p => `${p.title}：${p.content} | 答案：${p.answer}`) });

  return problems;
};

// ==================== 知识点 ====================
const knowledgePoints: Record<number, { category: string; points: { title: string; content: string }[] }[]> = {
  3: [
    { category: '数与代数', points: [
      { title: '万以内数的认识', content: '认识万以内的数，理解数位顺序' },
      { title: '两位数乘一位数', content: '从个位乘起，满十进一' },
      { title: '两位数除以一位数', content: '从高位除起，余数比除数小' },
      { title: '分数的初步认识', content: '把一个整体平均分成若干份' },
    ]},
    { category: '图形与几何', points: [
      { title: '长方形和正方形', content: '长方形面积=长×宽，正方形面积=边长×边长' },
      { title: '周长与面积', content: '周长是线段总长度，面积是图形大小' },
    ]},
  ],
  4: [
    { category: '数与代数', points: [
      { title: '大数的认识', content: '认识亿以内的数' },
      { title: '三位数乘两位数', content: '先乘个位，再乘十位，最后相加' },
      { title: '小数的初步认识', content: '小数是十进制分数的另一种表示形式' },
      { title: '运算律', content: '加法交换律、乘法交换律' },
    ]},
    { category: '图形与几何', points: [
      { title: '角的度量', content: '锐角、直角、钝角、平角、周角' },
      { title: '平行与垂直', content: '平行线永不相交，垂直线相交成90°' },
    ]},
  ],
  5: [
    { category: '数与代数', points: [
      { title: '小数乘除法', content: '先按整数算，再点小数点' },
      { title: '分数加减法', content: '同分母：分母不变；异分母：先通分' },
      { title: '方程', content: '含有未知数的等式叫方程' },
    ]},
    { category: '图形与几何', points: [
      { title: '多边形面积', content: '三角形面积=底×高÷2；梯形面积=(上底+下底)×高÷2' },
      { title: '体积', content: '长方体体积=长×宽×高；正方体体积=边长³' },
    ]},
  ],
};

// ==================== 试卷生成 ====================
const generateExamPaper = (grade: number) => {
  const gradeNames: Record<number, string> = { 3: '三年级', 4: '四年级', 5: '五年级' };
  const calcs = generateCalculationProblems(grade);
  const thinkings = thinkingProblems[grade] || [];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${gradeNames[grade]}数学专项试卷</title>
<style>
body{font-family:'PingFang SC','Microsoft YaHei','SimSun',serif;padding:40px;line-height:2;color:#333}
h1{text-align:center;font-size:24px;color:#1a1a2e;border-bottom:3px solid #4a90d9;padding-bottom:12px;margin-bottom:24px}
.info{display:flex;justify-content:space-between;margin:20px 0;padding:12px 16px;background:#f8f9fa;border-radius:8px;font-size:14px}
.section{margin:28px 0}
.section h2{font-size:16px;color:#4a90d9;border-bottom:2px solid #4a90d9;padding-bottom:8px;margin-bottom:16px}
.question{margin:14px 0;padding:8px 12px;background:#fafbfc;border-radius:6px;font-size:14px}
.blank{display:inline-block;width:140px;border-bottom:2px solid #333;margin:0 8px}
.answer-area{min-height:70px;border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin:10px 0;background:#fff}
.answer-area-tall{min-height:140px;border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin:10px 0;background:#fff;page-break-inside:avoid}
.answer-area-app{min-height:120px;border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin:10px 0;background:#fff;page-break-inside:avoid}
.answer-section{margin-top:40px;border-top:3px solid #4a90d9;padding-top:20px;page-break-before:always}
.answer-section h2{color:#4a90d9}
.answer-section p{margin:6px 0;padding:4px 8px;background:#f0f7ff;border-radius:4px;font-size:13px}
.watermark{text-align:center;color:#e0e0e0;font-size:10px;margin-top:40px}
</style></head><body>
<h1>${gradeNames[grade]}数学专项试卷</h1>
<div class="info"><span>姓名：_____________</span><span>班级：_____________</span><span>日期：_____________</span><span>得分：_____________</span></div>
<div class="section"><h2>一、四则混合运算（每题3分，共24分）</h2>
${calcs[0]?.items.slice(0, 8).map((p, i) => `<div class="question">${i + 1}. ${p.replace(/ =$/, '')} = <span class="blank"></span></div>`).join('') || ''}</div>
<div class="section"><h2>二、竖式计算（每题4分，共24分）</h2>
${calcs[1]?.items.slice(0, 6).map((p, i) => `<div class="question">${i + 1}. ${p.replace(/ =$/, '')}</div><div class="answer-area-tall"></div>`).join('') || ''}</div>
<div class="section"><h2>三、巧算（每题4分，共16分）</h2>
${calcs[2]?.items.slice(0, 4).map((p, i) => `<div class="question">${i + 1}. ${p.split('=')[0].trim()} = <span class="blank"></span></div>`).join('') || ''}</div>
<div class="section"><h2>四、应用题（每题6分，共30分）</h2>
${calcs[3]?.items.slice(0, 5).map((p, i) => { const [q] = p.split(' | 答案：'); return `<div class="question">${i + 1}. ${q}</div><div class="answer-area-app"></div>`; }).join('') || ''}</div>
<div class="section"><h2>五、思维挑战（每题3分，共6分）</h2>
${thinkings[0]?.problems.slice(0, 2).map((p, i) => `<div class="question">${i + 1}. <strong>${p.title}：</strong>${p.content}</div><div class="answer-area-app"></div>`).join('') || ''}</div>
<div class="answer-section"><h2>参考答案</h2>
<p><strong>一、四则混合运算</strong></p>
${calcs[0]?.items.slice(0, 8).map((p, i) => `<p>${i + 1}. ${p.includes('=') ? p.split('=')[1]?.trim() : ''}</p>`).join('')}
<p><strong>二、竖式计算</strong></p><p>请自行验算</p>
<p><strong>三、巧算</strong></p>
${calcs[2]?.items.slice(0, 4).map((p, i) => `<p>${i + 1}. ${p}</p>`).join('')}
<p><strong>四、应用题</strong></p>
${calcs[3]?.items.slice(0, 5).map((p, i) => { const a = p.split(' | 答案：')[1]; return `<p>${i + 1}. ${a}</p>`; }).join('')}
<p><strong>五、思维挑战</strong></p>
${thinkings[0]?.problems.slice(0, 2).map((p, i) => `<p>${i + 1}. ${p.answer}</p>`).join('')}
</div></body></html>`;
};

// ==================== 思维题卡片组件 ====================
const ThinkingProblemCard: React.FC<{ problem: { title: string; content: string; answer: string } }> = ({ problem }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  return (
    <Card size="small" style={{ marginBottom: 8 }}>
      <h4>{problem.title}</h4>
      <p style={{ color: '#333', margin: '8px 0' }}>{problem.content}</p>
      {showAnswer ? (
        <p style={{ color: '#52c41a', fontSize: 13, background: '#f6ffed', padding: '8px 12px', borderRadius: 4 }}>
          <strong>答案：</strong>{problem.answer}
        </p>
      ) : (
        <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => setShowAnswer(true)}>查看答案</Button>
      )}
    </Card>
  );
};

// ==================== 页面组件 ====================
const MathSpecialPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('thinking');
  const [grade, setGrade] = useState<number>(3);
  const [showExamModal, setShowExamModal] = useState(false);
  const [examHtml, setExamHtml] = useState('');
  const [calcProblems, setCalcProblems] = useState(() => generateCalculationProblems(3));
  const [calcKey, setCalcKey] = useState(0);

  const handleRefreshCalc = () => {
    setCalcProblems(generateCalculationProblems(grade));
    setCalcKey(prev => prev + 1);
    message.success('题目已刷新！');
  };

  const handleGenerateExam = () => { setExamHtml(generateExamPaper(grade)); setShowExamModal(true); };
  const handleDownloadPdf = () => {
    const w = window.open('', '_blank');
    if (w) { w.document.write(examHtml); w.document.close(); w.onload = () => w.print(); }
  };

  const gradeSelector = (
    <Card style={{ marginBottom: 16 }}>
      <Space>
        <span>选择年级：</span>
        <Select value={grade} onChange={(v) => { setGrade(v); setCalcProblems(generateCalculationProblems(v)); }} style={{ width: 120 }}>
          <Select.Option value={3}>三年级</Select.Option>
          <Select.Option value={4}>四年级</Select.Option>
          <Select.Option value={5}>五年级</Select.Option>
        </Select>
      </Space>
    </Card>
  );

  const thinkingTab = (
    <div>
      {gradeSelector}
      <p style={{ color: '#999', marginBottom: 16 }}>共 {thinkingProblems[grade]?.reduce((sum, c) => sum + c.problems.length, 0) || 0} 道思维题，{thinkingProblems[grade]?.length || 0} 个分类</p>
      <Collapse defaultActiveKey={thinkingProblems[grade]?.map((_, i) => String(i))}>
        {(thinkingProblems[grade] || []).map((category, idx) => (
          <Panel header={`${category.category}（${category.problems.length}题）`} key={idx}>
            {category.problems.map((problem, pIdx) => (
              <ThinkingProblemCard key={pIdx} problem={problem} />
            ))}
          </Panel>
        ))}
      </Collapse>
    </div>
  );

  const calculationTab = (
    <div key={calcKey}>
      {gradeSelector}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#999' }}>共 {calcProblems.reduce((sum, c) => sum + (typeof c.items[0] === 'string' ? c.items.length : 0), 0)} 道计算题</span>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefreshCalc}>刷新题目</Button>
          <Button icon={<DownloadOutlined />} onClick={() => {
            const html = `<html><head><meta charset="UTF-8"><title>计算题</title>
              <style>
body{font-family:'PingFang SC','Microsoft YaHei','SimSun',serif;padding:40px;line-height:2;color:#333}
h1{text-align:center;font-size:24px;color:#1a1a2e;border-bottom:3px solid #4a90d9;padding-bottom:12px;margin-bottom:24px}
h2{margin-top:28px;font-size:16px;color:#4a90d9;border-bottom:2px solid #4a90d9;padding-bottom:8px}
.q{margin:12px 0;padding:8px 12px;background:#fafbfc;border-radius:6px;font-size:14px}
.blank{display:inline-block;width:140px;border-bottom:2px solid #333;margin:0 8px}
</style>
              </head><body><h1>计算题练习</h1>
              ${calcProblems.map(c => `<h2>${c.category}</h2>${c.items.map((p, i) => `<div class="q">${i+1}. ${typeof p === 'string' ? p.replace(/ \| 答案.*/, '').replace(/ =$/, '') + ' = <span class="blank"></span>' : ''}</div>`).join('')}`).join('')}
              </body></html>`;
            const w = window.open('', '_blank');
            if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
          }}>下载 PDF</Button>
        </Space>
      </div>
      {calcProblems.map((category, idx) => (
        <Card key={idx} title={category.category} style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {category.items.map((p, i) => (
              <div key={i} style={{ padding: 12, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f', fontSize: 14 }}>
                {typeof p === 'string' ? p.replace(/ \| 答案.*/, '') : String(p)}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );

  const knowledgeTab = (
    <div>
      {gradeSelector}
      {(knowledgePoints[grade] || []).map((category, idx) => (
        <Card key={idx} title={category.category} style={{ marginBottom: 16 }}>
          {category.points.map((point, i) => (
            <div key={i} style={{ padding: 12, background: '#f0f5ff', borderRadius: 8, border: '1px solid #adc6ff', marginBottom: 8 }}>
              <h4 style={{ margin: '0 0 8px', color: '#1890ff' }}>{point.title}</h4>
              <p style={{ margin: 0 }}>{point.content}</p>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );

  const examTab = (
    <div>
      <Card>
        <h3 style={{ marginBottom: 24 }}>试卷生成</h3>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <span style={{ marginRight: 16 }}>选择年级：</span>
            <Select value={grade} onChange={setGrade} style={{ width: 120 }}>
              <Select.Option value={3}>三年级</Select.Option>
              <Select.Option value={4}>四年级</Select.Option>
              <Select.Option value={5}>五年级</Select.Option>
            </Select>
          </div>
          <div>
            <p style={{ color: '#666', marginBottom: 16 }}>试卷内容：</p>
            <ul style={{ color: '#666', marginLeft: 20 }}>
              <li>四则混合运算（24分）</li>
              <li>竖式计算（24分）</li>
              <li>巧算（16分）</li>
              <li>应用题（30分）</li>
              <li>思维挑战（6分）</li>
            </ul>
          </div>
          <Space>
            <Button type="primary" icon={<EyeOutlined />} onClick={handleGenerateExam}>在线预览</Button>
            <Button icon={<DownloadOutlined />} onClick={() => { handleGenerateExam(); setTimeout(handleDownloadPdf, 500); }}>下载 PDF</Button>
          </Space>
        </Space>
      </Card>
      <Modal title="试卷预览" open={showExamModal} onCancel={() => setShowExamModal(false)} width={900}
        footer={[<Button key="close" onClick={() => setShowExamModal(false)}>关闭</Button>,
          <Button key="dl" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPdf}>下载 PDF</Button>]}>
        <div dangerouslySetInnerHTML={{ __html: examHtml }} style={{ maxHeight: '60vh', overflow: 'auto' }} />
      </Modal>
    </div>
  );

  const tabItems = [
    { key: 'thinking', label: <span><BulbOutlined /> 思维题</span>, children: thinkingTab },
    { key: 'calculation', label: <span><CalculatorOutlined /> 计算题库</span>, children: calculationTab },
    { key: 'knowledge', label: <span><BookOutlined /> 知识点</span>, children: knowledgeTab },
    { key: 'exam', label: <span><DownloadOutlined /> 试卷生成</span>, children: examTab },
  ];

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 24 }}>🔢 数学专项</h2>
        <Tag color="blue" style={{ marginBottom: 16 }}>护教版（五四学制）</Tag>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
      </div>
    </MainLayout>
  );
};

export default MathSpecialPage;
