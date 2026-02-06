import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Package, 
  ClipboardList, 
  History,
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Clock,
  X,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Edit2,
  Layers,
  Box,
  UserPlus,
  UserCheck,
  CalendarDays,
  Loader2,
  WifiOff,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Zap,
  FileText,
  Filter,
  ListChecks,
  Printer,
  Lock,
  LogOut,
  RefreshCw,
  Save,
  Key,
  Link as LinkIcon,
  AlertTriangle,
  DollarSign,
  Calculator,
  Truck
} from 'lucide-react';
import { Customer, Product, Order, OrderStatus, OrderItem, GASResponse, DefaultItem, CustomerPrice } from './types';
import { COLORS, WEEKDAYS, GAS_URL as DEFAULT_GAS_URL, UNITS, DELIVERY_METHODS } from './constants';

// --- 設定：預設共用密碼 (若 localStorage 無資料時使用) ---
const DEFAULT_PASSWORD = "8888";

// --- 工具函數 ---
const normalizeDate = (dateStr: any) => {
  if (!dateStr) return '';
  try {
    // 嘗試解析日期，處理 yyyy/mm/dd 或 yyyy-mm-dd 或 ISO
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch (e) {
    return String(dateStr);
  }
};

const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateStr(d);
};

// 安全解析 JSON 陣列的輔助函數，相容已解析的物件、字串或空值
const safeJsonArray = (val: any) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === '""') return [];
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("JSON Parse error for value:", val);
      return [];
    }
  }
  return [];
};

// 格式化配送時間顯示 (用於卡片展示：9:40)
const formatTimeDisplay = (time: any) => {
  if (!time) return '未設定';
  
  // 1. 處理 Date 物件或 ISO 時間字串 (如 1899-12-30T09:40:00.000Z)
  // 透過檢查是否包含 '-' 來區分 ISO 字串與普通 HH:mm 字串
  const date = new Date(time);
  if (!isNaN(date.getTime()) && String(time).includes('-')) {
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  
  // 2. 處理字串 (HH:mm 或 HH:mm:ss)
  const str = String(time).trim();
  const parts = str.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    // 關鍵修正：排除年份被誤判為小時的情況 (例如 1899)
    if (!isNaN(h) && h >= 0 && h < 24) {
       const m = parts[1].substring(0, 2);
       return `${h}:${m}`;
    }
  }
  
  // 如果上述都失敗，回傳原始字串
  return str;
};

// 格式化配送時間用於 Input [type=time] (必須是 HH:mm，如 09:40)
const formatTimeForInput = (time: any) => {
  if (!time) return '08:00';

  // 1. 處理 Date 物件或 ISO 時間字串
  const date = new Date(time);
  if (!isNaN(date.getTime()) && String(time).includes('-')) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  // 2. 處理字串
  const str = String(time).trim();
  const parts = str.split(':');
  if (parts.length >= 2) {
    let h = parseInt(parts[0], 10);
    if (!isNaN(h) && h >= 0 && h < 24) {
       const m = parts[1].substring(0, 2);
       return `${String(h).padStart(2, '0')}:${m}`;
    }
  }

  return '08:00';
};

