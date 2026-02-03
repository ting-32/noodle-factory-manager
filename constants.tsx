
export const COLORS = {
  bg: '#f4f1ea',       // Linen
  primary: '#8e9775',  // Sage Morandi
  secondary: '#e28e8e', // Dusty Rose
  accent: '#92a9bd',    // Muted Blue
  slate: '#4a4a4a',     // Slate Grey
  cream: '#faf9f6'      // Light Cream
};

export const WEEKDAYS = [
  { label: '日', value: 0 },
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
];

export const DELIVERY_WINDOWS = [
  '06:00 - 08:00',
  '08:00 - 10:00',
  '10:00 - 12:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
];

// --- 配置：GAS 部署網址 ---
// 建議部署到網路時，將此檔案加入 .gitignore 或使用環境變數管理
export const GAS_URL = 'https://script.google.com/macros/s/AKfycbw4fwnKYWZKWWlTjYzHz0QtEOXtKHP8v_87bpjLuObpzUuozz85xLhkHWmEtW6Mls0t/exec';
