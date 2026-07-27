import React, { useState } from 'react';
import { Card, Tabs, Button, Space, Select, Modal, Tag, Collapse, message, List } from 'antd';
import { DownloadOutlined, EyeOutlined, CalculatorOutlined, BulbOutlined, BookOutlined, ReloadOutlined, HistoryOutlined, DeleteOutlined } from '@ant-design/icons';
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

// ==================== 思维题数据（每个类型10题）====================
const thinkingProblems: Record<number, { category: string; problems: { title: string; content: string; answer: string }[] }[]> = {
  3: [
    { category: '找规律', problems: [
      { title: '数列规律1', content: '2, 5, 8, 11, __, __', answer: '14, 17（每次加3）' },
      { title: '数列规律2', content: '1, 4, 9, 16, __, __', answer: '25, 36（平方数）' },
      { title: '数列规律3', content: '1, 2, 4, 7, 11, __', answer: '16（差值递增）' },
      { title: '数列规律4', content: '3, 6, 12, 24, __', answer: '48（每次×2）' },
      { title: '数列规律5', content: '100, 90, 80, 70, __', answer: '60（每次-10）' },
      { title: '图形规律1', content: '○△□○△□○__□', answer: '△' },
      { title: '图形规律2', content: '🔴🔵🔴🔵🔴__', answer: '🔵' },
      { title: '交替规律1', content: '2, 5, 3, 6, 4, 7, __, __', answer: '5, 8' },
      { title: '交替规律2', content: '1, 10, 2, 9, 3, 8, __, __', answer: '4, 7' },
      { title: '递增规律', content: '1, 3, 6, 10, 15, __', answer: '21（差值递增：2,3,4,5,6）' },
    ]},
    { category: '和差问题', problems: [
      { title: '基本和差1', content: '两数之和是20，差是4，求这两个数。', answer: '12和8' },
      { title: '基本和差2', content: '两数之和是30，差是6，求这两个数。', answer: '18和12' },
      { title: '基本和差3', content: '两数之和是50，差是10，求这两个数。', answer: '30和20' },
      { title: '应用题1', content: '小明和小红共有45元，小明比小红多5元，各有多少元？', answer: '小明25元，小红20元' },
      { title: '应用题2', content: '甲乙两班共有80人，甲班比乙班多6人，各有多少人？', answer: '甲班43人，乙班37人' },
      { title: '应用题3', content: '两个数的和是100，大数比小数多20，求两个数。', answer: '60和40' },
      { title: '三人和差1', content: '甲乙丙三人共有60元，甲比乙多5元，乙比丙多5元，各有多少元？', answer: '乙20元，甲25元，丙15元' },
      { title: '三人和差2', content: '三本书共90元，第一本比第二本贵5元，第二本比第三本贵5元，各多少元？', answer: '35元、30元、25元' },
      { title: '重量问题', content: '两袋米共重50千克，第一袋比第二袋重4千克，各重多少？', answer: '27千克和23千克' },
      { title: '页数问题', content: '一本书两页之和是25，差是3，求两页页码。', answer: '14和11' },
    ]},
    { category: '年龄问题', problems: [
      { title: '年龄差不变1', content: '哥哥今年15岁，弟弟今年10岁，几年后两人年龄之和是45岁？', answer: '10年后' },
      { title: '年龄差不变2', content: '爸爸今年40岁，儿子今年12岁，几年后爸爸是儿子的2倍？', answer: '16年后' },
      { title: '年龄差不变3', content: '姐姐今年18岁，妹妹今年12岁，几年前姐姐是妹妹的2倍？', answer: '6年前' },
      { title: '年龄和问题', content: '小明和爸爸的年龄之和是40岁，爸爸是小明的4倍，各多少岁？', answer: '爸爸32岁，小明8岁' },
      { title: '年龄倍数1', content: '妈妈今年35岁，女儿今年7岁，几年后妈妈是女儿的3倍？', answer: '7年后' },
      { title: '年龄倍数2', content: '爷爷今年70岁，孙子今年10岁，几年前爷爷是孙子的9倍？', answer: '2年前' },
      { title: '三人年龄', content: '甲乙丙三人年龄之和是60岁，甲比乙大5岁，乙比丙大5岁，各多少岁？', answer: '甲25岁，乙20岁，丙15岁' },
      { title: '反向年龄', content: '5年后哥哥比弟弟大3岁，那5年前哥哥比弟弟大几岁？', answer: '还是3岁（年龄差不变）' },
      { title: '父子年龄', content: '父子年龄之和是56岁，4年后父亲是儿子的3倍，现在各多少岁？', answer: '父亲40岁，儿子16岁' },
      { title: '母女年龄', content: '母女年龄之和是50岁，5年前母亲是女儿的4倍，现在各多少岁？', answer: '母亲38岁，女儿12岁' },
    ]},
    { category: '植树问题', problems: [
      { title: '两端都种1', content: '一条路长100米，每隔5米种一棵树，两端都种，共需多少棵？', answer: '21棵' },
      { title: '两端都种2', content: '一条路长200米，每隔10米种一棵树，两端都种，共需多少棵？', answer: '21棵' },
      { title: '两端不种1', content: '一条路长100米，每隔5米种一棵树，两端不种，共需多少棵？', answer: '19棵' },
      { title: '两端不种2', content: '一条路长150米，每隔10米种一棵树，两端不种，共需多少棵？', answer: '14棵' },
      { title: '环形植树1', content: '一个圆形花坛周长50米，每隔5米种一棵花，共需多少棵？', answer: '10棵' },
      { title: '环形植树2', content: '一个圆形操场周长400米，每隔20米放一把椅子，共需多少把？', answer: '20把' },
      { title: '一端种', content: '一条路长100米，每隔5米种一棵树，只种一端，共需多少棵？', answer: '20棵' },
      { title: '锯木头', content: '一根木头锯成5段需要16分钟，锯成10段需要多少分钟？', answer: '36分钟' },
      { title: '爬楼梯', content: '从1楼到4楼需要6分钟，从1楼到7楼需要多少分钟？', answer: '12分钟' },
      { title: '敲钟问题', content: '时钟3点敲3下用2秒，6点敲6下用多少秒？', answer: '5秒' },
    ]},
    { category: '等量代换', problems: [
      { title: '图形代换1', content: '○+○+△=25，○+△=15，求○和△各是多少？', answer: '○=10，△=5' },
      { title: '图形代换2', content: '□+□+□+○=28，□+○=12，求□和○各是多少？', answer: '□=8，○=4' },
      { title: '动物代换1', content: '2只鸡=1只兔，3只兔=1只羊，1只羊=几只鸡？', answer: '6只鸡' },
      { title: '动物代换2', content: '3个苹果=1个西瓜，2个西瓜=1个南瓜，1个南瓜=几个苹果？', answer: '6个苹果' },
      { title: '水果代换', content: '2个苹果+3个橘子=16，1个苹果+3个橘子=12，1个苹果=？', answer: '4' },
      { title: '图形等式', content: '△+△=□+□+□，□=6，求△=？', answer: '△=9' },
      { title: '天平问题', content: '天平左边放3个苹果，右边放6个橘子刚好平衡。1个苹果等于几个橘子？', answer: '2个橘子' },
      { title: '文具代换', content: '2支铅笔=1块橡皮，3块橡皮=1把尺子，1把尺子=几支铅笔？', answer: '6支' },
      { title: '数字代换', content: '☆+☆+☆=18，☆+△=12，求△=？', answer: '△=6' },
      { title: '复杂代换', content: '○+△=10，△+□=12，○+□=14，求○、△、□各是多少？', answer: '○=6，△=4，□=8' },
    ]},
    { category: '排队问题', problems: [
      { title: '基本排队1', content: '小明前面有5人，后面有8人，这排共有几人？', answer: '14人' },
      { title: '基本排队2', content: '小红前面有10人，后面有15人，这排共有几人？', answer: '26人' },
      { title: '从前往后', content: '小红从前往后数第6个，从后往前数第8个，共有几人？', answer: '13人' },
      { title: '从后往前', content: '小明从后往前数第5个，从前往后数第9个，共有几人？', answer: '13人' },
      { title: '两人位置', content: '小明从前往后数第8个，小红从后往前数第5个，两人之间有3人，共有几人？', answer: '16人' },
      { title: '方阵问题', content: '一个正方形方阵每边有5人，最外层共有多少人？', answer: '16人' },
      { title: '圆形排队', content: '10个小朋友围成一圈，从小明开始数，小明是第1个，小红是第6个，他们之间有几人？', answer: '4人' },
      { title: '重复计数', content: '一排有20人，小明从左数是第8个，从右数是第几个？', answer: '第13个' },
      { title: '插入问题', content: '一排有10人，又插入3人，现在共有几人？', answer: '13人' },
      { title: '报数问题', content: '同学们排队报数，从1报到30，共有多少人？', answer: '30人' },
    ]},
    { category: '挂灯笼', problems: [
      { title: '基本挂灯笼1', content: '一条路长20米，每隔4米挂一个灯笼，两端都挂，共需多少个？', answer: '6个' },
      { title: '基本挂灯笼2', content: '一条路长30米，每隔5米挂一个灯笼，两端都挂，共需多少个？', answer: '7个' },
      { title: '两端不挂1', content: '一条路长24米，每隔4米挂一个灯笼，两端不挂，共需多少个？', answer: '5个' },
      { title: '两端不挂2', content: '一条路长36米，每隔6米挂一个灯笼，两端不挂，共需多少个？', answer: '5个' },
      { title: '环形挂灯笼1', content: '一个圆形广场周长40米，每隔5米挂一个灯笼，共需多少个？', answer: '8个' },
      { title: '环形挂灯笼2', content: '一个圆形花园周长60米，每隔10米挂一个灯笼，共需多少个？', answer: '6个' },
      { title: '一端挂', content: '一条路长20米，每隔4米挂一个灯笼，只挂一端，共需多少个？', answer: '5个' },
      { title: '混合挂灯笼', content: '一条路长50米，两端都挂，每隔5米挂一个灯笼，中间再加2个，共需多少个？', answer: '13个' },
      { title: '彩色灯笼', content: '一条路长30米，每隔3米挂一个红灯笼，每隔5米挂一个蓝灯笼，两端都挂，红灯笼比蓝灯笼多几个？', answer: '红灯笼11个，蓝灯笼7个，多4个' },
      { title: '费用问题', content: '一条路长100米，每隔10米挂一个灯笼，每个灯笼15元，共需多少钱？', answer: '11个灯笼，165元' },
    ]},
    { category: '时间问题', problems: [
      { title: '经过时间1', content: '从上午8:30到下午2:15，经过了多长时间？', answer: '5小时45分钟' },
      { title: '经过时间2', content: '从上午9:15到中午12:00，经过了多长时间？', answer: '2小时45分钟' },
      { title: '钟表问题1', content: '3点整时，时针和分针的夹角是多少度？', answer: '90度' },
      { title: '钟表问题2', content: '6点整时，时针和分针的夹角是多少度？', answer: '180度' },
      { title: '开始时间', content: '电影下午3:30结束，放映了2小时15分钟，电影几点开始？', answer: '下午1:15' },
      { title: '结束时间', content: '火车上午9:45出发，行驶了3小时30分钟，几点到达？', answer: '下午1:15' },
      { title: '一天时间', content: '一天有多少小时？多少分钟？多少秒？', answer: '24小时，1440分钟，86400秒' },
      { title: '星期问题', content: '今天是星期三，100天后是星期几？', answer: '星期五' },
      { title: '月份问题', content: '一年有几个月？大月有几天？小月有几天？', answer: '12个月，大月31天，小月30天' },
      { title: '年份问题', content: '2024年是闰年还是平年？全年有多少天？', answer: '闰年，366天' },
    ]},
  ],
  4: [
    { category: '鸡兔同笼', problems: [
      { title: '基本鸡兔同笼1', content: '鸡和兔共20只，脚共56只，鸡兔各几只？', answer: '兔8只，鸡12只' },
      { title: '基本鸡兔同笼2', content: '鸡和兔共30只，脚共80只，鸡兔各几只？', answer: '兔10只，鸡20只' },
      { title: '变式题1', content: '5元和10元的纸币共8张，共60元，各几张？', answer: '各4张' },
      { title: '变式题2', content: '2元和5元的纸币共20张，共64元，各几张？', answer: '2元12张，5元8张' },
      { title: '三轮车', content: '三轮车和轿车共10辆，轮子共34个，各有几辆？', answer: '轿车4辆，三轮车6辆' },
      { title: '蜘蛛蜻蜓', content: '蜘蛛8条腿，蜻蜓6条腿，共10只，腿共68条，各几只？', answer: '蜘蛛4只，蜻蜓6只' },
      { title: '大小船', content: '大船坐6人，小船坐4人，共10条船坐52人，各几条？', answer: '大船6条，小船4条' },
      { title: '龟鹤问题', content: '龟和鹤共20只，腿共56条，龟鹤各几只？', answer: '龟8只，鹤12只' },
      { title: '积分问题', content: '答对得5分，答错扣2分，小明答了20题得64分，答对几题？', answer: '答对12题' },
      { title: '邮票问题', content: '8角和5角的邮票共15张，共105角，各几张？', answer: '8角10张，5角5张' },
    ]},
    { category: '盈亏问题', problems: [
      { title: '一盈一亏1', content: '小朋友分苹果，每人分5个剩3个，每人分6个少2个，几个小朋友？', answer: '5人，28个苹果' },
      { title: '一盈一亏2', content: '分糖果，每人分8颗剩5颗，每人分10颗少3颗，几人？', answer: '4人，37颗' },
      { title: '双盈1', content: '小朋友分糖，每人分8颗剩10颗，每人分10颗剩2颗，几人？', answer: '4人，42颗' },
      { title: '双盈2', content: '分本子，每人分3本剩15本，每人分5本剩5本，几人？', answer: '5人，30本' },
      { title: '双亏1', content: '分饼干，每人分6块少4块，每人分8块少16块，几人？', answer: '6人，32块' },
      { title: '双亏2', content: '分铅笔，每人分3支少2支，每人分5支少12支，几人？', answer: '5人，13支' },
      { title: '变式1', content: '租船，每船坐4人剩3人，每船坐5人空2个位置，几条船？几人？', answer: '5条船，23人' },
      { title: '变式2', content: '住宿，每间住4人剩3人，每间住5人空2个床位，几间房？几人？', answer: '5间房，23人' },
      { title: '分组问题', content: '分组植树，每组5人多3人，每组6人少2人，几组？几人？', answer: '5组，28人' },
      { title: '分书问题', content: '分课外书，每人分3本剩20本，每人分5本刚好分完，几人？几本书？', answer: '10人，50本' },
    ]},
    { category: '行程问题', problems: [
      { title: '相遇问题1', content: '甲乙两地相距240km，甲车60km/h，乙车40km/h，相向而行，几小时相遇？', answer: '2.4小时' },
      { title: '相遇问题2', content: '甲乙两地相距360km，两车同时出发相向而行，甲速80km/h，乙速40km/h，几小时相遇？', answer: '3小时' },
      { title: '追及问题1', content: '甲每小时5km，乙每小时3km，乙先走2小时，甲几小时追上？', answer: '3小时' },
      { title: '追及问题2', content: '甲每分钟80米，乙每分钟60米，乙先走5分钟，甲几分钟追上？', answer: '15分钟' },
      { title: '往返问题', content: '去时每小时60km，回来每小时40km，求平均速度。', answer: '48km/h' },
      { title: '背向问题', content: '甲乙同时从同一地点出发，甲向东5km/h，乙向西3km/h，3小时后相距多远？', answer: '24km' },
      { title: '环形跑道', content: '跑道长400米，甲速5m/s，乙速3m/s，同向跑多久第一次相遇？', answer: '200秒' },
      { title: '过桥问题', content: '火车长200米，桥长800米，火车速度20m/s，过桥需多少秒？', answer: '50秒' },
      { title: '流水问题', content: '船在静水中速度10km/h，水流速度2km/h，顺流速度多少？逆流呢？', answer: '顺流12km/h，逆流8km/h' },
      { title: '多次相遇', content: '甲乙两地相距100km，甲乙同时出发相向而行，甲速20km/h，乙速30km/h，第一次相遇后继续前进到对方出发点返回，第二次相遇时甲走了多远？', answer: '80km' },
    ]},
    { category: '周期问题', problems: [
      { title: '星期问题1', content: '今天是星期三，100天后是星期几？', answer: '星期五' },
      { title: '星期问题2', content: '2024年1月1日是星期一，2024年12月31日是星期几？', answer: '星期二' },
      { title: '彩旗问题1', content: '按红黄蓝绿顺序排列，第50面是什么颜色？', answer: '黄色' },
      { title: '彩旗问题2', content: '按红黄蓝绿顺序排列，第100面是什么颜色？', answer: '绿色' },
      { title: '生肖问题', content: '2024年是龙年，100年后是什么年？', answer: '龙年' },
      { title: '数字规律', content: '1, 2, 3, 1, 2, 3... 第50个数是什么？', answer: '2' },
      { title: '余数问题', content: '今天是星期五，50天前是星期几？', answer: '星期三' },
      { title: '节日问题', content: '国庆节（10月1日）是星期一，这年的12月25日是星期几？', answer: '星期一' },
      { title: '时钟问题', content: '时钟每12小时转一圈，从上午8点到晚上8点，时针转了几圈？', answer: '1圈' },
      { title: '月相问题', content: '月相变化周期约30天，今天是满月，90天后是什么月相？', answer: '满月' },
    ]},
    { category: '逻辑推理', problems: [
      { title: '真假判断1', content: '甲说乙在说谎，乙说丙在说谎，丙说甲和乙都在说谎。谁说真话？', answer: '乙说真话' },
      { title: '真假判断2', content: 'A说B说谎，B说C说谎，C说A说谎。只有一人说真话，是谁？', answer: 'B' },
      { title: '排名问题1', content: '甲比乙高，丙比丁矮，乙比丙高，丁比甲高。谁最高？', answer: '丁最高' },
      { title: '排名问题2', content: '甲乙丙三人比赛，甲不是第一，乙不是第二，丙不是第三。谁是第一？', answer: '乙' },
      { title: '猜数字', content: '一个两位数，十位比个位大2，两个数字之和是12，这个数是多少？', answer: '75' },
      { title: '职业推理', content: '甲乙丙分别是医生、教师、警察。甲不是医生，乙不是教师，丙不是警察。甲是什么？', answer: '教师' },
      { title: '座位问题', content: '甲乙丙三人坐一排，甲不坐中间，乙不坐右边，丙不坐左边。甲坐哪？', answer: '右边' },
      { title: '身份推理', content: '好人总说真话，坏人总说假话。A说"我是好人"，B说"A是坏人"。谁是好人？', answer: 'B是好人' },
      { title: '数字推理', content: '一个三位数，百位比十位大1，十位比个位大1，三个数字之和是12，这个数是多少？', answer: '543' },
      { title: '分配问题', content: '把10个苹果分给3个小朋友，每人至少分2个，有几种分法？', answer: '6种' },
    ]},
    { category: '数阵图', problems: [
      { title: '三阶幻方1', content: '将1-9填入3×3方格，使每行每列对角线之和相等，和是多少？', answer: '15' },
      { title: '三阶幻方2', content: '三阶幻方中，中心数是多少？', answer: '5' },
      { title: '数字填空1', content: '在○中填入1-6，使每条线上三个数之和相等，和是多少？', answer: '12' },
      { title: '数字填空2', content: '将2-10填入3×3方格，使每行每列对角线之和相等，和是多少？', answer: '18' },
      { title: '十字填数', content: '在十字形中填入1-5，使横竖三个数之和相等，中心填几？', answer: '3' },
      { title: '三角填数', content: '在三角形三个顶点和三条边中点填入1-6，使每条边三个数之和相等，和是多少？', answer: '9' },
      { title: '圆环填数', content: '在圆环的6个位置填入1-6，使相对两个数之和相等，和是多少？', answer: '7' },
      { title: '方阵填数', content: '在4×4方阵中填入1-16，使每行每列之和相等，和是多少？', answer: '34' },
      { title: '九宫格', content: '九宫格中，四个角的数之和是多少？', answer: '20' },
      { title: '数字魔方', content: '用1-9组成一个3×3的数字魔方，最大数和最小数的差是多少？', answer: '8' },
    ]},
    { category: '枚举法', problems: [
      { title: '搭配问题1', content: '3件上衣，4条裤子，有几种搭配方式？', answer: '12种' },
      { title: '搭配问题2', content: '2顶帽子，3件衣服，4条裤子，有几种搭配？', answer: '24种' },
      { title: '路线问题1', content: '从A到B有3条路，从B到C有2条路，从A经B到C有几种走法？', answer: '6种' },
      { title: '路线问题2', content: '从家到学校有2条路，从学校到图书馆有3条路，从家经学校到图书馆有几种走法？', answer: '6种' },
      { title: '数字组合', content: '用1、2、3三个数字能组成多少个不同的两位数？', answer: '6个' },
      { title: '握手问题', content: '5个人互相握手，共握几次手？', answer: '10次' },
      { title: '传球问题', content: '3个人传球，从甲开始，经过3次传球后回到甲，有几种传法？', answer: '2种' },
      { title: '硬币问题', content: '有1角、5角、1元硬币各一枚，能组成多少种不同的金额？', answer: '7种' },
      { title: '颜色涂色', content: '用红黄蓝三种颜色涂一个正方形的四个角，相邻角不同色，有几种涂法？', answer: '18种' },
      { title: '分组问题', content: '4个人分成两组，每组至少1人，有几种分法？', answer: '7种' },
    ]},
  ],
  5: [
    { category: '工程问题', problems: [
      { title: '合作完成1', content: '甲单独做需10天，乙单独做需15天，合作几天完成？', answer: '6天' },
      { title: '合作完成2', content: '甲单独做需8天，乙单独做需12天，合作几天完成？', answer: '4.8天' },
      { title: '分段合作', content: '甲乙合作3天后甲离开，乙单独做2天完成。甲需10天，乙需15天。', answer: '验证通过' },
      { title: '三人合作', content: '甲需10天，乙需15天，丙需30天，三人合作几天完成？', answer: '5天' },
      { title: '交替工作', content: '甲做1天乙做1天交替进行，甲需10天，乙需15天，几天完成？', answer: '12天' },
      { title: '水池问题', content: '进水管3小时注满，出水管5小时放完，同时开几小时注满？', answer: '7.5小时' },
      { title: '效率变化', content: '甲效率提高20%后，原来10天的工作几天完成？', answer: '约8.3天' },
      { title: '部分完成', content: '甲做5天后乙接手，甲需10天，乙需15天，共几天完成？', answer: '12.5天' },
      { title: '工资分配', content: '甲乙合作完成，甲需10天乙需15天，工资3000元按工作量分配，各得多少？', answer: '甲1800元，乙1200元' },
      { title: '提前完成', content: '原计划10天完成，实际每天多做20%，几天完成？', answer: '约8.3天' },
    ]},
    { category: '浓度问题', problems: [
      { title: '稀释问题1', content: '200克含盐10%的盐水，加多少水后变成5%？', answer: '加水200克' },
      { title: '稀释问题2', content: '500克含盐8%的盐水，蒸发多少水后变成10%？', answer: '蒸发100克' },
      { title: '混合问题1', content: '20%盐水100克和10%盐水200克混合，浓度多少？', answer: '约13.3%' },
      { title: '混合问题2', content: '30%盐水和10%盐水混合成20%盐水300克，各需多少？', answer: '各150克' },
      { title: '加盐问题', content: '200克含盐5%的盐水，加多少盐后变成10%？', answer: '约10.5克' },
      { title: '酒精问题', content: '100克含酒精40%的溶液，加多少水后变成20%？', answer: '加水100克' },
      { title: '糖水问题', content: '300克含糖20%的糖水，加多少糖后变成30%？', answer: '约42.9克' },
      { title: '多次稀释', content: '200克含盐20%的盐水，先加100克水，再加100克水，最终浓度多少？', answer: '10%' },
      { title: '倒出问题', content: '500克含盐10%的盐水，倒出100克后加满水，浓度多少？', answer: '8%' },
      { title: '等量混合', content: '浓度20%和浓度40%的盐水等量混合，浓度多少？', answer: '30%' },
    ]},
    { category: '利润问题', problems: [
      { title: '基本利润1', content: '成本100元，售价150元，利润率是多少？', answer: '50%' },
      { title: '基本利润2', content: '成本200元，利润率30%，售价多少？', answer: '260元' },
      { title: '打折问题1', content: '商品标价200元，打8折后再打9折，最终价格？', answer: '144元' },
      { title: '打折问题2', content: '商品标价500元，先打7折再打8折，最终价格？利润率多少（成本300元）？', answer: '280元，亏本' },
      { title: '亏本问题', content: '打7折亏24元，打9折赚16元，成本多少？', answer: '成本164元' },
      { title: '涨价问题', content: '商品先涨价20%，再打8折，最终价格和原价比如何？', answer: '原价的96%' },
      { title: '进价问题', content: '售价100元，利润率25%，进价多少？', answer: '80元' },
      { title: '促销问题', content: '买3送1，相当于打几折？', answer: '75折' },
      { title: '满减问题', content: '满200减30，相当于打几折？', answer: '85折' },
      { title: '成本核算', content: '商品标价300元，打8折后还能赚20%，成本多少？', answer: '200元' },
    ]},
    { category: '几何面积', problems: [
      { title: '组合图形1', content: '正方形边长10cm，内部最大圆的面积？', answer: '78.5cm²' },
      { title: '组合图形2', content: '圆的半径5cm，外面最小正方形的面积？', answer: '100cm²' },
      { title: '阴影面积1', content: '长方形长8cm宽6cm，内部最大半圆面积？', answer: '14.13cm²' },
      { title: '阴影面积2', content: '正方形边长10cm，四个角各切去一个半径2cm的扇形，剩余面积？', answer: '87.44cm²' },
      { title: '三角形面积', content: '三角形底10cm，高6cm，面积多少？', answer: '30cm²' },
      { title: '梯形面积', content: '梯形上底4cm，下底8cm，高5cm，面积多少？', answer: '30cm²' },
      { title: '圆环面积', content: '外圆半径5cm，内圆半径3cm，圆环面积？', answer: '50.24cm²' },
      { title: '拼接问题', content: '两个边长5cm的正方形拼成长方形，面积和周长各是多少？', answer: '面积50cm²，周长30cm' },
      { title: '周长问题', content: '长方形面积48cm²，长8cm，周长多少？', answer: '28cm' },
      { title: '最大面积', content: '周长24cm的长方形，最大面积是多少？', answer: '36cm²（正方形）' },
    ]},
    { category: '数论问题', problems: [
      { title: '最大公因数1', content: '求48和36的最大公因数。', answer: '12' },
      { title: '最大公因数2', content: '求72和54的最大公因数。', answer: '18' },
      { title: '最小公倍数1', content: '求6和8的最小公倍数。', answer: '24' },
      { title: '最小公倍数2', content: '求12和18的最小公倍数。', answer: '36' },
      { title: '奇偶性1', content: '1+2+3+...+100的和是奇数还是偶数？', answer: '偶数（5050）' },
      { title: '奇偶性2', content: '奇数+奇数=？偶数+偶数=？奇数+偶数=？', answer: '偶数、偶数、奇数' },
      { title: '质数问题', content: '20以内的质数有哪些？', answer: '2,3,5,7,11,13,17,19' },
      { title: '因数个数', content: '36有多少个因数？', answer: '9个' },
      { title: '整除问题', content: '能同时被2、3、5整除的最小两位数是多少？', answer: '30' },
      { title: '余数问题', content: '100÷7的余数是多少？', answer: '2' },
    ]},
    { category: '比例问题', problems: [
      { title: '比例分配1', content: '甲乙丙按2:3:5分配150元，各得多少？', answer: '甲30，乙45，丙75' },
      { title: '比例分配2', content: 'A和B的比是3:5，A是36，B是多少？', answer: '60' },
      { title: '正比例', content: '速度一定，路程和时间成什么比例？', answer: '正比例' },
      { title: '反比例', content: '路程一定，速度和时间成什么比例？', answer: '反比例' },
      { title: '比例尺', content: '地图比例尺1:10000，图上3cm实际多少米？', answer: '300米' },
      { title: '按比分配', content: '三角形三边比3:4:5，周长36cm，各边多长？', answer: '9cm, 12cm, 15cm' },
      { title: '连比问题', content: '甲:乙=2:3，乙:丙=4:5，甲:乙:丙=？', answer: '8:12:15' },
      { title: '比例应用', content: '药和水的比是1:100，配505克药水需药多少克？', answer: '5克' },
      { title: '比例方程', content: 'x:y=3:4，x+y=28，求x和y。', answer: 'x=12，y=16' },
      { title: '浓度比例', content: '含盐20%的盐水中，盐和水的比是多少？', answer: '1:4' },
    ]},
    { category: '优化问题', problems: [
      { title: '烙饼问题1', content: '锅里每次最多烙2张饼，每面3分钟，烙3张饼最少几分钟？', answer: '9分钟' },
      { title: '烙饼问题2', content: '锅里每次最多烙2张饼，每面3分钟，烙5张饼最少几分钟？', answer: '15分钟' },
      { title: '排队问题', content: '甲乙丙三人打水，用时1、3、5分钟，怎样安排等待时间最短？', answer: '甲→乙→丙，总等待14分钟' },
      { title: '过河问题', content: '4人过桥，分别需1、2、5、10分钟，两人同行以慢者为准，最少几分钟？', answer: '17分钟' },
      { title: '最短路径', content: '从A到B有3条路，分别需10、15、20分钟，从B到C有2条路，分别需5、8分钟，最短需几分钟？', answer: '15分钟' },
      { title: '资源分配', content: '100元买3种物品，单价分别是5元、8元、12元，要买20个，有几种买法？', answer: '多种方案' },
      { title: '调度问题', content: '3台机器加工6个零件，每台机器加工时间不同，怎样安排总时间最短？', answer: '合理分配' },
      { title: '最少次数', content: '用3升和5升的桶量出4升水，最少几次操作？', answer: '6次' },
      { title: '最优方案', content: '买饮料，大瓶10元/1000ml，小瓶4元/300ml，买3升最省钱方案？', answer: '3大瓶=30元' },
      { title: '时间安排', content: '煮饭20分钟，洗菜10分钟，炒菜15分钟，最短多久完成？', answer: '35分钟（并行处理）' },
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
      if (type === 1) { const a = randInt(10, 99), b = randInt(10, 99), c = randInt(2, 9); mixProblems.push(`${a} + ${b} × ${c}`); }
      else if (type === 2) { const a = randInt(100, 999), b = randInt(10, 99), c = randInt(2, 9); mixProblems.push(`${a} - ${b} × ${c}`); }
      else if (type === 3) { const a = randInt(10, 99), b = randInt(2, 9), c = randInt(10, 99), d = randInt(2, 9); mixProblems.push(`${a} × ${b} + ${c} ÷ ${d}`); }
      else { const a = randInt(100, 999), b = randInt(10, 99); mixProblems.push(`(${a} - ${b}) × ${randInt(2, 9)}`); }
    } else {
      if (type === 1) { const a = randInt(100, 999), b = randInt(10, 99); mixProblems.push(`${a} - (${b} + ${randInt(10, 99)}) × ${randInt(2, 9)}`); }
      else if (type === 2) { const a = randInt(10, 99), b = randInt(10, 99); mixProblems.push(`${a} × ${b} + ${100 - a} × ${b}`); }
      else if (type === 3) { const a = randInt(100, 999); mixProblems.push(`(${a} + ${randInt(100, 999)}) × ${randInt(2, 9)}`); }
      else { const a = randInt(100, 999), b = randInt(10, 99); mixProblems.push(`${a} ÷ ${b % 9 + 2} + ${randInt(100, 999)} ÷ ${b % 9 + 2}`); }
    }
  }
  problems.push({ category: '四则混合运算', items: shuffle(mixProblems) });

  // 竖式计算 - 12题
  const verticalProblems: string[] = [];
  for (let i = 0; i < 12; i++) {
    const type = randInt(1, 3);
    if (type === 1) verticalProblems.push(`${randInt(10, 99)} × ${randInt(10, 99)}`);
    else if (type === 2) verticalProblems.push(`${randInt(100, 999)} ÷ ${randInt(10, 99)}`);
    else verticalProblems.push(`${randInt(100, 999)} + ${randInt(100, 999)}`);
  }
  problems.push({ category: '竖式计算', items: shuffle(verticalProblems) });

  // 巧算 - 15题
  const cleverProblems = [
    '99 + 78', '198 + 456', '302 + 567', '999 + 234',
    '523 - 198', '765 - 299', '1000 - 367', '456 - 199',
    '25 × 16', '25 × 28', '125 × 24', '50 × 18',
    '99 × 6', '99 × 12', '37 × 3 × 9',
    '360 ÷ 5', '480 ÷ 24', '720 ÷ 36', '250 ÷ 5',
    '125 + 78 + 75', '368 + 256 + 132', '876 - 234 - 76',
  ];
  problems.push({ category: '巧算', items: shuffle(cleverProblems) });

  // 分数题 - 8题 (仅三年级)
  if (grade === 3) {
    const fractionProblems = [
      '½ + ½', '⅓ + ⅓', '¼ + ¼', '⅕ + ⅕',
      '1 - ½', '1 - ⅓', '1 - ¼', '⅖ + ⅖',
      '⅜ + ⅛', '⅚ - ⅙', '½ + ¼', '⅔ - ⅓',
    ];
    problems.push({ category: '分数计算', items: shuffle(fractionProblems) });
  }

  // 应用题 - 15题
  const appProblems = [
    { q: '小明买了3支铅笔，每支2元，又买了一个笔记本15元，一共花了多少钱？', a: '21元' },
    { q: '小红从家到学校要走15分钟，每分钟走60米，她家到学校有多远？', a: '900米' },
    { q: '果园里有苹果树24棵，梨树是苹果树的3倍，果园一共有多少棵树？', a: '96棵' },
    { q: '小明三次数学成绩分别是85分、92分、88分，平均每次考多少分？', a: '约88.3分' },
    { q: '图书馆有故事书350本，借出128本，又还回来45本，现在有多少本？', a: '267本' },
    { q: '书店促销，每本书原价25元，买4本送1本。小明要买5本书，最少花多少钱？', a: '100元' },
    { q: '甲乙两地相距480千米，一辆汽车每小时行80千米，几小时到达？', a: '6小时' },
    { q: '修一条路，甲队每天修120米，乙队每天修150米，两队合修8天，共修多少米？', a: '2160米' },
    { q: '一块长方形菜地，长25米，宽16米，每平方米收白菜8千克，共收多少千克？', a: '3200千克' },
    { q: '学校图书馆有科技书480本，故事书是科技书的2倍多50本，故事书有多少本？', a: '1010本' },
    { q: '商场打折，一件衣服原价350元，先打8折，再用优惠券减30元，最终多少钱？', a: '250元' },
    { q: '甲乙两车从相距360千米的两地同时出发相向而行，甲车60km/h，乙车40km/h，几小时相遇？', a: '3.6小时' },
    { q: '一项工程，甲单独做10天完成，乙单独做15天完成，两人合作几天完成？', a: '6天' },
    { q: '有含盐20%的盐水300克，要变成含盐15%的盐水，需要加多少克水？', a: '100克' },
    { q: '一件商品成本价120元，标价200元，打8折出售，利润率是多少？', a: '约33.3%' },
  ];
  problems.push({ category: '应用题', items: shuffle(appProblems).map(p => `${p.q}|||${p.a}`) });

  return problems;
};

// ==================== 知识点 ====================
const knowledgePoints: Record<number, { category: string; points: { title: string; content: string }[] }[]> = {
  3: [
    { category: '数与代数', points: [
      { title: '万以内数的认识', content: '认识万以内的数，理解数位顺序' },
      { title: '两位数乘两位数', content: '从个位乘起，满十进一' },
      { title: '三位数除以两位数', content: '从高位除起，余数比除数小' },
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

// ==================== 历史记录 ====================
interface ExamRecord {
  id: string;
  grade: number;
  date: string;
  html: string;
}

const getExamHistory = (): ExamRecord[] => {
  try {
    const history = localStorage.getItem('exam_history');
    return history ? JSON.parse(history) : [];
  } catch { return []; }
};

const saveExamHistory = (record: ExamRecord) => {
  const history = getExamHistory();
  history.unshift(record);
  if (history.length > 20) history.pop();
  localStorage.setItem('exam_history', JSON.stringify(history));
};

const deleteExamHistory = (id: string) => {
  const history = getExamHistory().filter(r => r.id !== id);
  localStorage.setItem('exam_history', JSON.stringify(history));
};

// ==================== 试卷生成 ====================
const generateExamPaper = (grade: number) => {
  const gradeNames: Record<number, string> = { 3: '三年级', 4: '四年级', 5: '五年级' };
  const calcs = generateCalculationProblems(grade);
  const thinkings = thinkingProblems[grade] || [];
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${gradeNames[grade]}数学专项试卷</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'PingFang SC','Microsoft YaHei','SimSun',serif;padding:30px 40px;line-height:1.8;color:#333;background:#fff}
h1{text-align:center;font-size:22px;color:#1a1a2e;border-bottom:3px solid #2563eb;padding-bottom:10px;margin-bottom:20px}
.info{display:flex;justify-content:space-between;margin-bottom:24px;padding:10px 16px;background:#f0f5ff;border-radius:8px;font-size:13px;color:#555}
.section{margin:24px 0}
.section h2{font-size:15px;color:#2563eb;border-left:4px solid #2563eb;padding-left:10px;margin-bottom:14px}
.question{margin:10px 0;padding:6px 10px;font-size:13px;border-radius:4px}
.question:nth-child(even){background:#fafbfc}
.blank{display:inline-block;width:120px;border-bottom:1.5px solid #555;margin:0 6px}
.answer-area{min-height:50px;border:1px solid #e0e0e0;border-radius:6px;padding:10px;margin:8px 0;background:#fff}
.answer-area-tall{min-height:110px;border:1px solid #e0e0e0;border-radius:6px;padding:10px;margin:8px 0;background:#fff;page-break-inside:avoid}
.answer-area-app{min-height:90px;border:1px solid #e0e0e0;border-radius:6px;padding:10px;margin:8px 0;background:#fff;page-break-inside:avoid}
.answer-section{margin-top:30px;border-top:2px solid #2563eb;padding-top:16px;page-break-before:always}
.answer-section h2{color:#2563eb;margin-bottom:12px}
.answer-item{margin:6px 0;padding:4px 10px;font-size:12px;background:#f0f7ff;border-radius:4px}
.footer{text-align:center;margin-top:30px;font-size:11px;color:#bbb;border-top:1px solid #eee;padding-top:10px}
</style></head><body>
<h1>${gradeNames[grade]}数学专项试卷</h1>
<div class="info">
  <span>姓名：_____________</span>
  <span>班级：_____________</span>
  <span>日期：${dateStr}</span>
  <span>得分：_____________</span>
</div>

<div class="section"><h2>一、四则混合运算（每题3分，共24分）</h2>
${calcs[0]?.items.slice(0, 8).map((p, i) => `<div class="question">${i + 1}. ${p} = <span class="blank"></span></div>`).join('\n') || ''}</div>

<div class="section"><h2>二、竖式计算（每题4分，共24分）</h2>
${calcs[1]?.items.slice(0, 6).map((p, i) => `<div class="question">${i + 1}. ${p}</div><div class="answer-area-tall"></div>`).join('\n') || ''}</div>

<div class="section"><h2>三、巧算（每题4分，共16分）</h2>
${calcs[2]?.items.slice(0, 4).map((p, i) => `<div class="question">${i + 1}. ${p} = <span class="blank"></span></div>`).join('\n') || ''}</div>

${grade === 3 ? `<div class="section"><h2>四、分数计算（每题2分，共10分）</h2>
${(calcs[3]?.items || []).slice(0, 5).map((p, i) => `<div class="question">${i + 1}. ${p} = <span class="blank"></span></div>`).join('\n') || ''}</div>

<div class="section"><h2>五、应用题（每题5分，共20分）</h2>
${calcs[4]?.items.slice(0, 4).map((p, i) => { const q = p.split('|||')[0]; return `<div class="question">${i + 1}. ${q}</div><div class="answer-area-app"></div>`; }).join('\n') || ''}</div>

<div class="section"><h2>六、思维挑战（每题3分，共6分）</h2>
${thinkings[0]?.problems.slice(0, 2).map((p, i) => `<div class="question">${i + 1}. <b>${p.title}：</b>${p.content}</div><div class="answer-area-app"></div>`).join('\n') || ''}</div>` : `<div class="section"><h2>四、应用题（每题6分，共30分）</h2>
${calcs[3]?.items.slice(0, 5).map((p, i) => { const q = p.split('|||')[0]; return `<div class="question">${i + 1}. ${q}</div><div class="answer-area-app"></div>`; }).join('\n') || ''}</div>

<div class="section"><h2>五、思维挑战（每题3分，共6分）</h2>
${thinkings[0]?.problems.slice(0, 2).map((p, i) => `<div class="question">${i + 1}. <b>${p.title}：</b>${p.content}</div><div class="answer-area-app"></div>`).join('\n') || ''}</div>`}

<div class="answer-section">
<h2>参考答案</h2>
<p class="answer-item"><b>一、四则混合运算：</b>请自行验算</p>
<p class="answer-item"><b>二、竖式计算：</b>请自行验算</p>
<p class="answer-item"><b>三、巧算：</b>请自行验算</p>
${grade === 3 ? `<p class="answer-item"><b>四、分数计算：</b>请自行验算</p>
<p class="answer-item"><b>五、应用题：</b>${calcs[4]?.items.slice(0, 4).map(p => p.split('|||')[1]).join('；')}</p>
<p class="answer-item"><b>六、思维挑战：</b>${thinkings[0]?.problems.slice(0, 2).map(p => p.answer).join('；')}</p>` : `<p class="answer-item"><b>四、应用题：</b>${calcs[3]?.items.slice(0, 5).map(p => p.split('|||')[1]).join('；')}</p>
<p class="answer-item"><b>五、思维挑战：</b>${thinkings[0]?.problems.slice(0, 2).map(p => p.answer).join('；')}</p>`}
</div>
<div class="footer">错题本系统 · 数学专项 · ${dateStr}</div>
</body></html>`;
};

// ==================== 思维题卡片 ====================
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

// ==================== 主页面 ====================
const MathSpecialPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('thinking');
  const [grade, setGrade] = useState<number>(3);
  const [showExamModal, setShowExamModal] = useState(false);
  const [examHtml, setExamHtml] = useState('');
  const [calcProblems, setCalcProblems] = useState(() => generateCalculationProblems(3));
  const [calcKey, setCalcKey] = useState(0);
  const [examHistory, setExamHistory] = useState<ExamRecord[]>(getExamHistory());
  const gradeNames: Record<number, string> = { 3: '三年级', 4: '四年级', 5: '五年级' };

  const handleRefreshCalc = () => {
    setCalcProblems(generateCalculationProblems(grade));
    setCalcKey(prev => prev + 1);
    message.success('题目已刷新！');
  };

  const handleGenerateExam = () => {
    const html = generateExamPaper(grade);
    const record: ExamRecord = {
      id: Date.now().toString(),
      grade,
      date: new Date().toLocaleString('zh-CN'),
      html,
    };
    saveExamHistory(record);
    setExamHistory(getExamHistory());
    setExamHtml(html);
    setShowExamModal(true);
  };

  const handleDownloadPdf = (html?: string) => {
    const content = html || examHtml;
    const w = window.open('', '_blank');
    if (w) { w.document.write(content); w.document.close(); w.onload = () => w.print(); }
  };

  const handleDeleteHistory = (id: string) => {
    deleteExamHistory(id);
    setExamHistory(getExamHistory());
    message.success('已删除');
  };

  const gradeSelector = (
    <Card style={{ marginBottom: 16 }}>
      <Space>
        <span>选择年级：</span>
        <Select value={grade} onChange={(v) => { setGrade(v); setCalcProblems(generateCalculationProblems(v)); setCalcKey(prev => prev + 1); }} style={{ width: 120 }}>
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
      <Collapse defaultActiveKey={[]}>
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
        <span style={{ color: '#999' }}>共 {calcProblems.reduce((sum, c) => sum + c.items.length, 0)} 道计算题</span>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefreshCalc}>刷新题目</Button>
          <Button icon={<DownloadOutlined />} onClick={() => {
            const html = `<html><head><meta charset="UTF-8"><title>计算题</title>
              <style>
              *{margin:0;padding:0;box-sizing:border-box}
              body{font-family:'PingFang SC','Microsoft YaHei',serif;padding:30px 40px;line-height:1.8;color:#333}
              h1{text-align:center;font-size:22px;border-bottom:3px solid #2563eb;padding-bottom:10px;margin-bottom:20px}
              h2{font-size:15px;color:#2563eb;border-left:4px solid #2563eb;padding-left:10px;margin:20px 0 12px;clear:both}
              .two-col{display:grid;grid-template-columns:1fr 1fr;gap:0 24px}
              .q{padding:5px 8px;font-size:13px;border-bottom:1px dashed #eee;page-break-inside:avoid}
              .blank{display:inline-block;width:100px;border-bottom:1.5px solid #555;margin:0 4px}
              .app-area{min-height:70px;border:1px solid #e0e0e0;border-radius:6px;padding:8px;margin:6px 0;background:#fff;page-break-inside:avoid}
              </style>
              </head><body>
              <h1>${gradeNames[grade]}计算题练习</h1>
              ${calcProblems.map(c => {
                const isApp = c.category === '应用题';
                const isVert = c.category === '竖式计算';
                const isFraction = c.category === '分数计算';
                const items = c.items.slice(0, (isApp || isVert) ? 8 : undefined);
                return `<h2>${c.category}</h2>${(isApp || isVert) ? items.map((p, i) => {
                  const text = typeof p === 'string' ? p.split('|||')[0] : String(p);
                  return `<div class="q"><b>${i+1}.</b> ${text}</div><div class="app-area"></div>`;
                }).join('') : `<div class="two-col">${items.map((p, i) => {
                  const text = typeof p === 'string' ? p.split('|||')[0] : String(p);
                  const needsBlank = !text.includes('：');
                  return `<div class="q">${i+1}. ${text}${needsBlank || isFraction ? ' = <span class="blank"></span>' : ''}</div>`;
                }).join('')}</div>`}`;
              }).join('')}
              </body></html>`;
            const w = window.open('', '_blank');
            if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
          }}>下载 PDF</Button>
        </Space>
      </div>
      {calcProblems.map((category, idx) => (
        <Card key={idx} title={category.category} style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {category.items.map((p, i) => {
              const text = typeof p === 'string' ? p.split('|||')[0] : String(p);
              return (
                <div key={i} style={{ padding: 12, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f', fontSize: 14 }}>
                  {text}
                </div>
              );
            })}
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
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 24 }}>生成新试卷</h3>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <span style={{ marginRight: 16 }}>选择年级：</span>
            <Select value={grade} onChange={setGrade} style={{ width: 120 }}>
              <Select.Option value={3}>三年级</Select.Option>
              <Select.Option value={4}>四年级</Select.Option>
              <Select.Option value={5}>五年级</Select.Option>
            </Select>
          </div>
          <Space>
            <Button type="primary" icon={<EyeOutlined />} onClick={handleGenerateExam}>生成并预览</Button>
            <Button icon={<DownloadOutlined />} onClick={() => { handleGenerateExam(); setTimeout(() => handleDownloadPdf(), 500); }}>生成并下载 PDF</Button>
          </Space>
        </Space>
      </Card>

      {examHistory.length > 0 && (
        <Card title={<span><HistoryOutlined /> 历史记录</span>}>
          <List
            dataSource={examHistory}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button type="link" icon={<EyeOutlined />} onClick={() => { setExamHtml(item.html); setShowExamModal(true); }}>预览</Button>,
                  <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownloadPdf(item.html)}>下载</Button>,
                  <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteHistory(item.id)}>删除</Button>,
                ]}
              >
                <List.Item.Meta
                  title={`${gradeNames[item.grade]}数学试卷`}
                  description={item.date}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Modal title="试卷预览" open={showExamModal} onCancel={() => setShowExamModal(false)} width={900}
        footer={[<Button key="close" onClick={() => setShowExamModal(false)}>关闭</Button>,
          <Button key="dl" type="primary" icon={<DownloadOutlined />} onClick={() => handleDownloadPdf()}>下载 PDF</Button>]}>
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