// --- 子組件：登入畫面 ---
const LoginScreen: React.FC<{ onLogin: (password: string) => boolean }> = ({ onLogin }) => {
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(inputVal);
    if (!success) {
      setError(true);
      setInputVal('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f1ea] p-6 relative overflow-hidden">
      {/* 裝飾背景 */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#8e9775] rounded-full opacity-10 blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-[#e28e8e] rounded-full opacity-10 blur-3xl"></div>
      
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-[40px] shadow-2xl w-full max-w-sm border border-white animate-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#8e9775] rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg rotate-3">
             <ClipboardList className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">麵廠職人</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">系統登入</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="password" 
                placeholder="請輸入系統密碼" 
                className={`w-full pl-14 pr-6 py-4 bg-gray-50 rounded-[24px] border-2 shadow-inner text-slate-800 font-bold focus:ring-4 focus:ring-[#8e9775]/20 transition-all outline-none ${error ? 'border-rose-200 focus:border-rose-400' : 'border-transparent focus:border-[#8e9775]'}`}
                value={inputVal} 
                onChange={(e) => { setInputVal(e.target.value); setError(false); }}
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 px-2 text-rose-500 animate-in slide-in-from-left-2 fade-in">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">密碼錯誤，請重新輸入</span>
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="w-full py-4 rounded-[24px] text-white font-bold shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.primary }}
          >
            進入系統 <ChevronRight className="w-5 h-5" />
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-300">© 2025 Noodle Factory Manager</p>
        </div>
      </div>
    </div>
  );
};

// --- 子組件：自訂確認視窗 (取代 window.confirm) ---
const ConfirmModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xs rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-2">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500 font-bold leading-relaxed px-2">{message}</p>
        </div>
        <div className="p-4 flex gap-3 bg-gray-50/50">
          <button 
            onClick={onCancel} 
            className="flex-1 py-3 rounded-[20px] font-bold text-gray-400 bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-3 rounded-[20px] font-bold text-white shadow-lg bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all"
          >
            確認刪除
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 子組件：公休日月曆選擇器 ---
const HolidayCalendar: React.FC<{ 
  holidays: string[]; 
  onToggle: (dateStr: string) => void;
  onClose: () => void;
  storeName: string;
}> = ({ holidays, onToggle, onClose, storeName }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);
    for (let i = 0; i < startOffset; i++) days.push({ day: null });
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      days.push({ day: i, dateStr: formatDateStr(date) });
    }
    return days;
  }, [viewDate]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#faf9f6]">
          <div>
            <h3 className="font-bold text-gray-800">{storeName}</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">特定公休日編輯</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-2xl shadow-sm"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 bg-gray-50 rounded-xl"><ChevronLeft className="w-6 h-6 text-gray-300" /></button>
            <h4 className="font-bold text-gray-700">{viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月</h4>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 bg-gray-50 rounded-xl"><ChevronRight className="w-6 h-6 text-gray-300" /></button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center">
            {WEEKDAYS.map(d => (
              <div key={d.value} className="text-[10px] font-bold text-gray-300 uppercase py-2">{d.label}</div>
            ))}
            {calendarDays.map((item, idx) => {
              const isHoliday = item.dateStr && holidays.includes(item.dateStr);
              return (
                <div 
                  key={idx} 
                  onClick={() => item.dateStr && onToggle(item.dateStr)}
                  className={`aspect-square flex items-center justify-center text-sm rounded-xl cursor-pointer transition-all border ${!item.day ? 'opacity-0 pointer-events-none' : 'hover:scale-105 active:scale-90'} ${isHoliday ? 'bg-rose-50 border-rose-100 text-rose-500 font-bold' : 'bg-white border-transparent text-gray-600'}`}
                >
                  {item.day}
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-6 bg-[#faf9f6] flex justify-end">
          <button onClick={onClose} className="px-8 py-4 rounded-[20px] text-white font-bold shadow-lg" style={{ backgroundColor: COLORS.primary }}>完成設定</button>
        </div>
      </div>
    </div>
  );
};

// --- 子組件：工作小抄專用嵌入式月曆 ---
const WorkCalendar: React.FC<{ 
  selectedDate: string; 
  onSelect: (date: string) => void;
  orders: Order[];
}> = ({ selectedDate, onSelect, orders }) => {
  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const [viewDate, setViewDate] = useState(parseLocalDate(selectedDate));
  
  // 建立一個 Set 儲存有訂單的日期，用於顯示小圓點
  const datesWithOrders = useMemo(() => {
    const set = new Set(orders.map(o => o.deliveryDate));
    return set;
  }, [orders]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);
    for (let i = 0; i < startOffset; i++) days.push({ day: null });
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      days.push({ day: i, dateStr: formatDateStr(date) });
    }
    return days;
  }, [viewDate]);

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-white">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 bg-gray-50 rounded-xl"><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
        <h4 className="font-bold text-slate-700 text-sm">{viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月</h4>
        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 bg-gray-50 rounded-xl"><ChevronRight className="w-5 h-5 text-gray-400" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map(d => (
          <div key={d.value} className="text-[10px] font-bold text-gray-300 uppercase py-2">{d.label}</div>
        ))}
        {calendarDays.map((item, idx) => {
          const isSelected = item.dateStr === selectedDate;
          const hasOrder = item.dateStr && datesWithOrders.has(item.dateStr);
          return (
            <div 
              key={idx} 
              onClick={() => item.dateStr && onSelect(item.dateStr)}
              className={`aspect-square flex flex-col items-center justify-center text-sm rounded-xl cursor-pointer transition-all border relative ${!item.day ? 'opacity-0 pointer-events-none' : 'hover:bg-gray-50'} ${isSelected ? 'text-white font-bold shadow-md' : 'bg-white border-transparent text-gray-600'}`}
              style={{ backgroundColor: isSelected ? COLORS.primary : '' }}
            >
              <span className="z-10">{item.day}</span>
              {/* 有訂單的小圓點 */}
              {hasOrder && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-amber-400 absolute bottom-2"></span>
              )}
              {hasOrder && isSelected && (
                <span className="w-1 h-1 rounded-full bg-white/60 absolute bottom-2"></span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- 子組件：日期選擇器 (主頁用) ---
const DatePickerModal: React.FC<{ 
  selectedDate: string; 
  onSelect: (date: string) => void;
  onClose: () => void;
}> = ({ selectedDate, onSelect, onClose }) => {
  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const [viewDate, setViewDate] = useState(parseLocalDate(selectedDate));
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);
    for (let i = 0; i < startOffset; i++) days.push({ day: null });
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      days.push({ day: i, dateStr: formatDateStr(date) });
    }
    return days;
  }, [viewDate]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#faf9f6]">
          <h3 className="font-bold text-gray-800">選擇配送日期</h3>
          <button onClick={onClose} className="p-2 bg-white rounded-2xl shadow-sm"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 bg-gray-50 rounded-xl"><ChevronLeft className="w-6 h-6 text-gray-300" /></button>
            <h4 className="font-bold text-gray-700">{viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月</h4>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 bg-gray-50 rounded-xl"><ChevronRight className="w-6 h-6 text-gray-300" /></button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center">
            {WEEKDAYS.map(d => (
              <div key={d.value} className="text-[10px] font-bold text-gray-300 uppercase py-2">{d.label}</div>
            ))}
            {calendarDays.map((item, idx) => {
              const isSelected = item.dateStr === selectedDate;
              return (
                <div 
                  key={idx} 
                  onClick={() => item.dateStr && (onSelect(item.dateStr), onClose())}
                  className={`aspect-square flex items-center justify-center text-sm rounded-xl cursor-pointer transition-all border ${!item.day ? 'opacity-0 pointer-events-none' : 'hover:bg-gray-50 active:scale-90'} ${isSelected ? 'text-white font-bold' : 'bg-white border-transparent text-gray-600'}`}
                  style={{ backgroundColor: isSelected ? COLORS.primary : '' }}
                >
                  {item.day}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 子組件：設定頁面彈窗 ---
const SettingsModal: React.FC<{
  onClose: () => void;
  onSync: () => void;
  onSavePassword: (newPwd: string) => void;
  currentUrl: string;
  onSaveUrl: (newUrl: string) => void;
}> = ({ onClose, onSync, onSavePassword, currentUrl, onSaveUrl }) => {
  const [newPassword, setNewPassword] = useState('');
  const [inputUrl, setInputUrl] = useState(currentUrl);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');
  const [urlSaveStatus, setUrlSaveStatus] = useState<'idle' | 'success'>('idle');

  const handlePasswordSubmit = () => {
    if (newPassword.length < 4) {
      alert('密碼長度請至少輸入 4 碼');
      return;
    }
    onSavePassword(newPassword);
    setSaveStatus('success');
    setNewPassword('');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleUrlSubmit = () => {
    if (!inputUrl.startsWith('http')) {
      alert('請輸入有效的網址 (http 開頭)');
      return;
    }
    onSaveUrl(inputUrl);
    setUrlSaveStatus('success');
    setTimeout(() => setUrlSaveStatus('idle'), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 h-[85vh] sm:h-auto overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#faf9f6] sticky top-0 z-10">
          <div>
            <h3 className="font-bold text-gray-800">系統設定</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Settings</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-2xl shadow-sm"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        
        <div className="p-6 space-y-8">
          
          {/* 資料同步區塊 */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><RefreshCw className="w-4 h-4" /> 資料同步</h4>
            <div className="bg-gray-50 p-5 rounded-[24px]">
               <p className="text-xs text-slate-500 mb-4 font-bold leading-relaxed">
                 若發現資料與雲端不同步（例如其他裝置已更新），可點擊下方按鈕強制重新讀取。
               </p>
               <button 
                 onClick={() => { onSync(); onClose(); }}
                 className="w-full py-4 rounded-[20px] bg-slate-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
               >
                 <RefreshCw className="w-5 h-5" /> 強制同步雲端資料
               </button>
            </div>
          </section>

          {/* API 連線設定 */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><LinkIcon className="w-4 h-4" /> 伺服器連線 (GAS URL)</h4>
            <div className="bg-gray-50 p-5 rounded-[24px] space-y-4">
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                請將您 Google Apps Script 部署後的 Web App URL 貼於此處，以確保資料正確寫入您的試算表。
              </p>
              <textarea 
                className="w-full p-3 rounded-2xl border-none text-[10px] text-slate-600 font-mono bg-white h-20 resize-none outline-none focus:ring-2 focus:ring-[#8e9775] shadow-sm"
                placeholder="https://script.google.com/macros/s/..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
              />
              <button 
                 onClick={handleUrlSubmit}
                 className={`w-full py-3 rounded-[20px] font-bold flex items-center justify-center gap-2 transition-all ${urlSaveStatus === 'success' ? 'bg-green-500 text-white' : 'bg-white text-slate-600 shadow-sm'}`}
               >
                 {urlSaveStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                 {urlSaveStatus === 'success' ? '網址已更新' : '儲存連線網址'}
               </button>
            </div>
          </section>

          {/* 安全性設定區塊 */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Lock className="w-4 h-4" /> 安全性設定</h4>
            <div className="bg-gray-50 p-5 rounded-[24px] space-y-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-400 pl-1">更改共用密碼</label>
                 <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" // 故意顯示明文以便確認，或是改 password
                      placeholder="輸入新密碼" 
                      className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl text-slate-800 font-bold text-sm border-none outline-none focus:ring-2 focus:ring-[#8e9775] transition-all"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                 </div>
               </div>
               <button 
                 onClick={handlePasswordSubmit}
                 className={`w-full py-3 rounded-[20px] font-bold flex items-center justify-center gap-2 transition-all ${saveStatus === 'success' ? 'bg-green-500 text-white' : 'bg-white text-slate-600 shadow-sm'}`}
               >
                 {saveStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                 {saveStatus === 'success' ? '密碼已更新' : '儲存新密碼'}
               </button>
            </div>
          </section>

          {/* 系統資訊 */}
          <div className="text-center pt-4 border-t border-gray-100">
             <p className="text-[10px] text-gray-300 font-bold">Noodle Factory Manager v1.5</p>
          </div>

        </div>
      </div>
    </div>
  );
};


// --- 子組件：導航項目 ---
const NavItem: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`group flex flex-col items-center justify-center w-full transition-all duration-300 ${active ? '-translate-y-1' : 'opacity-40 hover:opacity-70'}`}
  >
    <div 
      className={`w-12 h-12 rounded-[20px] flex items-center justify-center mb-1 transition-all duration-300 ${active ? 'text-white shadow-xl' : 'text-slate-400 group-hover:bg-gray-50'}`}
      style={{ 
        backgroundColor: active ? COLORS.primary : 'transparent',
        boxShadow: active ? `0 8px 16px -4px ${COLORS.primary}50` : 'none'
      }}
    >
      {icon}
    </div>
    <span className={`text-[10px] font-bold tracking-widest transition-colors ${active ? 'text-slate-800' : 'text-gray-300'}`}>
      {label}
    </span>
  </button>
);


// --- 主要 App 組件 ---
const App: React.FC = () => {
  // --- 認證狀態 ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('nm_app_password') || DEFAULT_PASSWORD;
    return DEFAULT_PASSWORD;
  });

  // --- API 設定 ---
  const [apiEndpoint, setApiEndpoint] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('nm_gas_url') || DEFAULT_GAS_URL;
    return DEFAULT_GAS_URL;
  });

  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'products' | 'work'>('orders');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nm_selected_date');
      if (saved) return saved;
    }
    return getTomorrowDate();
  });

  // 工作小抄專用狀態
  const [workDate, setWorkDate] = useState<string>(getTomorrowDate());
  const [workCustomerFilter, setWorkCustomerFilter] = useState('');
  const [workProductFilter, setWorkProductFilter] = useState<string[]>([]);
  const [workDeliveryMethodFilter, setWorkDeliveryMethodFilter] = useState<string[]>([]);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [holidayEditorId, setHolidayEditorId] = useState<string | null>(null);

  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [quickAddData, setQuickAddData] = useState<{customerName: string, productId: string, quantity: number} | null>(null);

  // 新增：暫存價目表設定
  const [tempPriceProdId, setTempPriceProdId] = useState('');
  const [tempPriceValue, setTempPriceValue] = useState('');
  const [tempPriceUnit, setTempPriceUnit] = useState('斤');

  // --- 確認對話框狀態 ---
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [orderForm, setOrderForm] = useState<{
    customerType: 'existing' | 'retail';
    customerId: string;
    customerName: string;
    deliveryTime: string;
    deliveryMethod: string; // 新增狀態
    items: OrderItem[];
    note: string;
  }>({
    customerType: 'existing',
    customerId: '',
    customerName: '',
    deliveryTime: '08:00',
    deliveryMethod: '', // 初始化為空
    items: [{ productId: '', quantity: 10, unit: '斤' }],
    note: ''
  });

  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({});
  const [isEditingCustomer, setIsEditingCustomer] = useState<string | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const [customerSearch, setCustomerSearch] = useState('');

  // ------------------ 訂單總結與金額計算 (useMemo) ------------------
  const orderSummary = useMemo(() => {
    const customer = customers.find(c => c.id === orderForm.customerId);
    let totalPrice = 0;
    
    const details = orderForm.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        // Find price in customer list
        const priceItem = customer?.priceList?.find(pl => pl.productId === item.productId);
        // Updated: Fallback to product default price if no specific customer price
        const unitPrice = priceItem ? priceItem.price : (product?.price || 0); 

        let displayQty = item.quantity;
        let displayUnit = item.unit || '斤'; // Default from item
        let subtotal = 0;
        let isCalculated = false;

        if (item.unit === '元') {
             subtotal = item.quantity; // The input IS the money
             // Convert money to weight if price exists
             if (unitPrice > 0) {
                 // Example: 44元 / 22元/斤 = 2斤
                 displayQty = parseFloat((item.quantity / unitPrice).toFixed(1)); 
                 displayUnit = product?.unit || '斤'; // Revert to base unit (e.g., 斤)
                 isCalculated = true;
             } else {
                 displayQty = 0; // Cannot calculate without price
             }
        } else {
             // Standard calc: Qty * Price
             subtotal = item.quantity * unitPrice;
             displayQty = item.quantity;
             displayUnit = item.unit || '斤';
        }

        totalPrice += subtotal;
        
        // Return structured data for the summary view
        return { 
          name: product?.name || '未選品項', 
          rawQty: item.quantity,
          rawUnit: item.unit,
          displayQty, 
          displayUnit, 
          subtotal,
          unitPrice,
          isCalculated
        };
    });

    return { totalPrice, details };
  }, [orderForm.items, orderForm.customerId, customers, products]);


  useEffect(() => {
    const authStatus = localStorage.getItem('nm_auth_status');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nm_selected_date', selectedDate);
  }, [selectedDate]);

  // ------------------ 雲端資料同步讀取 (使用 apiEndpoint) ------------------
  const syncData = async () => {
    if (!apiEndpoint) {
      setIsInitialLoading(false);
      return;
    }
    
    setIsInitialLoading(true);

    try {
      const res = await fetch(`${apiEndpoint}?type=init`);
      const result: GASResponse<any> = await res.json();
      
      if (result.success && result.data) {
        const mappedCustomers: Customer[] = (result.data.customers || []).map((c: any) => {
          // 嘗試多種鍵值名稱以應對表單欄位名稱可能不一致的問題
          const priceListKey = Object.keys(c).find(k => k.includes('價目表') || k.includes('Price') || k.includes('priceList')) || '價目表JSON';
          
          return {
            id: String(c.ID || c.id || ''),
            name: c.客戶名稱 || c.name || '',
            phone: c.電話 || c.phone || '',
            deliveryTime: c.配送時間 || c.deliveryTime || '',
            deliveryMethod: c.配送方式 || c.deliveryMethod || '', 
            defaultItems: safeJsonArray(c.預設品項JSON || c.預設品項 || c.defaultItems),
            priceList: safeJsonArray(c[priceListKey] || c.priceList).map((pl: any) => ({
              productId: pl.productId,
              price: Number(pl.price) || 0,
              unit: pl.unit || '斤'
            })),
            offDays: safeJsonArray(c.公休日週期JSON || c.公休日週期 || c.offDays),
            holidayDates: safeJsonArray(c.特定公休日JSON || c.特定公休日 || c.holidayDates)
          };
        });

        const mappedProducts: Product[] = (result.data.products || []).map((p: any) => ({
          id: String(p.ID || p.id),
          name: p.品項 || p.name,
          unit: p.單位 || p.unit,
          price: Number(p.單價 || p.price) || 0 // 新增：讀取單價
        }));

        const rawOrders = result.data.orders || [];
        const orderMap: { [key: string]: Order } = {};
        rawOrders.forEach((o: any) => {
          const oid = String(o.訂單ID || o.id);
          if (!orderMap[oid]) {
            const rawDate = o.配送日期 || o.deliveryDate;
            const normalizedDate = normalizeDate(rawDate);
            orderMap[oid] = {
              id: oid,
              createdAt: o.建立時間 || o.createdAt,
              customerName: o.客戶名 || o.customerName || '未知客戶',
              deliveryDate: normalizedDate,
              deliveryTime: o.配送時間 || o.deliveryTime,
              items: [],
              note: o.備註 || o.note || '',
              status: (o.狀態 || o.status as OrderStatus) || OrderStatus.PENDING,
              deliveryMethod: o.配送方式 || o.deliveryMethod || '' // 讀取訂單的配送方式
            };
          }
          const prodName = o.品項 || o.productName;
          const prod = mappedProducts.find(p => p.name === prodName);
          orderMap[oid].items.push({
            productId: prod ? prod.id : prodName,
            quantity: Number(o.數量 || o.quantity) || 0
          });
        });

        setCustomers(mappedCustomers);
        setProducts(mappedProducts);
        setOrders(Object.values(orderMap));
      }
    } catch (e) {
      console.error("無法連線至雲端:", e);
      alert("同步失敗，請檢查網路連線或稍後再試。\n請確認「設定」中的 API 網址是否正確。");
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      syncData();
    }
  }, [isAuthenticated, apiEndpoint]); // 加入 apiEndpoint 依賴，網址變更時自動重抓

  const ordersForDate = useMemo(() => {
    return orders.filter(o => o.deliveryDate === selectedDate);
  }, [orders, selectedDate]);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    ordersForDate.forEach(o => {
      const name = o.customerName;
      if (!groups[name]) groups[name] = [];
      groups[name].push(o);
    });
    return groups;
  }, [ordersForDate]);

  const activeCustomersForDate = useMemo(() => {
    const dayOfWeek = new Date(selectedDate).getDay();
    return customers.filter(c => {
      const isSpecificHoliday = (c.holidayDates || []).includes(selectedDate);
      const isWeeklyHoliday = (c.offDays || []).includes(dayOfWeek);
      return !isSpecificHoliday && !isWeeklyHoliday;
    });
  }, [customers, selectedDate]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customers, customerSearch]);

  const workSheetData = useMemo(() => {
    const dateOrders = orders.filter(o => o.deliveryDate === workDate);
    const aggregation = new Map<string, { totalQty: number, unit: string, details: { customerName: string, qty: number }[] }>();

    dateOrders.forEach(o => {
      // 1. 篩選客戶名稱
      if (workCustomerFilter && !o.customerName.toLowerCase().includes(workCustomerFilter.toLowerCase())) return;
      
      // 2. 篩選配送方式 (Updated logic: 優先使用訂單上的配送方式，若無則查找客戶預設)
      if (workDeliveryMethodFilter.length > 0) {
         const customer = customers.find(c => c.name === o.customerName);
         const method = o.deliveryMethod || customer?.deliveryMethod || '';
         if (!workDeliveryMethodFilter.includes(method)) return;
      }

      o.items.forEach(item => {
        const product = products.find(p => p.id === item.productId || p.name === item.productId);
        const productName = product?.name || item.productId;
        const productUnit = product?.unit || '斤';
        
        // 3. 篩選品項
        if (workProductFilter.length > 0 && !workProductFilter.includes(productName)) return;
        
        if (!aggregation.has(productName)) aggregation.set(productName, { totalQty: 0, unit: productUnit, details: [] });
        const entry = aggregation.get(productName)!;
        entry.totalQty += item.quantity;
        entry.details.push({ customerName: o.customerName, qty: item.quantity });
      });
    });
    return Array.from(aggregation.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.totalQty - a.totalQty);
  }, [orders, workDate, workCustomerFilter, workProductFilter, workDeliveryMethodFilter, products, customers]);

  const handleSelectExistingCustomer = (id: string) => {
    const cust = customers.find(c => c.id === id);
    if (cust) {
      if (groupedOrders[cust.name] && groupedOrders[cust.name].length > 0) {
        alert(`⚠️ 提醒：\n\n「${cust.name}」在今日 (${selectedDate}) 已經建立過訂單了！\n\n若需增加品項，建議回到列表使用「追加訂單」功能，以免重複配送。`);
      }
      setOrderForm({
        ...orderForm,
        customerId: id,
        customerName: cust.name,
        deliveryTime: formatTimeForInput(cust.deliveryTime),
        deliveryMethod: cust.deliveryMethod || '', // 自動帶入店家配送方式
        items: cust.defaultItems && cust.defaultItems.length > 0 ? cust.defaultItems.map(di => ({ ...di })) : [{ productId: '', quantity: 10, unit: '斤' }]
      });
      setIsCustomerDropdownOpen(false);
    }
  };

  const handleSaveOrder = async () => {
    if (isSaving) return;
    const finalName = orderForm.customerType === 'existing' ? orderForm.customerName : orderForm.customerName;
    if (!finalName) return;
    const validItems = orderForm.items.filter(i => i.productId !== '' && i.quantity > 0);
    if (validItems.length === 0) return;

    setIsSaving(true);
    
    // Convert logic: If the user entered "元", we should probably save the CONVERTED quantity to the backend
    // or save the original and let backend handle. 
    // Usually, the production team needs weight/quantity, not money.
    // So we use the calculated displayQty for the saved order.
    
    const processedItems = orderSummary.details.filter(d => d.name !== '未選品項' && d.rawQty > 0).map(detail => {
       // Find the original item to get productId (since detail uses name for display)
       const originalItem = orderForm.items.find(i => {
           const p = products.find(prod => prod.id === i.productId);
           return (p?.name || '') === detail.name || i.productId === detail.name; // fuzzy match fallback
       }) || orderForm.items[0]; // fallback
       
       return {
           productId: originalItem.productId,
           quantity: detail.displayQty, // Use calculated quantity (e.g. 2斤 instead of 44元)
           unit: detail.displayUnit // Use calculated unit
       };
    });

    const newOrder: Order = {
      id: 'ORD-' + Date.now(),
      createdAt: new Date().toISOString(),
      customerName: finalName,
      deliveryDate: selectedDate,
      deliveryTime: orderForm.deliveryTime,
      deliveryMethod: orderForm.deliveryMethod, // 儲存配送方式
      items: processedItems,
      note: orderForm.note,
      status: OrderStatus.PENDING
    };

    try {
      if (apiEndpoint) {
        const uploadItems = processedItems.map(item => {
          const p = products.find(prod => prod.id === item.productId);
          return { productName: p?.name || item.productId, quantity: item.quantity, unit: item.unit };
        });
        await fetch(apiEndpoint, {
          method: 'POST',
          body: JSON.stringify({ action: 'createOrder', data: { ...newOrder, items: uploadItems } })
        });
      }
    } catch (e) { console.error(e); alert("訂單建立失敗，請檢查網路。"); }

    setOrders([newOrder, ...orders]);
    setIsSaving(false);
    setIsAddingOrder(false);
    setOrderForm({ customerType: 'existing', customerId: '', customerName: '', deliveryTime: '08:00', deliveryMethod: '', items: [{ productId: '', quantity: 10, unit: '斤' }], note: '' });
  };

  const handleQuickAddSubmit = async () => {
    if (!quickAddData || isSaving) return;
    if (!quickAddData.productId || quickAddData.quantity <= 0) return;

    setIsSaving(true);
    const existingOrders = groupedOrders[quickAddData.customerName] || [];
    const baseOrder = existingOrders[0];
    const deliveryTime = baseOrder ? baseOrder.deliveryTime : '08:00';
    
    // 追加訂單時，繼承原有訂單的配送方式，或使用客戶預設
    const customer = customers.find(c => c.name === quickAddData.customerName);
    const deliveryMethod = baseOrder?.deliveryMethod || customer?.deliveryMethod || '';

    const newOrder: Order = {
      id: 'Q-ORD-' + Date.now(),
      createdAt: new Date().toISOString(),
      customerName: quickAddData.customerName,
      deliveryDate: selectedDate,
      deliveryTime: deliveryTime,
      deliveryMethod: deliveryMethod, // 追加訂單也帶入配送方式
      items: [{ productId: quickAddData.productId, quantity: quickAddData.quantity }],
      note: '追加單',
      status: OrderStatus.PENDING
    };

    try {
      if (apiEndpoint) {
        const p = products.find(prod => prod.id === quickAddData.productId);
        const uploadItems = [{ productName: p?.name || quickAddData.productId, quantity: quickAddData.quantity }];
        await fetch(apiEndpoint, {
          method: 'POST',
          body: JSON.stringify({ action: 'createOrder', data: { ...newOrder, items: uploadItems } })
        });
      }
    } catch (e) { console.error(e); alert("追加失敗，請檢查網路。"); }

    setOrders([newOrder, ...orders]);
    setIsSaving(false);
    setQuickAddData(null);
  };

  // --- 實際執行刪除的邏輯 (由 Modal 觸發) ---
  const executeDeleteOrder = async (orderId: string) => {
    // 關閉 Modal
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));

    // 備份資料以供還原
    const orderBackup = orders.find(o => o.id === orderId);
    if (!orderBackup) return;

    // 樂觀更新：先從畫面移除
    setOrders(prev => prev.filter(o => o.id !== orderId));

    try {
      if (apiEndpoint) {
        await fetch(apiEndpoint, {
          method: 'POST',
          body: JSON.stringify({ action: 'deleteOrder', data: { id: orderId } })
        });
      }
    } catch (e) { 
      console.error("刪除失敗:", e);
      alert("雲端同步刪除失敗，請檢查網路或 API 設定。\n\n資料已自動還原。");
      // 失敗時還原資料
      setOrders(prev => [...prev, orderBackup]);
    }
  };

  const executeDeleteCustomer = async (customerId: string) => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));

    const customerBackup = customers.find(c => c.id === customerId);
    if (!customerBackup) return;

    setCustomers(prev => prev.filter(c => c.id !== customerId));

    try {
      if (apiEndpoint) {
        await fetch(apiEndpoint, {
          method: 'POST',
          body: JSON.stringify({ action: 'deleteCustomer', data: { id: customerId } })
        });
      }
    } catch (e) { 
      console.error("刪除失敗:", e);
      alert("雲端同步刪除失敗，請檢查網路或 API 設定。\n\n資料已自動還原。");
      setCustomers(prev => [...prev, customerBackup]);
    }
  };

  const executeDeleteProduct = async (productId: string) => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));

    const productBackup = products.find(p => p.id === productId);
    if (!productBackup) return;

    setProducts(prev => prev.filter(p => p.id !== productId));

    try {
      if (apiEndpoint) {
        await fetch(apiEndpoint, {
          method: 'POST',
          body: JSON.stringify({ action: 'deleteProduct', data: { id: productId } })
        });
      }
    } catch (e) { 
      console.error("刪除失敗:", e);
      alert("雲端同步刪除失敗，請檢查網路或 API 設定。\n\n資料已自動還原。");
      setProducts(prev => [...prev, productBackup]);
    }
  };

  // --- 呼叫刪除的 Handler (開啟 Modal) ---
  const handleDeleteOrder = (orderId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: '刪除訂單',
      message: '確定要刪除此訂單嗎？\n此動作將會同步刪除雲端資料。',
      onConfirm: () => executeDeleteOrder(orderId)
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: '刪除店家',
      message: '確定要刪除此店家嗎？\n這將一併刪除相關的設定。',
      onConfirm: () => executeDeleteCustomer(customerId)
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: '刪除品項',
      message: '確定要刪除此品項嗎？\n請確認該品項已無生產需求。',
      onConfirm: () => executeDeleteProduct(productId)
    });
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name || isSaving) return;
    setIsSaving(true);
    const isDuplicateName = customers.some(c => 
      c.name.trim() === (customerForm.name || '').trim() && 
      c.id !== (isEditingCustomer === 'new' ? null : isEditingCustomer)
    );
    if (isDuplicateName) { alert('客戶名稱不可重複！請使用其他名稱。'); setIsSaving(false); return; }

    const finalCustomer: Customer = {
      id: isEditingCustomer === 'new' ? Date.now().toString() : (isEditingCustomer as string),
      name: (customerForm.name || '').trim(),
      phone: (customerForm.phone || '').trim(),
      deliveryTime: customerForm.deliveryTime || '08:00',
      deliveryMethod: customerForm.deliveryMethod || '', // 新增：儲存配送方式
      defaultItems: (customerForm.defaultItems || []).filter(i => i.productId !== ''),
      priceList: (customerForm.priceList || []), // 儲存價目表
      offDays: customerForm.offDays || [],
      holidayDates: customerForm.holidayDates || []
    };

    try {
      if (apiEndpoint) {
        await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'updateCustomer', data: finalCustomer }) });
      }
    } catch (e) { console.error(e); }

    if (isEditingCustomer === 'new') setCustomers([...customers, finalCustomer]);
    else setCustomers(customers.map(c => c.id === isEditingCustomer ? finalCustomer : c));
    setIsSaving(false);
    setIsEditingCustomer(null);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || isSaving) return;
    setIsSaving(true);
    const finalProduct = { 
      id: isEditingProduct === 'new' ? 'p' + Date.now() : (isEditingProduct as string),
      name: productForm.name || '',
      unit: productForm.unit || '斤',
      price: Number(productForm.price) || 0 // 新增：儲存單價
    };
    try {
      if (apiEndpoint) {
        await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'updateProduct', data: finalProduct }) });
      }
    } catch (e) { console.error(e); }
    if (isEditingProduct === 'new') setProducts([...products, finalProduct]);
    else setProducts(products.map(p => p.id === isEditingProduct ? finalProduct : p));
    setIsSaving(false);
    setIsEditingProduct(null);
  };
  
  const handlePrint = () => {
    if (workSheetData.length === 0) { alert('目前沒有資料可供匯出'); return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('彈跳視窗被封鎖，無法開啟列印頁面。\n\n請允許本網站顯示彈跳視窗，或嘗試使用瀏覽器選單的「列印」功能。'); window.print(); return; }
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>麵廠職人 - 生產總表 - ${workDate}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h1 { text-align: center; margin-bottom: 5px; font-size: 24px; }
            p.date { text-align: center; color: #666; margin-bottom: 30px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; vertical-align: top; }
            th { background-color: #f5f5f5; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tr:nth-child(even) { background-color: #fafafa; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .badge { display: inline-block; background: #fff; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin: 2px; border: 1px solid #ddd; color: #555; }
            .total-cell { font-size: 16px; font-weight: bold; }
            .footer { margin-top: 40px; text-align: right; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>生產總表</h1>
          <p class="date">出貨日期: ${workDate}</p>
          <table>
            <thead><tr><th width="20%">品項</th><th width="15%">總量</th><th width="10%">單位</th><th>分配明細</th></tr></thead>
            <tbody>
              ${workSheetData.map((item, idx) => `
                <tr><td style="font-weight: bold;">${item.name}</td><td class="text-right total-cell">${item.totalQty}</td><td class="text-center">${item.unit}</td><td>${item.details.map(d => `<span class="badge">${d.customerName} <b>${d.qty}</b></span>`).join('')}</td></tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">列印時間: ${new Date().toLocaleString()}</div>
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleLogin = (pwd: string) => {
    if (pwd === currentPassword) { setIsAuthenticated(true); localStorage.setItem('nm_auth_status', 'true'); return true; }
    return false;
  };
  const handleLogout = () => { setIsAuthenticated(false); localStorage.removeItem('nm_auth_status'); setCustomers([]); setOrders([]); setProducts([]); };
  const handleChangePassword = (newPwd: string) => { localStorage.setItem('nm_app_password', newPwd); setCurrentPassword(newPwd); };
  
  // 新增：儲存 API URL
  const handleSaveApiUrl = (newUrl: string) => {
    localStorage.setItem('nm_gas_url', newUrl);
    setApiEndpoint(newUrl);
  };

  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;
  if (isInitialLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f1ea] p-10 text-center"><Loader2 className="w-12 h-12 text-[#8e9775] animate-spin mb-6" /><h2 className="text-xl font-bold text-gray-700">正在同步雲端資料...</h2></div>;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#f4f1ea] relative shadow-2xl overflow-hidden">
      <header className="p-6 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-40">
        <div><h1 className="text-2xl font-bold text-gray-800 tracking-tight">麵廠職人</h1><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">專業訂單管理系統</p></div>
        <div className="flex gap-2">
           <button onClick={handleLogout} className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400 hover:text-rose-400 hover:bg-rose-50 transition-colors"><LogOut className="w-5 h-5" /></button>
          <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400 hover:text-slate-600 transition-colors active:scale-95"><Settings className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between px-1">
              <button onClick={() => setIsDatePickerOpen(true)} className="flex items-center gap-3 bg-white p-4 rounded-[28px] shadow-sm border border-white active:scale-95 transition-all">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${COLORS.primary}15` }}><CalendarDays className="w-5 h-5" style={{ color: COLORS.primary }} /></div>
                <div><p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">出貨日期</p><p className="font-bold text-slate-800">{selectedDate}</p></div>
              </button>
              <button onClick={() => setIsAddingOrder(true)} className="w-14 h-14 rounded-[24px] text-white shadow-lg active:scale-95 transition-all flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}><Plus className="w-8 h-8" /></button>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-gray-400 px-2 flex items-center gap-2 uppercase tracking-widest mb-2"><Layers className="w-4 h-4" /> 配送列表 [{selectedDate}] ({Object.keys(groupedOrders).length} 家)</h2>
              {Object.keys(groupedOrders).length > 0 ? (
                Object.entries(groupedOrders).map(([custName, custOrders]) => {
                  const isExpanded = expandedCustomer === custName;
                  
                  // --- 計算該客戶今日總金額與摘要字串 ---
                  const currentCustomer = customers.find(c => c.name === custName);
                  let totalAmount = 0;
                  const itemSummaries: string[] = [];

                  custOrders.forEach(o => {
                    o.items.forEach(item => {
                      const p = products.find(prod => prod.id === item.productId);
                      const pName = p?.name || item.productId;
                      const unit = item.unit || p?.unit || '斤';
                      
                      // 建立摘要文字 (例如: 油麵 10斤)
                      itemSummaries.push(`${pName} ${item.quantity}${unit}`);

                      // 計算金額
                      if (unit === '元') {
                        totalAmount += item.quantity;
                      } else {
                        const priceInfo = currentCustomer?.priceList?.find(pl => pl.productId === item.productId);
                        const price = priceInfo ? priceInfo.price : 0;
                        totalAmount += (item.quantity * price);
                      }
                    });
                  });
                  
                  const summaryText = itemSummaries.join('、');
                  // ---------------------------------------

                  return (
                    <div key={custName} className="bg-white rounded-[24px] shadow-sm border border-white overflow-hidden transition-all duration-300">
                      <button onClick={() => setExpandedCustomer(isExpanded ? null : custName)} className="w-full flex items-center justify-between p-5 text-left active:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg font-bold transition-colors ${isExpanded ? 'bg-sage-50 text-sage-600' : 'bg-gray-50 text-gray-400'}`} style={{ color: isExpanded ? COLORS.primary : '', backgroundColor: isExpanded ? `${COLORS.primary}20` : '' }}>{custName.charAt(0)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className={`font-bold text-lg truncate ${isExpanded ? 'text-slate-800' : 'text-slate-600'}`}>{custName}</h3>
                                {totalAmount > 0 && (
                                  <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-black flex-shrink-0">
                                    ${totalAmount.toLocaleString()}
                                  </span>
                                )}
                            </div>
                            {!isExpanded && (
                                <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">
                                  {summaryText || `${custOrders.reduce((sum, o) => sum + o.items.length, 0)} 個品項`}
                                </p>
                            )}
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-300 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-300 flex-shrink-0" />}
                      </button>
                      {isExpanded && (
                        <div className="bg-gray-50/50 border-t border-gray-100 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                          {custOrders.map((order) => (
                             <div key={order.id} className="relative group">
                               {order.items.map((item, itemIdx) => {
                                 const p = products.find(prod => prod.id === item.productId);
                                 return (
                                   <div key={`${order.id}-${itemIdx}`} className="flex justify-between items-center py-2 px-2 border-b border-gray-100 last:border-0 hover:bg-white rounded-lg transition-colors">
                                     <span className="font-bold text-slate-700">{p?.name || item.productId}</span>
                                     <div className="flex items-center gap-3"><span className="font-black text-xl text-slate-800">{item.quantity}</span><span className="text-xs text-gray-400 font-bold w-4">{item.unit || p?.unit || '斤'}</span></div>
                                   </div>
                                 );
                               })}
                               <div className="flex justify-end mt-1"><button onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }} className="text-[10px] text-rose-300 hover:text-rose-500 px-2 py-1 flex items-center gap-1"><Trash2 className="w-3 h-3" /> 刪除此單</button></div>
                             </div>
                          ))}
                          <button onClick={() => setQuickAddData({ customerName: custName, productId: '', quantity: 0 })} className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-sage-200 text-sage-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-sage-50 transition-colors" style={{ borderColor: `${COLORS.primary}40`, color: COLORS.primary }}><Plus className="w-4 h-4" /> 追加訂單</button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-20 flex flex-col items-center text-center gap-4"><ClipboardList className="w-16 h-16 text-gray-200" /><p className="text-gray-300 italic text-sm">此日期尚無訂單</p></div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Users className="w-5 h-5" style={{ color: COLORS.primary }} /> 店家管理</h2>
              <button onClick={() => { setCustomerForm({ name: '', phone: '', deliveryTime: '08:00', defaultItems: [], offDays: [], holidayDates: [], priceList: [], deliveryMethod: '' }); setIsEditingCustomer('new'); setTempPriceProdId(''); setTempPriceValue(''); setTempPriceUnit('斤'); }} className="p-3 rounded-2xl text-white shadow-lg" style={{ backgroundColor: COLORS.primary }}><Plus className="w-6 h-6" /></button>
            </div>
            <div className="relative mb-2">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input type="text" placeholder="搜尋店家名稱..." className="w-full pl-14 pr-6 py-4 bg-white rounded-[24px] border-none shadow-sm text-slate-800 font-bold focus:ring-2 focus:ring-[#8e9775] transition-all placeholder:text-gray-300" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
            </div>
            {filteredCustomers.map(c => (
              <div key={c.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3"><div className="w-14 h-14 rounded-[22px] bg-gray-50 flex items-center justify-center text-xl font-bold" style={{ color: COLORS.primary }}>{c.name.charAt(0)}</div><div><h3 className="font-bold text-slate-800 text-lg">{c.name}</h3><p className="text-xs text-slate-500 font-medium">{c.phone || '無電話'}</p></div></div>
                  <div className="flex flex-col items-end gap-1"><div className="flex gap-1">{WEEKDAYS.map(d => (<div key={d.value} className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold ${c.offDays?.includes(d.value) ? 'bg-rose-100 text-rose-400' : 'bg-gray-50 text-gray-300'}`}>{d.label}</div>))}</div>
                  {c.holidayDates && c.holidayDates.length > 0 && <span className="text-[8px] font-bold text-rose-300">+{c.holidayDates.length} 特定休</span>}
                  {c.priceList && c.priceList.length > 0 && <span className="text-[8px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded mt-1">已設 {c.priceList.length} 種單價</span>}
                  </div>
                </div>
                <div className="space-y-3 mb-4 bg-gray-50/60 p-4 rounded-[24px]">
                  <div className="flex justify-between">
                    <div className="text-[11px] font-bold text-slate-700">配送時間:{formatTimeDisplay(c.deliveryTime)}</div>
                    {c.deliveryMethod && <div className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-gray-100">{c.deliveryMethod}</div>}
                  </div>
                  {c.defaultItems && c.defaultItems.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100/50">{c.defaultItems.map((di, idx) => { const p = products.find(prod => prod.id === di.productId); return (<div key={idx} className="bg-white px-2 py-1 rounded-xl text-[10px] border border-gray-100 flex items-center gap-1 shadow-sm"><span className="font-bold text-slate-700">{p?.name || '未知品項'}</span><span className="font-black" style={{ color: COLORS.primary }}>{di.quantity}{di.unit || p?.unit || '斤'}</span></div>); })}</div>
                  ) : (<div className="text-[10px] text-gray-300 font-medium italic pt-2 border-t border-gray-100/50">尚未設定預設品項</div>)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setCustomerForm({ ...c, deliveryTime: formatTimeForInput(c.deliveryTime) }); setIsEditingCustomer(c.id); setTempPriceProdId(''); setTempPriceValue(''); setTempPriceUnit('斤'); }} className="flex-1 py-3 bg-gray-50 rounded-2xl text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"><Edit2 className="w-3.5 h-3.5" /> 編輯資料</button>
                  <button onClick={() => handleDeleteCustomer(c.id)} className="px-4 py-3 bg-gray-50 rounded-2xl text-rose-200 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {filteredCustomers.length === 0 && <div className="text-center py-10 text-gray-300 text-sm font-bold">查無店家</div>}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Package className="w-5 h-5" style={{ color: COLORS.primary }} /> 品項清單</h2>
              <button onClick={() => { setProductForm({ name: '', unit: '斤', price: 0 }); setIsEditingProduct('new'); }} className="p-3 rounded-2xl text-white shadow-lg" style={{ backgroundColor: COLORS.primary }}><Plus className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-white flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center" style={{ color: COLORS.primary }}><Box className="w-5 h-5" /></div>
                    <span className="font-bold text-slate-700">{p.name} <span className="text-[10px] text-gray-300 ml-1">({p.unit})</span></span>
                    {p.price && p.price > 0 && <span className="ml-2 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">${p.price}</span>}
                  </div>
                  <div className="flex gap-2"><button onClick={() => { setProductForm(p); setIsEditingProduct(p.id); }} className="p-2 text-gray-300 hover:text-slate-600 transition-colors"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-rose-100 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'work' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="px-1">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4"><FileText className="w-5 h-5" style={{ color: COLORS.primary }} /> 工作小抄</h2>
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input type="text" placeholder="篩選特定店家..." className="w-full pl-12 pr-6 py-4 bg-white rounded-[24px] border-none shadow-sm text-slate-800 font-bold focus:ring-2 focus:ring-[#8e9775] transition-all placeholder:text-gray-300 text-sm" value={workCustomerFilter} onChange={(e) => setWorkCustomerFilter(e.target.value)} />
                  {workCustomerFilter && <button onClick={() => setWorkCustomerFilter('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X className="w-4 h-4" /></button>}
                </div>
                
                {/* 配送方式篩選 */}
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar mb-2">
                  <button onClick={() => setWorkDeliveryMethodFilter([])} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${workDeliveryMethodFilter.length === 0 ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-gray-400 border-gray-100'}`}>全部方式</button>
                  {DELIVERY_METHODS.map(m => { const isSelected = workDeliveryMethodFilter.includes(m); return (<button key={m} onClick={() => { if (isSelected) { setWorkDeliveryMethodFilter(workDeliveryMethodFilter.filter(x => x !== m)); } else { setWorkDeliveryMethodFilter([...workDeliveryMethodFilter, m]); } }} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${isSelected ? 'text-white border-transparent' : 'bg-white text-gray-400 border-gray-100'}`} style={{ backgroundColor: isSelected ? COLORS.primary : '' }}>{m}</button>); })}
                </div>

                {/* 品項篩選 */}
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  <button onClick={() => setWorkProductFilter([])} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${workProductFilter.length === 0 ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-gray-400 border-gray-100'}`}>全部麵種</button>
                  {products.map(p => { const isSelected = workProductFilter.includes(p.name); return (<button key={p.id} onClick={() => { if (isSelected) { setWorkProductFilter(workProductFilter.filter(name => name !== p.name)); } else { setWorkProductFilter([...workProductFilter, p.name]); } }} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${isSelected ? 'text-white border-transparent' : 'bg-white text-gray-400 border-gray-100'}`} style={{ backgroundColor: isSelected ? COLORS.primary : '' }}>{p.name}</button>); })}
                </div>
              </div>
              <div className="mb-6"><WorkCalendar selectedDate={workDate} onSelect={setWorkDate} orders={orders} /></div>
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><ListChecks className="w-4 h-4" /> 生產總表 [{workDate}]</h3>
                  <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-gray-300">{workSheetData.length} 種品項</span><button onClick={handlePrint} className="bg-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-sm active:scale-95"><Printer className="w-3.5 h-3.5" /> 列印 / 匯出 PDF</button></div>
                </div>
                {workSheetData.length > 0 ? (
                  workSheetData.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-white">
                      <div className="p-5 flex justify-between items-center bg-gray-50/50"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm" style={{ color: COLORS.primary }}><span className="font-black text-lg">{idx + 1}</span></div><div><h3 className="font-bold text-slate-800 text-lg">{item.name}</h3><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">總需求量</p></div></div><div className="text-right"><span className="font-black text-3xl text-slate-800">{item.totalQty}</span><span className="text-xs text-gray-400 font-bold ml-1">{item.unit}</span></div></div>
                      <div className="p-4 bg-white space-y-2 border-t border-gray-100">{item.details.map((detail, dIdx) => (<div key={dIdx} className="flex justify-between items-center py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors"><span className="text-sm font-bold text-slate-600">{detail.customerName}</span><span className="text-sm font-bold text-slate-400">{detail.qty} {item.unit}</span></div>))}</div>
                    </div>
                  ))
                ) : (<div className="text-center py-10"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><WifiOff className="w-8 h-8 text-gray-300" /></div><p className="text-gray-300 font-bold text-sm">該日無生產需求</p><p className="text-xs text-gray-200 mt-1">請選擇其他日期或調整篩選條件</p></div>)}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- 彈窗模組 --- */}
      {isDatePickerOpen && <DatePickerModal selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsDatePickerOpen(false)} />}
      
      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          onSync={syncData}
          onSavePassword={handleChangePassword}
          currentUrl={apiEndpoint}
          onSaveUrl={handleSaveApiUrl}
        />
      )}
      
      {/* 確認對話框 (最上層) */}
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
      
      {quickAddData && (
        <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-xs rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
              <div className="p-5 bg-gray-50 border-b border-gray-100"><h3 className="text-center font-bold text-gray-800">追加訂單</h3><p className="text-center text-xs text-gray-400 font-bold">{quickAddData.customerName}</p></div>
              <div className="p-6 space-y-4">
                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-1">追加品項</label><select className="w-full bg-gray-50 p-4 rounded-xl font-bold text-slate-800 outline-none" value={quickAddData.productId} onChange={(e) => setQuickAddData({...quickAddData, productId: e.target.value})}><option value="">選擇品項...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-1">數量</label><div className="flex items-center gap-2"><button onClick={() => setQuickAddData({...quickAddData, quantity: Math.max(0, quickAddData.quantity - 5)})} className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">-</button><input type="number" className="flex-1 bg-gray-50 p-4 rounded-xl text-center font-black text-xl text-slate-800 outline-none" value={quickAddData.quantity} onChange={(e) => setQuickAddData({...quickAddData, quantity: parseInt(e.target.value) || 0})} /><button onClick={() => setQuickAddData({...quickAddData, quantity: quickAddData.quantity + 5})} className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">+</button></div></div>
              </div>
              <div className="p-4 flex gap-2"><button onClick={() => setQuickAddData(null)} className="flex-1 py-3 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-colors">取消</button><button onClick={handleQuickAddSubmit} className="flex-1 py-3 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95" style={{ backgroundColor: COLORS.primary }}>確認追加</button></div>
           </div>
        </div>
      )}

      {isAddingOrder && (
        <div className="fixed inset-0 bg-[#f4f1ea] z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10"><button onClick={() => setIsAddingOrder(false)} className="p-2 rounded-2xl bg-gray-50"><X className="w-6 h-6 text-gray-400" /></button><h2 className="text-lg font-bold text-slate-800">建立配送訂單</h2><button onClick={handleSaveOrder} disabled={isSaving} className="font-bold px-4 py-2 transition-colors" style={{ color: isSaving ? '#ccc' : COLORS.primary }}>{isSaving ? '儲存中...' : '儲存'}</button></div>
          <div className="p-6 space-y-6 overflow-y-auto pb-10">
            <div className="flex bg-white p-1 rounded-[24px] shadow-sm"><button onClick={() => setOrderForm({...orderForm, customerType: 'existing'})} className={`flex-1 py-4 rounded-[20px] text-xs font-bold transition-all ${orderForm.customerType === 'existing' ? 'bg-sage-600 text-white shadow-md' : 'text-gray-400'}`} style={{ backgroundColor: orderForm.customerType === 'existing' ? COLORS.primary : '' }}>現有客戶</button><button onClick={() => setOrderForm({...orderForm, customerType: 'retail', customerId: ''})} className={`flex-1 py-4 rounded-[20px] text-xs font-bold transition-all ${orderForm.customerType === 'retail' ? 'bg-sage-600 text-white shadow-md' : 'text-gray-400'}`} style={{ backgroundColor: orderForm.customerType === 'retail' ? COLORS.primary : '' }}>零售客戶</button></div>
            {orderForm.customerType === 'existing' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">配送店家 (今日營業)</label>
                <div className="relative">
                  <button onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)} className="w-full p-5 bg-white rounded-[24px] shadow-sm flex justify-between items-center font-bold text-slate-800 focus:ring-2 focus:ring-[#8e9775] transition-all"><span className="flex items-center gap-2">{orderForm.customerName || "選擇店家..."}{orderForm.customerName && groupedOrders[orderForm.customerName] && (<span className="bg-amber-400 text-white text-[9px] px-2 py-0.5 rounded-full">已建立</span>)}</span>{isCustomerDropdownOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}</button>
                  {isCustomerDropdownOpen && (
                    <div className="mt-2 bg-white rounded-[24px] shadow-lg border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {activeCustomersForDate.map(c => { const hasOrder = !!groupedOrders[c.name]; const isSelected = orderForm.customerId === c.id; return (<button key={c.id} onClick={() => handleSelectExistingCustomer(c.id)} className={`w-full p-4 rounded-[20px] text-xs font-bold text-left flex justify-between items-center transition-all ${isSelected ? 'bg-sage-600 text-white' : hasOrder ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'hover:bg-gray-50 text-slate-600'}`} style={{ backgroundColor: isSelected ? COLORS.primary : '' }}><span>{c.name}</span>{hasOrder && !isSelected && <span className="text-[9px] bg-amber-200 text-amber-800 px-2 py-1 rounded-full">已建立</span>}{isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}</button>); })}
                        {activeCustomersForDate.length === 0 && <div className="p-4 text-center text-gray-300 text-xs">今日無營業店家</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (<div className="space-y-2"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">客戶名稱</label><input type="text" className="w-full p-5 bg-white rounded-[24px] shadow-sm text-slate-800 font-bold border-none outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" placeholder="輸入零售名稱..." value={orderForm.customerName} onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})} /></div>)}
            
            <div className="space-y-2"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">配送設定</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input type="time" className="w-full p-5 bg-white rounded-[24px] shadow-sm text-slate-800 font-bold border-none outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" value={orderForm.deliveryTime} onChange={(e) => setOrderForm({...orderForm, deliveryTime: e.target.value})} />
              </div>
              <div className="flex-1">
                <select 
                   value={orderForm.deliveryMethod} 
                   onChange={(e) => setOrderForm({...orderForm, deliveryMethod: e.target.value})}
                   className="w-full h-full p-5 bg-white rounded-[24px] shadow-sm text-slate-800 font-bold border-none outline-none focus:ring-2 focus:ring-[#8e9775] transition-all appearance-none"
                >
                   <option value="">配送方式...</option>
                   {DELIVERY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div></div>

            <div className="space-y-4"><div className="flex justify-between items-center"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">品項明細</label><button onClick={() => setOrderForm({...orderForm, items: [...orderForm.items, {productId: '', quantity: 10, unit: '斤'}]})} className="text-[10px] font-bold" style={{ color: COLORS.primary }}><Plus className="w-3 h-3 inline mr-1" /> 增加品項</button></div>{orderForm.items.map((item, idx) => (<div key={idx} className="bg-white p-5 rounded-[28px] shadow-sm flex items-center gap-2 animate-in slide-in-from-right duration-200 flex-wrap"><select className="w-full sm:flex-1 bg-gray-50 p-4 rounded-xl text-sm font-bold border-none text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all mb-2 sm:mb-0" value={item.productId} onChange={(e) => { const n = [...orderForm.items]; n[idx].productId = e.target.value; setOrderForm({...orderForm, items: n}); }}><option value="">選擇品項...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="flex items-center gap-2 w-full sm:w-auto justify-between"><input type="number" className="w-20 bg-gray-50 p-4 rounded-xl text-center font-bold border-none text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" value={item.quantity} onChange={(e) => { const n = [...orderForm.items]; n[idx].quantity = parseInt(e.target.value)||0; setOrderForm({...orderForm, items: n}); }} />
            <select value={item.unit || '斤'} onChange={(e) => { const n = [...orderForm.items]; n[idx].unit = e.target.value; setOrderForm({...orderForm, items: n}); }} className="w-20 bg-gray-50 p-4 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all">{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select>
            <button onClick={() => { const n = orderForm.items.filter((_, i) => i !== idx); setOrderForm({...orderForm, items: n.length ? n : [{productId:'', quantity:10, unit:'斤'}]}); }} className="p-2 text-rose-100 hover:text-rose-300 transition-colors"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>

            {/* --- 新增：訂單預覽與金額試算區塊 --- */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">訂單預覽與金額試算</label>
              <div className="bg-amber-50 rounded-[24px] p-5 shadow-sm border border-amber-100/50">
                  <div className="flex justify-between items-center mb-3 border-b border-amber-100 pb-2">
                      <div className="flex items-center gap-2 text-amber-700">
                         <Calculator className="w-4 h-4" />
                         <span className="text-xs font-bold">預估清單</span>
                      </div>
                      <div className="text-xs font-bold text-amber-600/60">
                         共 {orderSummary.details.filter(d => d.rawQty > 0).length} 項
                      </div>
                  </div>
                  <div className="space-y-2 mb-4">
                      {orderSummary.details.filter(d => d.rawQty > 0).map((detail, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                             <div className="flex flex-col">
                                <span className="font-bold text-slate-700">{detail.name}</span>
                                {detail.isCalculated && (
                                   <span className="text-[10px] text-gray-400">
                                     (以單價 ${detail.unitPrice} 換算: {detail.rawQty}元 &rarr; {detail.displayQty}{detail.displayUnit})
                                   </span>
                                )}
                             </div>
                             <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-600">
                                   {detail.displayQty} {detail.displayUnit}
                                </span>
                                <span className="font-black text-amber-600 w-12 text-right">
                                   ${detail.subtotal}
                                </span>
                             </div>
                          </div>
                      ))}
                      {orderSummary.details.filter(d => d.rawQty > 0).length === 0 && (
                          <div className="text-center text-xs text-amber-400 italic py-2">尚未加入有效品項</div>
                      )}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-amber-200">
                      <span className="text-xs font-bold text-amber-700">預估總金額</span>
                      <span className="text-xl font-black text-amber-600">${orderSummary.totalPrice}</span>
                  </div>
              </div>
            </div>

            <div className="space-y-2"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">訂單備註</label><textarea className="w-full p-5 bg-white rounded-[24px] shadow-sm text-slate-700 font-bold border-none resize-none outline-none focus:ring-2 focus:ring-[#8e9775] transition-all placeholder:text-gray-300" rows={3} placeholder="備註特殊需求..." value={orderForm.note} onChange={(e) => setOrderForm({...orderForm, note: e.target.value})} /></div>
          </div>
        </div>
      )}

      {isEditingCustomer && (
        <div className="fixed inset-0 bg-[#f4f1ea] z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10"><button onClick={() => setIsEditingCustomer(null)} className="p-2 rounded-2xl bg-gray-50"><X className="w-6 h-6 text-gray-400" /></button><h2 className="text-lg font-bold text-slate-800">店家詳細資料</h2><button onClick={handleSaveCustomer} disabled={isSaving} className="font-bold px-4 py-2 transition-colors" style={{ color: isSaving ? '#ccc' : COLORS.primary }}>完成儲存</button></div>
          <div className="p-6 space-y-6 overflow-y-auto pb-10">
            <div className="space-y-2"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">基本資訊</label><div className="space-y-4"><input type="text" className="w-full p-5 bg-white rounded-[24px] shadow-sm border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" placeholder="店名" value={customerForm.name || ''} onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})} /><input type="tel" className="w-full p-5 bg-white rounded-[24px] shadow-sm border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" placeholder="電話" value={customerForm.phone || ''} onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})} /></div></div>

            <div className="space-y-2"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">配送設定</label>
            <div className="space-y-4">
               {/* 新增：配送方式 */}
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-400 pl-1">配送方式</label>
                 <select 
                    value={customerForm.deliveryMethod || ''} 
                    onChange={(e) => setCustomerForm({...customerForm, deliveryMethod: e.target.value})}
                    className="w-full p-5 bg-white rounded-[24px] shadow-sm border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all appearance-none"
                 >
                    <option value="">選擇配送方式...</option>
                    {DELIVERY_METHODS.map(method => (
                       <option key={method} value={method}>{method}</option>
                    ))}
                 </select>
               </div>

               <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 pl-1">配送時間</label><input type="time" className="w-full p-5 bg-white rounded-[24px] shadow-sm border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" value={customerForm.deliveryTime || '08:00'} onChange={(e) => setCustomerForm({...customerForm, deliveryTime: e.target.value})} /></div>
               
               <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 pl-1">每週公休</label>
               <div className="flex gap-2">{WEEKDAYS.map(d => {
                  const isOff = (customerForm.offDays || []).includes(d.value);
                  return (<button key={d.value} onClick={() => {
                     const current = customerForm.offDays || [];
                     const newOff = isOff ? current.filter(x => x !== d.value) : [...current, d.value];
                     setCustomerForm({...customerForm, offDays: newOff});
                  }} className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${isOff ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-gray-400'}`}>{d.label}</button>);
               })}</div></div>

               <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 pl-1">特定公休</label>
               <div className="flex flex-wrap gap-2">
                 {(customerForm.holidayDates || []).map(date => (
                    <span key={date} className="bg-rose-50 text-rose-500 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">{date} <button onClick={() => setCustomerForm({...customerForm, holidayDates: customerForm.holidayDates?.filter(d => d !== date)})}><X className="w-3 h-3" /></button></span>
                 ))}
                 <button onClick={() => setHolidayEditorId('new')} className="bg-gray-100 text-gray-400 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gray-200"><Plus className="w-3 h-3" /> 新增日期</button>
               </div></div>
            </div></div>

            <div className="space-y-2"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">預設品項</label>
            <div className="space-y-3">
               {(customerForm.defaultItems || []).map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                     <select className="flex-1 p-3 bg-white rounded-xl text-sm font-bold text-slate-700 outline-none" value={item.productId} onChange={(e) => {
                        const newItems = [...(customerForm.defaultItems || [])];
                        newItems[idx] = { ...item, productId: e.target.value };
                        setCustomerForm({...customerForm, defaultItems: newItems});
                     }}><option value="">選擇品項</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                     <input type="number" className="w-16 p-3 bg-white rounded-xl text-center font-bold text-slate-700 outline-none" value={item.quantity} onChange={(e) => {
                        const newItems = [...(customerForm.defaultItems || [])];
                        newItems[idx].quantity = Number(e.target.value);
                        setCustomerForm({...customerForm, defaultItems: newItems});
                     }} />
                     <select value={item.unit || '斤'} onChange={(e) => {
                        const newItems = [...(customerForm.defaultItems || [])];
                        newItems[idx].unit = e.target.value;
                        setCustomerForm({...customerForm, defaultItems: newItems});
                     }} className="w-20 p-3 bg-white rounded-xl font-bold text-slate-700 outline-none">
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                     </select>
                     <button onClick={() => setCustomerForm({...customerForm, defaultItems: customerForm.defaultItems?.filter((_, i) => i !== idx)})} className="p-3 bg-rose-50 text-rose-400 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                  </div>
               ))}
               <button onClick={() => setCustomerForm({...customerForm, defaultItems: [...(customerForm.defaultItems || []), {productId: '', quantity: 10, unit: '斤'}]})} className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-gray-400 font-bold text-xs flex items-center justify-center gap-1 hover:bg-gray-50"><Plus className="w-4 h-4" /> 新增預設品項</button>
            </div></div>

            <div className="space-y-2"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">專屬價目表</label>
            <div className="bg-amber-50 p-4 rounded-[24px] space-y-3">
               <div className="flex gap-2">
                  <select className="flex-1 p-3 bg-white rounded-xl text-sm font-bold text-slate-700 outline-none" value={tempPriceProdId} onChange={(e) => setTempPriceProdId(e.target.value)}><option value="">選擇品項...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <input type="number" placeholder="單價" className="w-20 p-3 bg-white rounded-xl text-center font-bold text-slate-700 outline-none" value={tempPriceValue} onChange={(e) => setTempPriceValue(e.target.value)} />
                  <select value={tempPriceUnit} onChange={(e) => setTempPriceUnit(e.target.value)} className="w-20 p-3 bg-white rounded-xl font-bold text-slate-700 outline-none">
                     {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button onClick={() => {
                     if(tempPriceProdId && tempPriceValue) {
                        const newPriceList = [...(customerForm.priceList || [])];
                        const existingIdx = newPriceList.findIndex(x => x.productId === tempPriceProdId);
                        if(existingIdx >= 0) {
                           newPriceList[existingIdx].price = Number(tempPriceValue);
                           newPriceList[existingIdx].unit = tempPriceUnit;
                        } else {
                           newPriceList.push({productId: tempPriceProdId, price: Number(tempPriceValue), unit: tempPriceUnit});
                        }
                        setCustomerForm({...customerForm, priceList: newPriceList});
                        setTempPriceProdId(''); setTempPriceValue(''); setTempPriceUnit('斤');
                     }
                  }} className="p-3 bg-amber-400 text-white rounded-xl shadow-sm"><Plus className="w-4 h-4" /></button>
               </div>
               <div className="space-y-2">
                  {(customerForm.priceList || []).map((pl, idx) => {
                     const p = products.find(prod => prod.id === pl.productId);
                     return (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                           <span className="text-sm font-bold text-slate-700">{p?.name || pl.productId}</span>
                           <div className="flex items-center gap-3">
                              <span className="font-black text-amber-500">${pl.price} <span className="text-xs text-gray-400">/ {pl.unit || '斤'}</span></span>
                              <button onClick={() => setCustomerForm({...customerForm, priceList: customerForm.priceList?.filter((_, i) => i !== idx)})} className="text-gray-300 hover:text-rose-400"><X className="w-4 h-4" /></button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div></div>
          </div>
        </div>
      )}

      {isEditingProduct && (
         <div className="fixed inset-0 bg-[#f4f1ea] z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
           <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10"><button onClick={() => setIsEditingProduct(null)} className="p-2 rounded-2xl bg-gray-50"><X className="w-6 h-6 text-gray-400" /></button><h2 className="text-lg font-bold text-slate-800">品項資料</h2><button onClick={handleSaveProduct} disabled={isSaving} className="font-bold px-4 py-2 transition-colors" style={{ color: isSaving ? '#ccc' : COLORS.primary }}>完成儲存</button></div>
           <div className="p-6 space-y-6">
              <div className="space-y-2"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">品項名稱</label><input type="text" className="w-full p-5 bg-white rounded-[24px] shadow-sm border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" placeholder="例如：油麵 (小)" value={productForm.name || ''} onChange={(e) => setProductForm({...productForm, name: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">計算單位</label><input type="text" className="w-full p-5 bg-white rounded-[24px] shadow-sm border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" placeholder="例如：斤" value={productForm.unit || ''} onChange={(e) => setProductForm({...productForm, unit: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">預設單價</label><input type="number" className="w-full p-5 bg-white rounded-[24px] shadow-sm border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" placeholder="例如：35" value={productForm.price || ''} onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})} /></div>
           </div>
         </div>
      )}
      
      {holidayEditorId && (
         <HolidayCalendar 
            storeName={isEditingCustomer ? (customerForm.name || '') : ''}
            holidays={customerForm.holidayDates || []}
            onToggle={(date) => {
               const current = customerForm.holidayDates || [];
               const newHolidays = current.includes(date) ? current.filter(d => d !== date) : [...current, date];
               setCustomerForm({...customerForm, holidayDates: newHolidays});
            }}
            onClose={() => setHolidayEditorId(null)}
         />
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 flex justify-around py-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <NavItem active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ClipboardList className="w-6 h-6" />} label="訂單" />
        <NavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={<Users className="w-6 h-6" />} label="客戶" />
        <NavItem active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package className="w-6 h-6" />} label="品項" />
        <NavItem active={activeTab === 'work'} onClick={() => setActiveTab('work')} icon={<FileText className="w-6 h-6" />} label="小抄" />
      </nav>

    </div>
  );
};

export default App;