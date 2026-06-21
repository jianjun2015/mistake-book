// utils/util.js

/**
 * 格式化日期
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 获取学科名称
 */
const getSubjectName = (subject) => {
  const map = {
    'MATH': '数学',
    'PHYSICS': '物理',
    'CHEMISTRY': '化学',
    'BIOLOGY': '生物',
    'ENGLISH': '英语',
    'CHINESE': '语文'
  };
  return map[subject] || subject;
};

/**
 * 获取学科样式类名
 */
const getSubjectClass = (subject) => {
  const map = {
    'MATH': 'tag-math',
    'PHYSICS': 'tag-physics',
    'CHEMISTRY': 'tag-chemistry',
    'BIOLOGY': 'tag-biology',
    'ENGLISH': 'tag-english',
    'CHINESE': 'tag-chinese'
  };
  return map[subject] || '';
};

/**
 * 获取状态名称
 */
const getStatusName = (status) => {
  const map = { 0: '未掌握', 1: '半掌握', 2: '已掌握' };
  return map[status] || '未知';
};

/**
 * 获取状态样式类名
 */
const getStatusClass = (status) => {
  return `status-${status}`;
};

/**
 * 获取年级名称
 */
const getGradeName = (grade) => {
  const map = {
    1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级',
    7: '初一', 8: '初二', 9: '初三', 10: '高一', 11: '高二', 12: '高三'
  };
  return map[grade] || '未知';
};

/**
 * 获取性别名称
 */
const getGenderName = (gender) => {
  const map = { 1: '男', 2: '女' };
  return map[gender] || '未知';
};

module.exports = {
  formatDate,
  getSubjectName,
  getSubjectClass,
  getStatusName,
  getStatusClass,
  getGradeName,
  getGenderName
};
