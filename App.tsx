
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Truck,
  CalendarCheck,
  Copy,
  MapPin,
  Banknote,
  Share2,
  CheckSquare,
  Square,
  GripVertical,
  Wallet,
  CalendarRange,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence, Variants, Reorder, useDragControls } from 'framer-motion';
import { Customer, Product, Order, OrderStatus, OrderItem, GASResponse, DefaultItem, CustomerPrice } from './types';
import { COLORS, WEEKDAYS, GAS_URL as DEFAULT_GAS_URL, UNITS, DELIVERY_METHODS, PAYMENT_TERMS } from './constants';

// --- Toast Types ---
type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// --- Animation Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    } 
  }
};

const modalVariants: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 }
  },
  exit: { 
    opacity: 0, 
    y: "100%",
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

// Haptic Feedback Helper
const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10); // Light tap
  }
};

const buttonTap = { scale: 0.96, transition: { onTap: triggerHaptic } };
const buttonHover = { scale: 1.02 };

// ... (保留 getStatusStyles, normalizeDate, formatDateStr, getTomorrowDate, getLastMonthEndDate, safeJsonArray, formatTimeDisplay, formatTimeForInput 等工具函數)
const getStatusStyles = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PAID:
      return {
        cardBg: '#E8F0EB', // 淺豆沙綠 (Light Sage)
        cardBorder: '#CZDCD4',
        tagBg: '#BCCFC6',
        tagText: '#4A6356',
        iconColor: '#4A6356',
        label: '已收款'
      };
    case OrderStatus.SHIPPED:
      return {
        cardBg: '#F7F3E8', // 淺米杏色 (Light Beige/Latte)
        cardBorder: '#EADBC8',
        tagBg: '#E0C9A6', 
        tagText: '#8D7B68',
        iconColor: '#8D7B68',
        label: '已出貨'
      };
    case OrderStatus.PENDING:
    default:
      return {
        cardBg: '#FFFFFF', // 純白 (White)
        cardBorder: '#F1F5F9', // Slate-100
        tagBg: '#F1F5F9', // Slate-100
        tagText: '#94A3B8', // Slate-400
        iconColor: '#CBD5E1',
        label: '待處理'
      };
  }
};

const normalizeDate = (dateStr: any) => {
  if (!dateStr) return '';
  try {
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

const getLastMonthEndDate = () => {
  const date = new Date();
  date.setDate(0); 
  return formatDateStr(date);
};

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

const formatTimeDisplay = (time: any) => {
  if (!time) return '未設定';
  const date = new Date(time);
  if (!isNaN(date.getTime()) && String(time).includes('-')) {
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  const str = String(time).trim();
  const parts = str.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    if (!isNaN(h) && h >= 0 && h < 24) {
       const m = parts[1].substring(0, 2);
       return `${h}:${m}`;
    }
  }
  return str;
};

const formatTimeForInput = (time: any) => {
  if (!time) return '08:00';
  const date = new Date(time);
  if (!isNaN(date.getTime()) && String(time).includes('-')) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
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

// --- Sortable Product Item Component ---
const SortableProductItem: React.FC<{
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}> = ({ product, onEdit, onDelete }) => {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      value={product} 
      id={product.id}
      dragListener={false} 
      dragControls={controls}
      className="relative"
    >
      <motion.div 
        layout 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileDrag={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)", zIndex: 10 }}
        className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200 flex justify-between items-center mb-4 active:cursor-grabbing"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-morandi-oatmeal flex items-center justify-center text-morandi-blue">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-800 tracking-wide block">{product.name}</span>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-1.5 py-0.5 rounded">
                 單位: {product.unit}
               </span>
               {product.price && product.price > 0 && (
                 <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full tracking-wide">
                   ${product.price}
                 </span>
               )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <motion.button whileTap={buttonTap} onClick={() => onEdit(product)} className="p-2 text-gray-300 hover:text-slate-600 transition-colors">
            <Edit2 className="w-4 h-4" />
          </motion.button>
          <motion.button whileTap={buttonTap} onClick={() => onDelete(product.id)} className="p-2 text-rose-100 hover:text-rose-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </motion.button>
          <div 
            onPointerDown={(e) => controls.start(e)}
            className="p-2 text-morandi-pebble/50 cursor-grab active:cursor-grabbing touch-none hover:text-morandi-blue transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        </div>
      </motion.div>
    </Reorder.Item>
  );
};

// ... (LoginScreen, ConfirmModal, HolidayCalendar, WorkCalendar, DatePickerModal, SettingsModal, NavItem components remain the same)
// ... (為了節省篇幅，這部分不重複，但實際檔案中必須保留)

// --- LoginScreen ---
const LoginScreen: React.FC<{ onLogin: (password: string) => Promise<boolean> }> = ({ onLogin }) => {
  // ... (保留 LoginScreen 內容)
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal) return;
    setLoading(true);
    setError(false);
    try {
      const success = await onLogin(inputVal);
      if (!success) {
        setError(true);
        setInputVal('');
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-morandi-oatmeal p-6 relative overflow-hidden font-sans">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-morandi-blue rounded-full opacity-10 blur-3xl" />
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }} className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-morandi-pink rounded-full opacity-10 blur-3xl" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-white/80 backdrop-blur-md p-8 rounded-[32px] shadow-lg w-full max-w-sm border border-white/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-morandi-blue rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg rotate-3"><ClipboardList className="w-8 h-8" /></div>
          <h1 className="text-3xl font-extrabold text-morandi-charcoal tracking-tight">麵廠職人</h1>
          <p className="text-xs text-morandi-pebble font-bold uppercase tracking-[0.2em] mt-2">系統登入</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-morandi-pebble" />
              <input type="password" placeholder="請輸入系統密碼" className={`w-full pl-14 pr-6 py-4 bg-morandi-oatmeal/50 rounded-[20px] border border-slate-200 text-morandi-charcoal font-bold tracking-wide focus:ring-4 focus:ring-morandi-blue/20 focus:border-morandi-blue transition-all outline-none ${error ? 'border-rose-200 focus:border-rose-400' : ''}`} value={inputVal} onChange={(e) => { setInputVal(e.target.value); setError(false); }} autoFocus disabled={loading} />
            </div>
            <AnimatePresence>
              {error && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 px-2 text-rose-500 overflow-hidden"><AlertCircle className="w-3.5 h-3.5" /><span className="text-xs font-bold tracking-wide">密碼錯誤，請重新輸入</span></motion.div>)}
            </AnimatePresence>
          </div>
          <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} className="w-full py-4 rounded-[20px] bg-morandi-blue text-white font-bold text-lg shadow-md hover:bg-slate-600 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100">{loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> 驗證中...</>) : (<>進入系統 <ChevronRight className="w-5 h-5" /></>)}</motion.button>
        </form>
        <div className="mt-10 text-center"><p className="text-[10px] text-morandi-pebble tracking-wide">© 2025 Noodle Factory Manager</p></div>
      </motion.div>
    </div>
  );
};

// --- ConfirmModal ---
const ConfirmModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-morandi-charcoal/40 z-[110] flex items-center justify-center p-6 backdrop-blur-sm">
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-morandi-paper w-full max-w-xs rounded-[24px] overflow-hidden shadow-xl border border-white/50">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-400 mb-2"><AlertTriangle className="w-7 h-7" /></div>
              <h3 className="text-xl font-extrabold text-morandi-charcoal tracking-tight">{title}</h3>
              <p className="text-sm text-morandi-pebble font-medium leading-relaxed tracking-wide px-2 whitespace-pre-line">{message}</p>
            </div>
            <div className="p-4 flex gap-3 bg-morandi-oatmeal/30">
              <motion.button whileTap={buttonTap} onClick={onCancel} className="flex-1 py-3 rounded-[16px] font-bold text-morandi-pebble bg-white shadow-sm border border-slate-200 tracking-wide">取消</motion.button>
              <motion.button whileTap={buttonTap} onClick={onConfirm} className="flex-1 py-3 rounded-[16px] font-bold text-white shadow-md bg-rose-400 tracking-wide">確認</motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ... (HolidayCalendar, WorkCalendar, DatePickerModal, SettingsModal, NavItem 保持不變，為節省空間省略，實作時請保留原內容)
const HolidayCalendar: React.FC<{ holidays: string[]; onToggle: (dateStr: string) => void; onClose: () => void; storeName: string; }> = ({ holidays, onToggle, onClose, storeName }) => { const [viewDate, setViewDate] = useState(new Date()); const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate(); const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); const calendarDays = useMemo(() => { const year = viewDate.getFullYear(); const month = viewDate.getMonth(); const days = []; const totalDays = daysInMonth(year, month); const startOffset = firstDayOfMonth(year, month); for (let i = 0; i < startOffset; i++) days.push({ day: null }); for (let i = 1; i <= totalDays; i++) { const date = new Date(year, month, i); days.push({ day: i, dateStr: formatDateStr(date) }); } return days; }, [viewDate]); return (<div className="fixed inset-0 bg-morandi-charcoal/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", duration: 0.3 }} className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-xl border border-slate-200"><div className="p-6 border-b border-gray-100 flex justify-between items-center bg-morandi-oatmeal/30"><div><h3 className="font-extrabold text-morandi-charcoal text-lg tracking-tight">{storeName}</h3><p className="text-[10px] text-morandi-pebble font-bold uppercase tracking-widest mt-0.5">特定公休日編輯</p></div><button onClick={onClose} className="p-2 bg-white rounded-2xl shadow-sm border border-slate-100 text-morandi-pebble hover:text-morandi-charcoal"><X className="w-5 h-5" /></button></div><div className="p-6"><div className="flex justify-between items-center mb-6"><button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 bg-morandi-oatmeal rounded-xl"><ChevronLeft className="w-6 h-6 text-morandi-pebble" /></button><h4 className="font-bold text-morandi-charcoal">{viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月</h4><button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 bg-morandi-oatmeal rounded-xl"><ChevronRight className="w-6 h-6 text-morandi-pebble" /></button></div><div className="grid grid-cols-7 gap-2 text-center">{WEEKDAYS.map(d => (<div key={d.value} className="text-[10px] font-bold text-morandi-pebble uppercase py-2">{d.label}</div>))}{calendarDays.map((item, idx) => { const isHoliday = item.dateStr && holidays.includes(item.dateStr); return (<motion.div key={idx} whileTap={{ scale: 0.8 }} onClick={() => item.dateStr && onToggle(item.dateStr)} className={`aspect-square flex items-center justify-center text-sm font-medium rounded-xl cursor-pointer transition-colors border ${!item.day ? 'opacity-0 pointer-events-none' : ''} ${isHoliday ? 'bg-rose-50 border-rose-200 text-rose-500 font-bold' : 'bg-white border-transparent text-morandi-charcoal hover:bg-morandi-oatmeal'}`}>{item.day}</motion.div>); })}</div></div><div className="p-6 bg-morandi-oatmeal/30 flex justify-end"><motion.button whileTap={buttonTap} onClick={onClose} className="px-8 py-3 rounded-[16px] bg-morandi-blue text-white font-bold shadow-lg tracking-wide">完成設定</motion.button></div></motion.div></div>); };
const WorkCalendar: React.FC<{ selectedDate: string | string[]; onSelect: (date: any) => void; orders: Order[]; }> = ({ selectedDate, onSelect, orders }) => { const isMulti = Array.isArray(selectedDate); const baseDateStr = isMulti ? (selectedDate[0] || getTomorrowDate()) : (selectedDate as string); const parseLocalDate = (dateStr: string) => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); }; const [viewDate, setViewDate] = useState(parseLocalDate(baseDateStr)); const datesWithOrders = useMemo(() => { const set = new Set(orders.map(o => o.deliveryDate)); return set; }, [orders]); const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate(); const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); const calendarDays = useMemo(() => { const year = viewDate.getFullYear(); const month = viewDate.getMonth(); const days = []; const totalDays = daysInMonth(year, month); const startOffset = firstDayOfMonth(year, month); for (let i = 0; i < startOffset; i++) days.push({ day: null }); for (let i = 1; i <= totalDays; i++) { const date = new Date(year, month, i); days.push({ day: i, dateStr: formatDateStr(date) }); } return days; }, [viewDate]); const handleDateClick = (dateStr: string) => { if (isMulti) { const current = selectedDate as string[]; if (current.includes(dateStr)) { onSelect(current.filter(d => d !== dateStr)); } else { onSelect([...current, dateStr].sort()); } } else { onSelect(dateStr); } }; return (<div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200"><div className="flex justify-between items-center mb-4"><button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 bg-morandi-oatmeal rounded-xl"><ChevronLeft className="w-5 h-5 text-morandi-pebble" /></button><h4 className="font-bold text-morandi-charcoal text-sm tracking-wide">{viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月</h4><button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 bg-morandi-oatmeal rounded-xl"><ChevronRight className="w-5 h-5 text-morandi-pebble" /></button></div><div className="grid grid-cols-7 gap-1 text-center">{WEEKDAYS.map(d => (<div key={d.value} className="text-[10px] font-bold text-morandi-pebble uppercase py-2">{d.label}</div>))}{calendarDays.map((item, idx) => { const isSelected = isMulti ? (selectedDate as string[]).includes(item.dateStr || '') : item.dateStr === selectedDate; const hasOrder = item.dateStr && datesWithOrders.has(item.dateStr); return (<motion.div key={idx} whileTap={{ scale: 0.9 }} onClick={() => item.dateStr && handleDateClick(item.dateStr)} className={`aspect-square flex flex-col items-center justify-center text-sm font-medium rounded-xl cursor-pointer transition-colors border relative ${!item.day ? 'opacity-0 pointer-events-none' : 'hover:bg-morandi-oatmeal'} ${isSelected ? 'bg-morandi-blue text-white font-bold shadow-md' : 'bg-white border-transparent text-morandi-charcoal'}`}><span className="z-10">{item.day}</span>{hasOrder && !isSelected && (<span className="w-1 h-1 rounded-full bg-amber-400 absolute bottom-2"></span>)}{hasOrder && isSelected && (<span className="w-1 h-1 rounded-full bg-white/60 absolute bottom-2"></span>)}</motion.div>); })}</div></div>); };
const DatePickerModal: React.FC<{ selectedDate: string; onSelect: (date: string) => void; onClose: () => void; }> = ({ selectedDate, onSelect, onClose }) => { const parseLocalDate = (dateStr: string) => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); }; const [viewDate, setViewDate] = useState(parseLocalDate(selectedDate)); const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate(); const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); const calendarDays = useMemo(() => { const year = viewDate.getFullYear(); const month = viewDate.getMonth(); const days = []; const totalDays = daysInMonth(year, month); const startOffset = firstDayOfMonth(year, month); for (let i = 0; i < startOffset; i++) days.push({ day: null }); for (let i = 1; i <= totalDays; i++) { const date = new Date(year, month, i); days.push({ day: i, dateStr: formatDateStr(date) }); } return days; }, [viewDate]); return (<div className="fixed inset-0 bg-morandi-charcoal/40 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"><motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-xl"><div className="p-6 border-b border-gray-100 flex justify-between items-center bg-morandi-oatmeal/30"><h3 className="font-extrabold text-morandi-charcoal text-lg tracking-tight">選擇配送日期</h3><button onClick={onClose} className="p-2 bg-white rounded-2xl shadow-sm border border-slate-100"><X className="w-5 h-5 text-morandi-pebble" /></button></div><div className="p-6"><div className="flex justify-between items-center mb-6"><button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 bg-morandi-oatmeal rounded-xl"><ChevronLeft className="w-6 h-6 text-morandi-pebble" /></button><h4 className="font-bold text-morandi-charcoal">{viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月</h4><button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 bg-morandi-oatmeal rounded-xl"><ChevronRight className="w-6 h-6 text-morandi-pebble" /></button></div><div className="grid grid-cols-7 gap-2 text-center">{WEEKDAYS.map(d => (<div key={d.value} className="text-[10px] font-bold text-morandi-pebble uppercase py-2">{d.label}</div>))}{calendarDays.map((item, idx) => { const isSelected = item.dateStr === selectedDate; return (<motion.div key={idx} whileTap={{ scale: 0.8 }} onClick={() => item.dateStr && (onSelect(item.dateStr), onClose())} className={`aspect-square flex items-center justify-center text-sm font-medium rounded-xl cursor-pointer transition-all border ${!item.day ? 'opacity-0 pointer-events-none' : 'hover:bg-morandi-oatmeal'} ${isSelected ? 'bg-morandi-blue text-white font-bold' : 'bg-white border-transparent text-morandi-charcoal'}`}>{item.day}</motion.div>); })}</div></div></motion.div></div>); };
const SettingsModal: React.FC<{ onClose: () => void; onSync: () => void; onSavePassword: (oldPwd: string, newPwd: string) => Promise<boolean>; currentUrl: string; onSaveUrl: (newUrl: string) => void; }> = ({ onClose, onSync, onSavePassword, currentUrl, onSaveUrl }) => { const [oldPassword, setOldPassword] = useState(''); const [newPassword, setNewPassword] = useState(''); const [inputUrl, setInputUrl] = useState(currentUrl); const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle'); const [urlSaveStatus, setUrlSaveStatus] = useState<'idle' | 'success'>('idle'); const handlePasswordSubmit = async () => { if (!oldPassword) { alert('請輸入原密碼'); return; } if (newPassword.length < 4) { alert('新密碼長度請至少輸入 4 碼'); return; } setSaveStatus('loading'); try { const success = await onSavePassword(oldPassword, newPassword); if (success) { setSaveStatus('success'); setOldPassword(''); setNewPassword(''); setTimeout(() => setSaveStatus('idle'), 2000); } else { setSaveStatus('error'); alert('原密碼錯誤，無法變更密碼'); } } catch (e) { setSaveStatus('error'); alert('變更密碼失敗，請檢查網路連線'); } }; const handleUrlSubmit = () => { if (!inputUrl.startsWith('http')) { alert('請輸入有效的網址 (http 開頭)'); return; } onSaveUrl(inputUrl); setUrlSaveStatus('success'); setTimeout(() => setUrlSaveStatus('idle'), 2000); }; return (<div className="fixed inset-0 bg-morandi-charcoal/40 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"><motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-xl h-[85vh] sm:h-auto overflow-y-auto"><div className="p-6 border-b border-gray-100 flex justify-between items-center bg-morandi-oatmeal/30 sticky top-0 z-10"><div><h3 className="font-extrabold text-morandi-charcoal text-lg tracking-tight">系統設定</h3><p className="text-[10px] text-morandi-pebble font-bold uppercase tracking-widest mt-0.5">Settings</p></div><button onClick={onClose} className="p-2 bg-white rounded-2xl shadow-sm text-morandi-pebble border border-slate-100"><X className="w-5 h-5" /></button></div><div className="p-6 space-y-8"><section className="space-y-3"><h4 className="text-xs font-bold text-morandi-pebble uppercase tracking-widest flex items-center gap-2"><RefreshCw className="w-4 h-4" /> 資料同步</h4><div className="bg-morandi-oatmeal/50 p-5 rounded-[24px] border border-slate-100"><p className="text-xs text-morandi-charcoal/80 mb-4 font-bold leading-relaxed tracking-wide">若發現資料與雲端不同步（例如其他裝置已更新），可點擊下方按鈕強制重新讀取。</p><motion.button whileTap={buttonTap} onClick={() => { onSync(); onClose(); }} className="w-full py-4 rounded-[16px] bg-slate-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg tracking-wide"><RefreshCw className="w-5 h-5" /> 強制同步雲端資料</motion.button></div></section><section className="space-y-3"><h4 className="text-xs font-bold text-morandi-pebble uppercase tracking-widest flex items-center gap-2"><LinkIcon className="w-4 h-4" /> 伺服器連線 (GAS URL)</h4><div className="bg-morandi-oatmeal/50 p-5 rounded-[24px] space-y-4 border border-slate-100"><p className="text-[10px] text-morandi-charcoal/60 font-bold leading-relaxed tracking-wide">請將您 Google Apps Script 部署後的 Web App URL 貼於此處，以確保資料正確寫入您的試算表。</p><textarea className="w-full p-3 rounded-2xl border border-slate-200 text-[10px] text-slate-600 font-mono bg-white h-20 resize-none outline-none focus:ring-2 focus:ring-morandi-blue shadow-sm" placeholder="https://script.google.com/macros/s/..." value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} /><motion.button whileTap={buttonTap} onClick={handleUrlSubmit} className={`w-full py-3 rounded-[16px] font-bold flex items-center justify-center gap-2 transition-all tracking-wide ${urlSaveStatus === 'success' ? 'bg-morandi-green-text text-white' : 'bg-white text-slate-600 shadow-sm border border-slate-200'}`}>{urlSaveStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}{urlSaveStatus === 'success' ? '網址已更新' : '儲存連線網址'}</motion.button></div></section><section className="space-y-3"><h4 className="text-xs font-bold text-morandi-pebble uppercase tracking-widest flex items-center gap-2"><Lock className="w-4 h-4" /> 安全性設定</h4><div className="bg-morandi-oatmeal/50 p-5 rounded-[24px] space-y-4 border border-slate-100"><div className="space-y-3"><div className="space-y-1"><label className="text-[10px] font-bold text-morandi-pebble pl-1">原密碼</label><div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-morandi-pebble" /><input type="password" placeholder="輸入目前密碼" className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl text-morandi-charcoal font-bold text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-morandi-blue transition-all tracking-wide" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} disabled={saveStatus === 'loading'} /></div></div><div className="space-y-1"><label className="text-[10px] font-bold text-morandi-pebble pl-1">新密碼</label><div className="relative"><Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-morandi-pebble" /><input type="text" placeholder="輸入新密碼" className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl text-morandi-charcoal font-bold text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-morandi-blue transition-all tracking-wide" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={saveStatus === 'loading'} /></div></div></div><motion.button whileTap={buttonTap} onClick={handlePasswordSubmit} disabled={saveStatus === 'loading'} className={`w-full py-3 rounded-[16px] font-bold flex items-center justify-center gap-2 transition-all tracking-wide ${saveStatus === 'success' ? 'bg-morandi-green-text text-white' : 'bg-white text-slate-600 shadow-sm border border-slate-200'} ${saveStatus === 'loading' ? 'opacity-70' : ''}`}>{saveStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : saveStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saveStatus === 'success' ? '密碼已更新' : saveStatus === 'loading' ? '更新中...' : '儲存新密碼'}</motion.button></div></section><div className="text-center pt-4 border-t border-gray-100"><p className="text-[10px] text-morandi-pebble font-bold tracking-wide">Noodle Factory Manager v1.7 (Secured)</p></div></div></motion.div></div>); };
const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; }> = ({ active, onClick, icon, label }) => ( <motion.button onClick={onClick} whileTap={{ scale: 0.9 }} className={`group flex flex-col items-center justify-center w-full transition-all duration-300 ${active ? '-translate-y-1' : 'opacity-40 hover:opacity-70'}`}> <motion.div className={`w-12 h-12 rounded-[20px] flex items-center justify-center mb-1 transition-all duration-300 ${active ? 'text-white shadow-lg' : 'text-morandi-pebble group-hover:bg-morandi-oatmeal/50'}`} style={{ backgroundColor: active ? COLORS.primary : 'transparent', }} animate={{ scale: active ? 1.1 : 1, backgroundColor: active ? COLORS.primary : 'rgba(0,0,0,0)' }}> {icon} </motion.div> <span className={`text-[10px] font-bold tracking-widest transition-colors ${active ? 'text-morandi-charcoal' : 'text-morandi-pebble'}`}> {label} </span> </motion.button> );

// --- New Component: Toast Notification ---
const ToastNotification: React.FC<{
  toasts: Toast[];
  removeToast: (id: string) => void;
}> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-[90px] left-0 right-0 z-[150] flex flex-col items-center gap-2 pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            onClick={() => removeToast(toast.id)}
            className={`
              pointer-events-auto cursor-pointer shadow-lg shadow-black/5 rounded-full px-5 py-3 flex items-center gap-3 min-w-[200px] max-w-sm backdrop-blur-md border border-white/20
              ${toast.type === 'success' ? 'bg-[#E3ECE6]/95 text-[#4A6356]' : ''}
              ${toast.type === 'error' ? 'bg-rose-50/95 text-rose-500' : ''}
              ${toast.type === 'info' ? 'bg-slate-700/90 text-white' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'info' && <Bell className="w-5 h-5 shrink-0" />}
            <span className="text-xs font-bold tracking-wide leading-tight">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- 主要 App 組件 ---
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('nm_gas_url') || DEFAULT_GAS_URL;
    return DEFAULT_GAS_URL;
  });

  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'products' | 'work' | 'schedule' | 'finance'>('orders');
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

  const [workDates, setWorkDates] = useState<string[]>([getTomorrowDate()]);
  const [workCustomerFilter, setWorkCustomerFilter] = useState('');
  const [workProductFilter, setWorkProductFilter] = useState<string[]>([]);
  const [workDeliveryMethodFilter, setWorkDeliveryMethodFilter] = useState<string[]>([]);
  
  const [scheduleDate, setScheduleDate] = useState<string>(getTomorrowDate());
  const [scheduleDeliveryMethodFilter, setScheduleDeliveryMethodFilter] = useState<string[]>([]);
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [holidayEditorId, setHolidayEditorId] = useState<string | null>(null);

  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [quickAddData, setQuickAddData] = useState<{customerName: string, items: {productId: string, quantity: number, unit: string}[]} | null>(null);

  const [tempPriceProdId, setTempPriceProdId] = useState('');
  const [tempPriceValue, setTempPriceValue] = useState('');
  const [tempPriceUnit, setTempPriceUnit] = useState('斤');

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

  const [settlementTarget, setSettlementTarget] = useState<{name: string, allOrderIds: string[]} | null>(null);
  const [settlementDate, setSettlementDate] = useState<string>(getLastMonthEndDate());

  const [orderForm, setOrderForm] = useState<{
    customerType: 'existing' | 'retail';
    customerId: string;
    customerName: string;
    deliveryTime: string;
    deliveryMethod: string;
    items: OrderItem[];
    note: string;
  }>({
    customerType: 'existing',
    customerId: '',
    customerName: '',
    deliveryTime: '08:00',
    deliveryMethod: '',
    items: [{ productId: '', quantity: 10, unit: '斤' }],
    note: ''
  });

  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({});
  const [isEditingCustomer, setIsEditingCustomer] = useState<string | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [initialProductOrder, setInitialProductOrder] = useState<string[]>([]);
  const [hasReorderedProducts, setHasReorderedProducts] = useState(false);

  // --- Search and History States ---
  const [orderDropdownSearch, setOrderDropdownSearch] = useState('');
  const [lastOrderCandidate, setLastOrderCandidate] = useState<{date: string, items: OrderItem[]} | null>(null);

  // --- TOAST STATE ---
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto dismiss
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  // -------------------

  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedOrderIds(new Set());
  }, [activeTab]);

  useEffect(() => {
    if (products.length > 0 && initialProductOrder.length === 0) {
      setInitialProductOrder(products.map(p => p.id));
    }
  }, [products]);

  // ... (保留 orderSummary, calculateOrderTotalAmount, getQuickAddPricePreview, scheduleOrders, scheduleMoneySummary, financeData, settlementPreview useMemo)
  const orderSummary = useMemo(() => { const customer = customers.find(c => c.id === orderForm.customerId); let totalPrice = 0; const details = orderForm.items.map(item => { const product = products.find(p => p.id === item.productId); const priceItem = customer?.priceList?.find(pl => pl.productId === item.productId); const unitPrice = priceItem ? priceItem.price : (product?.price || 0); let displayQty = item.quantity; let displayUnit = item.unit || '斤'; let subtotal = 0; let isCalculated = false; if (item.unit === '元') { subtotal = item.quantity; if (unitPrice > 0) { displayQty = parseFloat((item.quantity / unitPrice).toFixed(1)); displayUnit = product?.unit || '斤'; isCalculated = true; } else { displayQty = 0; } } else { subtotal = Math.round(item.quantity * unitPrice); displayQty = item.quantity; displayUnit = item.unit || '斤'; } totalPrice += subtotal; return { name: product?.name || '未選品項', rawQty: item.quantity, rawUnit: item.unit, displayQty, displayUnit, subtotal, unitPrice, isCalculated }; }); return { totalPrice, details }; }, [orderForm.items, orderForm.customerId, customers, products]);
  const calculateOrderTotalAmount = (order: Order) => { const customer = customers.find(c => c.name === order.customerName); let total = 0; order.items.forEach(item => { const product = products.find(p => p.id === item.productId || p.name === item.productId); const priceItem = customer?.priceList?.find(pl => pl.productId === (product?.id || item.productId)); const unitPrice = priceItem ? priceItem.price : (product?.price || 0); if (item.unit === '元') { total += item.quantity; } else { total += Math.round(item.quantity * unitPrice); } }); return total; };
  const getQuickAddPricePreview = () => { if (!quickAddData || quickAddData.items.length === 0) return null; const customer = customers.find(c => c.name === quickAddData.customerName); if (!customer) return null; let totalOrderPrice = 0; quickAddData.items.forEach(item => { if (!item.productId) return; const product = products.find(p => p.id === item.productId); if (!product) return; const priceItem = customer.priceList?.find(pl => pl.productId === product.id); const unitPrice = priceItem ? priceItem.price : (product.price || 0); let itemTotal = 0; if (item.unit === '元') { itemTotal = item.quantity; } else { itemTotal = Math.round(item.quantity * unitPrice); } totalOrderPrice += itemTotal; }); return { total: totalOrderPrice, itemCount: quickAddData.items.length }; };
  const scheduleOrders = useMemo(() => { return orders.filter(o => { if (o.deliveryDate !== scheduleDate) return false; if (scheduleDeliveryMethodFilter.length > 0) { const customer = customers.find(c => c.name === o.customerName); const method = o.deliveryMethod || customer?.deliveryMethod || ''; if (!scheduleDeliveryMethodFilter.includes(method)) return false; } return true; }).sort((a, b) => { return a.deliveryTime.localeCompare(b.deliveryTime); }); }, [orders, scheduleDate, scheduleDeliveryMethodFilter, customers]);
  const scheduleMoneySummary = useMemo(() => { let totalReceivable = 0; let totalCollected = 0; scheduleOrders.forEach(order => { const amount = calculateOrderTotalAmount(order); totalReceivable += amount; if (order.status === OrderStatus.PAID) { totalCollected += amount; } }); return { totalReceivable, totalCollected }; }, [scheduleOrders, customers, products]);
  const financeData = useMemo(() => { const outstandingMap = new Map<string, { totalDebt: number, count: number, orderIds: string[] }>(); let grandTotalDebt = 0; orders.forEach(order => { if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.CANCELLED) { const amount = calculateOrderTotalAmount(order); grandTotalDebt += amount; if (!outstandingMap.has(order.customerName)) { outstandingMap.set(order.customerName, { totalDebt: 0, count: 0, orderIds: [] }); } const entry = outstandingMap.get(order.customerName)!; entry.totalDebt += amount; entry.count += 1; entry.orderIds.push(order.id); } }); const sortedOutstanding = Array.from(outstandingMap.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.totalDebt - a.totalDebt); return { grandTotalDebt, outstanding: sortedOutstanding }; }, [orders, customers, products]);
  const settlementPreview = useMemo(() => { if (!settlementTarget) return null; const filteredOrders = orders.filter(o => { if (!settlementTarget.allOrderIds.includes(o.id)) return false; return o.deliveryDate <= settlementDate; }); let totalAmount = 0; filteredOrders.forEach(o => { totalAmount += calculateOrderTotalAmount(o); }); return { orders: filteredOrders, totalAmount, count: filteredOrders.length }; }, [settlementTarget, settlementDate, orders, customers, products]);


  // --- Helper Functions using Toast ---
  const handleCopyOrder = (custName: string, orders: Order[]) => {
    const customer = customers.find(c => c.name === custName);
    let totalAmount = 0;
    const lines = [`📅 訂單日期: ${selectedDate}`, `👤 客戶: ${custName}`];
    lines.push('----------------');
    orders.forEach(o => {
      o.items.forEach(item => {
        const p = products.find(prod => prod.id === item.productId);
        const pName = p?.name || item.productId;
        const unit = item.unit || p?.unit || '斤';
        let itemPrice = 0;
        if (unit === '元') { itemPrice = item.quantity; } else { const priceInfo = customer?.priceList?.find(pl => pl.productId === item.productId); const uPrice = priceInfo ? priceInfo.price : 0; itemPrice = Math.round(item.quantity * uPrice); }
        totalAmount += itemPrice;
        lines.push(`- ${pName}: ${item.quantity}${unit}`);
      });
    });
    lines.push('----------------');
    lines.push(`💰 總金額: $${totalAmount.toLocaleString()}`);
    if (orders[0]?.note) lines.push(`📝 備註: ${orders[0].note}`);
    navigator.clipboard.writeText(lines.join('\n')).then(() => { addToast('訂單內容已複製！', 'success'); });
  };

  const handleShareOrder = async (order: Order) => {
    const customer = customers.find(c => c.name === order.customerName);
    const totalAmount = calculateOrderTotalAmount(order);
    let text = `🚚 配送單 [${order.deliveryDate}]\n`;
    text += `----------------\n`;
    text += `👤 客戶: ${order.customerName}\n`;
    if (customer?.phone) text += `📞 電話: ${customer.phone}\n`;
    text += `⏰ 時間: ${formatTimeDisplay(order.deliveryTime)}\n`;
    if (order.deliveryMethod) text += `🛵 方式: ${order.deliveryMethod}\n`;
    text += `\n📦 品項:\n`;
    order.items.forEach(item => { const p = products.find(prod => prod.id === item.productId || prod.name === item.productId); text += `- ${p?.name || item.productId}: ${item.quantity} ${item.unit}\n`; });
    if (order.note) text += `\n📝 備註: ${order.note}\n`;
    text += `----------------\n`;
    text += `💰 總金額: $${totalAmount.toLocaleString()}`;
    if (navigator.share) {
      try { await navigator.share({ title: `配送單 - ${order.customerName}`, text: text }); } catch (err) { console.log('Share canceled'); }
    } else {
      navigator.clipboard.writeText(text);
      addToast('配送資訊已複製！', 'success');
    }
  };

  const handleCopyStatement = (customerName: string, totalDebt: number) => {
    const text = `【${customerName} 對帳單】\n截至目前未結款項: $${totalDebt.toLocaleString()}\n請核對，謝謝！`;
    navigator.clipboard.writeText(text).then(() => addToast('對帳單文字已複製', 'success'));
  };

  const openGoogleMaps = (name: string) => {
    const query = encodeURIComponent(name);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  useEffect(() => {
    const authStatus = localStorage.getItem('nm_auth_status');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nm_selected_date', selectedDate);
  }, [selectedDate]);

  const syncData = async () => {
    if (!apiEndpoint) { setIsInitialLoading(false); return; }
    setIsInitialLoading(true);
    try {
      const res = await fetch(`${apiEndpoint}?type=init`);
      const result: GASResponse<any> = await res.json();
      if (result.success && result.data) {
        // ... (Parsing logic remains the same)
        const mappedCustomers: Customer[] = (result.data.customers || []).map((c: any) => {
          const priceListKey = Object.keys(c).find(k => k.includes('價目表') || k.includes('Price') || k.includes('priceList')) || '價目表JSON';
          return {
            id: String(c.ID || c.id || ''),
            name: c.客戶名稱 || c.name || '',
            phone: c.電話 || c.phone || '',
            deliveryTime: c.配送時間 || c.deliveryTime || '',
            deliveryMethod: c.配送方式 || c.deliveryMethod || '', 
            paymentTerm: c.付款週期 || c.paymentTerm || 'daily',
            defaultItems: safeJsonArray(c.預設品項JSON || c.預設品項 || c.defaultItems),
            priceList: safeJsonArray(c[priceListKey] || c.priceList).map((pl: any) => ({ productId: pl.productId, price: Number(pl.price) || 0, unit: pl.unit || '斤' })),
            offDays: safeJsonArray(c.公休日週期JSON || c.公休日週期 || c.offDays),
            holidayDates: safeJsonArray(c.特定公休日JSON || c.特定公休日 || c.holidayDates)
          };
        });
        const mappedProducts: Product[] = (result.data.products || []).map((p: any) => ({ id: String(p.ID || p.id), name: p.品項 || p.name, unit: p.單位 || p.unit, price: Number(p.單價 || p.price) || 0 }));
        const rawOrders = result.data.orders || [];
        const orderMap: { [key: string]: Order } = {};
        rawOrders.forEach((o: any) => {
          const oid = String(o.訂單ID || o.id);
          if (!orderMap[oid]) {
            const rawDate = o.配送日期 || o.deliveryDate;
            const normalizedDate = normalizeDate(rawDate);
            orderMap[oid] = { id: oid, createdAt: o.建立時間 || o.createdAt, customerName: o.客戶名 || o.customerName || '未知客戶', deliveryDate: normalizedDate, deliveryTime: o.配送時間 || o.deliveryTime, items: [], note: o.備註 || o.note || '', status: (o.狀態 || o.status as OrderStatus) || OrderStatus.PENDING, deliveryMethod: o.配送方式 || o.deliveryMethod || '' };
          }
          const prodName = o.品項 || o.productName;
          const prod = mappedProducts.find(p => p.name === prodName);
          orderMap[oid].items.push({ productId: prod ? prod.id : prodName, quantity: Number(o.數量 || o.quantity) || 0, unit: o.unit || prod?.unit || '斤' });
        });
        setCustomers(mappedCustomers);
        setProducts(mappedProducts);
        setOrders(Object.values(orderMap));
        setInitialProductOrder(mappedProducts.map(p => p.id));
        setHasReorderedProducts(false);
        addToast('雲端資料已同步完成', 'success');
      }
    } catch (e) { console.error("無法連線至雲端:", e); addToast("同步失敗，請檢查網路連線", 'error'); } finally { setIsInitialLoading(false); }
  };

  useEffect(() => { if (isAuthenticated) { syncData(); } }, [isAuthenticated, apiEndpoint]);

  // ... (保留 ordersForDate, groupedOrders, activeCustomersForDate 等 useMemo)
  const ordersForDate = useMemo(() => orders.filter(o => o.deliveryDate === selectedDate), [orders, selectedDate]);
  const groupedOrders = useMemo(() => { const groups: Record<string, Order[]> = {}; ordersForDate.forEach(o => { const name = o.customerName; if (!groups[name]) groups[name] = []; groups[name].push(o); }); return groups; }, [ordersForDate]);
  const activeCustomersForDate = useMemo(() => { const dayOfWeek = new Date(selectedDate).getDay(); return customers.filter(c => { const isSpecificHoliday = (c.holidayDates || []).includes(selectedDate); const isWeeklyHoliday = (c.offDays || []).includes(dayOfWeek); return !isSpecificHoliday && !isWeeklyHoliday; }); }, [customers, selectedDate]);
  const inactiveCustomersForDate = useMemo(() => { const activeIds = new Set(activeCustomersForDate.map(c => c.id)); return customers.filter(c => !activeIds.has(c.id)); }, [customers, activeCustomersForDate]);
  const filteredActiveDropdown = useMemo(() => { return activeCustomersForDate.filter(c => c.name.toLowerCase().includes(orderDropdownSearch.toLowerCase())); }, [activeCustomersForDate, orderDropdownSearch]);
  const filteredInactiveDropdown = useMemo(() => { return inactiveCustomersForDate.filter(c => c.name.toLowerCase().includes(orderDropdownSearch.toLowerCase())); }, [inactiveCustomersForDate, orderDropdownSearch]);
  const filteredCustomers = useMemo(() => customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())), [customers, customerSearch]);
  const workSheetData = useMemo(() => { const dateOrders = orders.filter(o => workDates.includes(o.deliveryDate)); const aggregation = new Map<string, { totalQty: number, unit: string, details: { customerName: string, qty: number }[] }>(); dateOrders.forEach(o => { if (workCustomerFilter && !o.customerName.toLowerCase().includes(workCustomerFilter.toLowerCase())) return; if (workDeliveryMethodFilter.length > 0) { const customer = customers.find(c => c.name === o.customerName); const method = o.deliveryMethod || customer?.deliveryMethod || ''; if (!workDeliveryMethodFilter.includes(method)) return; } o.items.forEach(item => { const product = products.find(p => p.id === item.productId || p.name === item.productId); const productName = product?.name || item.productId; const productUnit = product?.unit || '斤'; if (workProductFilter.length > 0 && !workProductFilter.includes(productName)) return; if (!aggregation.has(productName)) aggregation.set(productName, { totalQty: 0, unit: productUnit, details: [] }); const entry = aggregation.get(productName)!; entry.totalQty += item.quantity; entry.details.push({ customerName: o.customerName, qty: item.quantity }); }); }); return Array.from(aggregation.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.totalQty - a.totalQty); }, [orders, workDates, workCustomerFilter, workProductFilter, workDeliveryMethodFilter, products, customers]);

  // --- Historical Order Helper ---
  const findLastOrder = (customerId: string, customerName: string) => {
    const customerOrders = orders.filter(o => o.customerName === customerName || customers.find(c => c.id === customerId)?.name === o.customerName);
    const sorted = customerOrders.sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());
    const last = sorted.find(o => o.deliveryDate !== selectedDate); 
    if (last && last.items.length > 0) { setLastOrderCandidate({ date: last.deliveryDate, items: last.items.map(i => ({...i})) }); } else { setLastOrderCandidate(null); }
  };
  const applyLastOrder = () => { if (!lastOrderCandidate) return; setOrderForm(prev => ({ ...prev, items: lastOrderCandidate.items.map(i => ({...i})) })); setLastOrderCandidate(null); addToast('已帶入上次訂單內容', 'success'); };

  // --- Handlers using Toast & Modal ---
  const handleSelectExistingCustomer = (id: string) => {
    const cust = customers.find(c => c.id === id);
    if (cust) {
      if (groupedOrders[cust.name] && groupedOrders[cust.name].length > 0) { 
        addToast(`注意：${cust.name} 今日已建立過訂單`, 'info');
      }
      setOrderForm({ ...orderForm, customerId: id, customerName: cust.name, deliveryTime: formatTimeForInput(cust.deliveryTime), deliveryMethod: cust.deliveryMethod || '', items: cust.defaultItems && cust.defaultItems.length > 0 ? cust.defaultItems.map(di => ({ ...di })) : [{ productId: '', quantity: 10, unit: '斤' }] });
      findLastOrder(id, cust.name);
      setIsCustomerDropdownOpen(false);
      setOrderDropdownSearch('');
    }
  };

  const handleCreateOrderFromCustomer = (c: Customer) => {
    const proceedWithCreation = () => {
        setOrderForm({ customerType: 'existing', customerId: c.id, customerName: c.name, deliveryTime: formatTimeForInput(c.deliveryTime), deliveryMethod: c.deliveryMethod || '', items: c.defaultItems && c.defaultItems.length > 0 ? c.defaultItems.map(di => ({ ...di })) : [{ productId: '', quantity: 10, unit: '斤' }], note: '' });
        findLastOrder(c.id, c.name);
        setIsAddingOrder(true);
    };

    if (groupedOrders[c.name] && groupedOrders[c.name].length > 0) {
       setConfirmConfig({
           isOpen: true,
           title: '重複訂單提醒',
           message: `「${c.name}」在今日 (${selectedDate}) 已經有訂單了！\n\n確定要「追加」一筆新訂單嗎？`,
           onConfirm: () => { setConfirmConfig(prev => ({...prev, isOpen: false})); proceedWithCreation(); }
       });
    } else {
       proceedWithCreation();
    }
  };

  const handleSaveOrder = async () => {
    if (isSaving) return;
    const finalName = orderForm.customerType === 'existing' ? orderForm.customerName : orderForm.customerName;
    if (!finalName) return;
    const validItems = orderForm.items.filter(i => i.productId !== '' && i.quantity > 0);
    if (validItems.length === 0) return;
    setIsSaving(true);
    const processedItems = orderSummary.details.filter(d => d.name !== '未選品項' && d.rawQty > 0).map(detail => {
       const originalItem = orderForm.items.find(i => { const p = products.find(prod => prod.id === i.productId); return (p?.name || '') === detail.name || i.productId === detail.name; }) || orderForm.items[0];
       return { productId: originalItem.productId, quantity: detail.displayQty, unit: detail.displayUnit };
    });
    const newOrder: Order = { id: 'ORD-' + Date.now(), createdAt: new Date().toISOString(), customerName: finalName, deliveryDate: selectedDate, deliveryTime: orderForm.deliveryTime, deliveryMethod: orderForm.deliveryMethod, items: processedItems, note: orderForm.note, status: OrderStatus.PENDING };
    try { if (apiEndpoint) { const uploadItems = processedItems.map(item => { const p = products.find(prod => prod.id === item.productId); return { productName: p?.name || item.productId, quantity: item.quantity, unit: item.unit }; }); await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'createOrder', data: { ...newOrder, items: uploadItems } }) }); } } catch (e) { console.error(e); addToast("訂單建立失敗，請檢查網路", 'error'); }
    setOrders([newOrder, ...orders]); setIsSaving(false); setIsAddingOrder(false); setOrderForm({ customerType: 'existing', customerId: '', customerName: '', deliveryTime: '08:00', deliveryMethod: '', items: [{ productId: '', quantity: 10, unit: '斤' }], note: '' });
    addToast('訂單建立成功！', 'success');
  };

  const handleQuickAddSubmit = async () => {
    if (!quickAddData || isSaving) return;
    const validItems = quickAddData.items.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) return;
    setIsSaving(true);
    // ... (rest of logic same)
    const existingOrders = groupedOrders[quickAddData.customerName] || []; const baseOrder = existingOrders[0];
    const now = new Date(); const deliveryTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const customer = customers.find(c => c.name === quickAddData.customerName); const deliveryMethod = baseOrder?.deliveryMethod || customer?.deliveryMethod || '';
    const processedItems = validItems.map(item => { let finalQuantity = item.quantity; let finalUnit = item.unit; const product = products.find(p => p.id === item.productId); const targetUnit = product?.unit || '斤'; if (item.unit === '元') { const priceItem = customer?.priceList?.find(pl => pl.productId === item.productId); const unitPrice = priceItem ? priceItem.price : (product?.price || 0); if (unitPrice > 0) { finalQuantity = parseFloat((item.quantity / unitPrice).toFixed(2)); finalUnit = targetUnit; } } else if (item.unit === '公斤' && targetUnit === '斤') { finalQuantity = parseFloat((item.quantity * (1000 / 600)).toFixed(2)); finalUnit = '斤'; } return { productId: item.productId, quantity: finalQuantity, unit: finalUnit }; });
    const newOrder: Order = { id: 'Q-ORD-' + Date.now(), createdAt: new Date().toISOString(), customerName: quickAddData.customerName, deliveryDate: selectedDate, deliveryTime: deliveryTime, deliveryMethod: deliveryMethod, items: processedItems, note: '追加單', status: OrderStatus.PENDING };
    try { if (apiEndpoint) { const uploadItems = processedItems.map(item => { const p = products.find(prod => prod.id === item.productId); return { productName: p?.name || item.productId, quantity: item.quantity, unit: item.unit }; }); await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'createOrder', data: { ...newOrder, items: uploadItems } }) }); } } catch (e) { console.error(e); addToast("追加失敗，請檢查網路", 'error'); }
    setOrders([newOrder, ...orders]); setIsSaving(false); setQuickAddData(null);
    addToast('追加訂單成功！', 'success');
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => { const previousOrders = [...orders]; setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)); try { if (apiEndpoint) { await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'updateOrderStatus', data: { id: orderId, status: newStatus } }) }); } } catch (e) { console.error("狀態更新失敗", e); addToast("狀態更新失敗，請檢查網路", 'error'); setOrders(previousOrders); } };
  
  const handleBatchUpdateStatus = async (newStatus: OrderStatus) => {
    if (selectedOrderIds.size === 0) return;
    const previousOrders = [...orders];
    const idsToUpdate = Array.from(selectedOrderIds);
    setOrders(prev => prev.map(o => idsToUpdate.includes(o.id) ? { ...o, status: newStatus } : o));
    setIsSelectionMode(false);
    setSelectedOrderIds(new Set());
    addToast(`已批量更新 ${idsToUpdate.length} 筆訂單狀態`, 'success');

    try {
      if (apiEndpoint) {
        await Promise.all(idsToUpdate.map(id => fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'updateOrderStatus', data: { id: id, status: newStatus } }) })));
      }
    } catch (e) {
      console.error("Batch update failed", e);
      addToast("批量更新部分失敗，請檢查網路", 'error');
      setOrders(previousOrders);
    }
  };

  const executeSettlement = async () => {
    if (!settlementTarget || !settlementPreview) return;
    const { orders: targetOrders, totalAmount } = settlementPreview;
    if (targetOrders.length === 0) return;

    setConfirmConfig({ 
      isOpen: true, 
      title: '確認收款結帳', 
      message: `確定要結算「${settlementTarget.name}」截至 ${settlementDate} 的所有帳款嗎？\n\n共 ${targetOrders.length} 筆訂單，總金額 $${totalAmount.toLocaleString()}`, 
      onConfirm: async () => {
        setConfirmConfig(prev => ({...prev, isOpen: false}));
        setSettlementTarget(null);
        const orderIds = targetOrders.map(o => o.id);
        const previousOrders = [...orders];
        setOrders(prev => prev.map(o => orderIds.includes(o.id) ? { ...o, status: OrderStatus.PAID } : o));
        addToast(`已完成 ${settlementTarget.name} 的收款結帳`, 'success');
        
        try { if (apiEndpoint) { await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'batchUpdatePaymentStatus', data: { customerName: settlementTarget.name, orderIds, newStatus: OrderStatus.PAID } }) }); } } catch(e) { console.error(e); addToast('結帳同步失敗，請檢查網路', 'error'); setOrders(previousOrders); }
      }
    });
  };

  const handleSaveProductOrder = async () => {
    if (!apiEndpoint || isSaving) return;
    setIsSaving(true);
    const orderedIds = products.map(p => p.id);
    try {
      await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'reorderProducts', data: orderedIds }) });
      setInitialProductOrder(orderedIds);
      setHasReorderedProducts(false);
      addToast("排序已更新！", 'success');
    } catch (e) { console.error(e); addToast("排序儲存失敗，請檢查網路", 'error'); } finally { setIsSaving(false); }
  };

  const executeDeleteOrder = async (orderId: string) => { setConfirmConfig(prev => ({ ...prev, isOpen: false })); const orderBackup = orders.find(o => o.id === orderId); if (!orderBackup) return; setOrders(prev => prev.filter(o => o.id !== orderId)); try { if (apiEndpoint) { await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'deleteOrder', data: { id: orderId } }) }); } } catch (e) { console.error("刪除失敗:", e); addToast("雲端同步刪除失敗，請檢查網路", 'error'); setOrders(prev => [...prev, orderBackup]); } };
  const executeDeleteCustomer = async (customerId: string) => { setConfirmConfig(prev => ({ ...prev, isOpen: false })); const customerBackup = customers.find(c => c.id === customerId); if (!customerBackup) return; setCustomers(prev => prev.filter(c => c.id !== customerId)); try { if (apiEndpoint) { await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'deleteCustomer', data: { id: customerId } }) }); } } catch (e) { console.error("刪除失敗:", e); addToast("雲端同步刪除失敗，請檢查網路", 'error'); setCustomers(prev => [...prev, customerBackup]); } };
  const executeDeleteProduct = async (productId: string) => { setConfirmConfig(prev => ({ ...prev, isOpen: false })); const productBackup = products.find(p => p.id === productId); if (!productBackup) return; setProducts(prev => prev.filter(p => p.id !== productId)); try { if (apiEndpoint) { await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'deleteProduct', data: { id: productId } }) }); } } catch (e) { console.error("刪除失敗:", e); addToast("雲端同步刪除失敗，請檢查網路", 'error'); setProducts(prev => [...prev, productBackup]); } };
  const handleDeleteOrder = (orderId: string) => { setConfirmConfig({ isOpen: true, title: '刪除訂單', message: '確定要刪除此訂單嗎？\n此動作將會同步刪除雲端資料。', onConfirm: () => executeDeleteOrder(orderId) }); };
  const handleDeleteCustomer = (customerId: string) => { setConfirmConfig({ isOpen: true, title: '刪除店家', message: '確定要刪除此店家嗎？\n這將一併刪除相關的設定。', onConfirm: () => executeDeleteCustomer(customerId) }); };
  const handleDeleteProduct = (productId: string) => { setConfirmConfig({ isOpen: true, title: '刪除品項', message: '確定要刪除此品項嗎？\n請確認該品項已無生產需求。', onConfirm: () => executeDeleteProduct(productId) }); };
  
  const handleSaveCustomer = async () => { if (!customerForm.name || isSaving) return; setIsSaving(true); const isDuplicateName = customers.some(c => c.name.trim() === (customerForm.name || '').trim() && c.id !== (isEditingCustomer === 'new' ? null : isEditingCustomer)); if (isDuplicateName) { addToast('客戶名稱不可重複！', 'error'); setIsSaving(false); return; } const finalCustomer: Customer = { id: isEditingCustomer === 'new' ? Date.now().toString() : (isEditingCustomer as string), name: (customerForm.name || '').trim(), phone: (customerForm.phone || '').trim(), deliveryTime: customerForm.deliveryTime || '08:00', deliveryMethod: customerForm.deliveryMethod || '', paymentTerm: customerForm.paymentTerm || 'daily', defaultItems: (customerForm.defaultItems || []).filter(i => i.productId !== ''), priceList: (customerForm.priceList || []), offDays: customerForm.offDays || [], holidayDates: customerForm.holidayDates || [] }; try { if (apiEndpoint) { await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'updateCustomer', data: finalCustomer }) }); } } catch (e) { console.error(e); } if (isEditingCustomer === 'new') setCustomers([...customers, finalCustomer]); else setCustomers(customers.map(c => c.id === isEditingCustomer ? finalCustomer : c)); setIsSaving(false); setIsEditingCustomer(null); addToast('店家資料已儲存', 'success'); };
  const handleSaveProduct = async () => { if (!productForm.name || isSaving) return; setIsSaving(true); const finalProduct = { id: isEditingProduct === 'new' ? 'p' + Date.now() : (isEditingProduct as string), name: productForm.name || '', unit: productForm.unit || '斤', price: Number(productForm.price) || 0 }; try { if (apiEndpoint) { await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'updateProduct', data: finalProduct }) }); } } catch (e) { console.error(e); } if (isEditingProduct === 'new') setProducts([...products, finalProduct]); else setProducts(products.map(p => p.id === isEditingProduct ? finalProduct : p)); setIsSaving(false); setIsEditingProduct(null); addToast('品項資料已儲存', 'success'); };
  
  const handlePrint = () => { if (workSheetData.length === 0) { addToast('目前沒有資料可供匯出', 'info'); return; } const printWindow = window.open('', '_blank'); if (!printWindow) { addToast('彈跳視窗被封鎖，無法開啟列印頁面', 'error'); window.print(); return; } const sortedDates = [...workDates].sort(); const dateRangeDisplay = sortedDates.length > 1 ? `${sortedDates[0]} ~ ${sortedDates[sortedDates.length - 1]} (${sortedDates.length}天)` : sortedDates[0]; const htmlContent = `<!DOCTYPE html><html><head><title>麵廠職人 - 生產總表</title><style>body { font-family: sans-serif; padding: 20px; color: #333; } h1 { text-align: center; margin-bottom: 10px; font-size: 32px; } p.date { text-align: center; color: #666; margin-bottom: 30px; font-size: 20px; font-weight: bold; } table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 18px; } th, td { border: 1px solid #ddd; padding: 12px; text-align: left; vertical-align: top; } th { background-color: #f5f5f5; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 20px; } tr:nth-child(even) { background-color: #fafafa; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .text-right { text-align: right; } .text-center { text-align: center; } .badge { display: inline-block; background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 16px; margin: 4px; border: 1px solid #ddd; color: #555; } .total-cell { font-size: 24px; font-weight: bold; } .footer { margin-top: 40px; text-align: right; font-size: 14px; color: #999; border-top: 1px solid #eee; padding-top: 10px; } </style></head><body><h1>生產總表</h1><p class="date">出貨日期: ${dateRangeDisplay}</p><table><thead><tr><th width="20%">品項</th><th width="15%">總量</th><th width="10%">單位</th><th>分配明細</th></tr></thead><tbody>${workSheetData.map((item, idx) => `<tr><td style="font-weight: bold; font-size: 22px;">${item.name}</td><td class="text-right total-cell">${item.totalQty}</td><td class="text-center" style="font-size: 18px;">${item.unit}</td><td>${item.details.map(d => `<span class="badge">${d.customerName} <b>${d.qty}</b></span>`).join('')}</td></tr>`).join('')}</tbody></table><div class="footer">列印時間: ${new Date().toLocaleString()}</div><script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script></body></html>`; printWindow.document.write(htmlContent); printWindow.document.close(); };
  
  const handleLogin = async (pwd: string) => { if (!apiEndpoint) { if (pwd === '8888') { setIsAuthenticated(true); localStorage.setItem('nm_auth_status', 'true'); return true; } return false; } try { const res = await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'login', data: { password: pwd } }) }); const json = await res.json(); if (json.success && json.data === true) { setIsAuthenticated(true); localStorage.setItem('nm_auth_status', 'true'); return true; } return false; } catch (e) { console.error("Login Error:", e); return false; } };
  const handleLogout = () => { setIsAuthenticated(false); localStorage.removeItem('nm_auth_status'); setCustomers([]); setOrders([]); setProducts([]); addToast("已安全登出", 'info'); };
  const handleChangePassword = async (oldPwd: string, newPwd: string) => { if (!apiEndpoint) return false; try { const res = await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ action: 'changePassword', data: { oldPassword: oldPwd, newPassword: newPwd } }) }); const json = await res.json(); if (json.success && json.data === true) { return true; } return false; } catch (e) { console.error("Change Password Error:", e); return false; } };
  const handleSaveApiUrl = (newUrl: string) => { localStorage.setItem('nm_gas_url', newUrl); setApiEndpoint(newUrl); };

  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;
  if (isInitialLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-morandi-oatmeal p-10 text-center"><Loader2 className="w-12 h-12 text-morandi-blue animate-spin mb-6" /><h2 className="text-xl font-bold text-morandi-charcoal tracking-wide">正在同步雲端資料...</h2></div>;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-morandi-oatmeal relative shadow-2xl overflow-hidden text-morandi-charcoal font-sans">
      <header className="p-6 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-40">
        <div><h1 className="text-2xl font-extrabold text-morandi-charcoal tracking-tight">麵廠職人</h1><p className="text-[10px] text-morandi-pebble font-bold uppercase tracking-widest mt-0.5">專業訂單管理系統</p></div>
        <div className="flex gap-2">
           <motion.button whileTap={buttonTap} onClick={handleLogout} className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-slate-100 text-morandi-pebble hover:text-rose-400 hover:bg-rose-50 transition-colors"><LogOut className="w-5 h-5" /></motion.button>
          <motion.button whileTap={buttonTap} onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-slate-100 text-morandi-pebble hover:text-slate-600 transition-colors active:scale-95"><Settings className="w-5 h-5" /></motion.button>
        </div>
      </header>

      {/* --- Toast Container --- */}
      <ToastNotification toasts={toasts} removeToast={removeToast} />

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {/* ... (Rest of the UI render logic - Orders, Customers, Products, Schedule, Finance, Work tabs) */}
        <AnimatePresence mode="wait">
        {activeTab === 'orders' && (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* ... (Orders Tab Content) */}
            <div className="flex items-center justify-between px-1">
              <motion.button whileTap={buttonTap} onClick={() => setIsDatePickerOpen(true)} className="flex items-center gap-3 bg-white p-4 rounded-[20px] shadow-sm border border-slate-200 active:scale-95 transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-morandi-blue/10"><CalendarDays className="w-5 h-5 text-morandi-blue" /></div>
                <div><p className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest">出貨日期</p><p className="font-bold text-morandi-charcoal text-lg tracking-tight">{selectedDate}</p></div>
              </motion.button>
              
              <div className="flex gap-2">
                <motion.button whileTap={buttonTap} onClick={() => setActiveTab('work')} className="w-14 h-14 rounded-[20px] bg-white text-morandi-pebble border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-all">
                   <FileText className="w-6 h-6" />
                </motion.button>
                <motion.button whileTap={buttonTap} whileHover={buttonHover} onClick={() => setIsAddingOrder(true)} className="w-14 h-14 rounded-[20px] text-white shadow-lg shadow-morandi-blue/20 hover:bg-slate-600 active:scale-95 transition-all flex items-center justify-center bg-morandi-blue"><Plus className="w-8 h-8" /></motion.button>
              </div>
            </div>
            {/* ... (Orders List - same logic as before but using toast handlers) */}
             <div className="space-y-3">
              <h2 className="text-sm font-bold text-morandi-pebble px-2 flex items-center gap-2 uppercase tracking-widest mb-2"><Layers className="w-4 h-4" /> 配送列表 [{selectedDate}] ({Object.keys(groupedOrders).length} 家)</h2>
              <motion.div variants={containerVariants} initial="hidden" animate="show">
              {Object.keys(groupedOrders).length > 0 ? (
                Object.entries(groupedOrders).map(([custName, custOrders]) => {
                  const isExpanded = expandedCustomer === custName;
                  const currentCustomer = customers.find(c => c.name === custName);
                  let totalAmount = 0;
                  const itemSummaries: string[] = [];
                  custOrders.forEach(o => { o.items.forEach(item => { const p = products.find(prod => prod.id === item.productId); const pName = p?.name || item.productId; const unit = item.unit || p?.unit || '斤'; itemSummaries.push(`${pName} ${item.quantity}${unit}`); if (unit === '元') { totalAmount += item.quantity; } else { const priceInfo = currentCustomer?.priceList?.find(pl => pl.productId === item.productId); const price = priceInfo ? priceInfo.price : 0; totalAmount += Math.round(item.quantity * price); } }); });
                  const summaryText = itemSummaries.join('、');

                  return (
                    <motion.div variants={itemVariants} key={custName} className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden mb-3 hover:shadow-md transition-shadow duration-300">
                      <button onClick={() => setExpandedCustomer(isExpanded ? null : custName)} className="w-full flex items-center justify-between p-5 text-left active:bg-morandi-oatmeal/30 transition-colors">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className={`w-12 h-12 rounded-[16px] flex-shrink-0 flex items-center justify-center text-xl font-extrabold transition-colors ${isExpanded ? 'bg-morandi-blue text-white' : 'bg-morandi-oatmeal text-morandi-pebble'}`}>{custName.charAt(0)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1"><h3 className={`font-bold text-lg truncate tracking-tight ${isExpanded ? 'text-morandi-charcoal' : 'text-slate-700'}`}>{custName}</h3>{totalAmount > 0 && (<span className="bg-morandi-amber-bg text-morandi-amber-text text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 tracking-wide">${totalAmount.toLocaleString()}</span>)}</div>
                            {!isExpanded && (<p className="text-xs text-morandi-pebble font-medium truncate leading-relaxed tracking-wide">{summaryText || `${custOrders.reduce((sum, o) => sum + o.items.length, 0)} 個品項`}</p>)}
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-morandi-pebble flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-morandi-pebble flex-shrink-0" />}
                      </button>
                      
                      <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="bg-morandi-oatmeal/20 border-t border-slate-100 overflow-hidden">
                          <div className="p-5 space-y-4">
                          {custOrders.map((order) => (
                             <div key={order.id} className="relative group bg-white p-4 rounded-[16px] shadow-sm border border-slate-100">
                               <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                                  <div className="flex-1 text-[10px] font-bold text-morandi-pebble uppercase tracking-widest">訂單編號 #{order.id.slice(-4)}</div>
                                  <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }} className="text-[10px] text-morandi-pink hover:text-rose-500 px-2 py-1 flex items-center gap-1 rounded-full hover:bg-rose-50 transition-colors"><Trash2 className="w-3 h-3" /> 刪除</motion.button>
                               </div>
                               <div className="space-y-2">{order.items.map((item, itemIdx) => { const p = products.find(prod => prod.id === item.productId); return (<div key={`${order.id}-${itemIdx}`} className="flex justify-between items-center py-1"><span className="font-bold text-morandi-charcoal tracking-wide">{p?.name || item.productId}</span><div className="flex items-center gap-2"><span className="font-extrabold text-lg text-morandi-charcoal tracking-tight">{item.quantity}</span><span className="text-xs text-morandi-pebble font-bold">{item.unit || p?.unit || '斤'}</span></div></div>); })}</div>
                             </div>
                          ))}
                          <motion.button whileTap={buttonTap} onClick={() => setQuickAddData({ customerName: custName, items: [{productId: '', quantity: 10, unit: '斤'}] })} className="w-full mt-2 py-3 rounded-[16px] border-2 border-dashed border-morandi-blue/30 text-morandi-blue font-bold text-sm flex items-center justify-center gap-2 hover:bg-morandi-blue/5 transition-colors tracking-wide"><Plus className="w-4 h-4" /> 追加訂單</motion.button>
                          <div className="flex gap-2 pt-2">
                             <motion.button whileTap={buttonTap} onClick={() => handleCopyOrder(custName, custOrders)} className="flex-1 py-3 px-4 rounded-[16px] bg-white text-morandi-pebble border border-slate-200 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm tracking-wide"><Copy className="w-4 h-4" /> 複製</motion.button>
                             <motion.button whileTap={buttonTap} onClick={() => openGoogleMaps(custName)} className="flex-1 py-3 px-4 rounded-[16px] bg-morandi-blue text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-600 transition-colors shadow-lg shadow-morandi-blue/20 tracking-wide"><MapPin className="w-4 h-4" /> 導航</motion.button>
                          </div>
                          </div>
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-20 flex flex-col items-center text-center gap-4"><ClipboardList className="w-16 h-16 text-gray-200" /><p className="text-gray-300 italic text-sm tracking-wide">此日期尚無訂單</p></div>
              )}
              </motion.div>
            </div>
          </motion.div>
        )}
        
        {/* ... (Customers, Products, Schedule, Finance, Work tabs logic remains same, handled by conditional rendering) */}
        {activeTab === 'customers' && (
           /* ... existing Customers tab content ... */
           <motion.div key="customers" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-6">
            <div className="flex justify-between items-center px-1"><h2 className="text-xl font-extrabold text-morandi-charcoal flex items-center gap-2 tracking-tight"><Users className="w-5 h-5 text-morandi-blue" /> 店家管理</h2><motion.button whileTap={buttonTap} whileHover={buttonHover} onClick={() => { setCustomerForm({ name: '', phone: '', deliveryTime: '08:00', defaultItems: [], offDays: [], holidayDates: [], priceList: [], deliveryMethod: '', paymentTerm: 'daily' }); setIsEditingCustomer('new'); setTempPriceProdId(''); setTempPriceValue(''); setTempPriceUnit('斤'); }} className="p-3 rounded-2xl text-white shadow-lg bg-morandi-blue hover:bg-slate-600 transition-colors"><Plus className="w-6 h-6" /></motion.button></div>
            <div className="relative mb-2"><Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" /><input type="text" placeholder="搜尋店家名稱..." className="w-full pl-14 pr-6 py-4 bg-white rounded-[24px] border border-slate-100 shadow-sm text-morandi-charcoal font-bold tracking-wide focus:ring-2 focus:ring-morandi-blue transition-all placeholder:text-gray-300" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} /></div>
            <motion.div variants={containerVariants} initial="hidden" animate="show">
            {filteredCustomers.map(c => {
               const hasOrderToday = groupedOrders[c.name] && groupedOrders[c.name].length > 0;
               return (
                  <motion.div variants={itemVariants} key={c.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-200 mb-4 hover:shadow-md transition-all relative overflow-hidden">
                    {hasOrderToday && <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[9px] font-bold px-3 py-1 rounded-bl-xl z-10">今日已下單</div>}
                    <div className="flex justify-between items-start mb-4"><div className="flex items-center gap-3"><div className="w-14 h-14 rounded-[22px] bg-morandi-oatmeal flex items-center justify-center text-xl font-extrabold text-morandi-blue">{c.name.charAt(0)}</div><div><h3 className="font-bold text-slate-800 text-lg tracking-tight">{c.name}</h3><p className="text-xs text-slate-500 font-medium tracking-wide">{c.phone || '無電話'}</p></div></div><div className="flex flex-col items-end gap-1 mt-2"><div className="flex gap-1">{WEEKDAYS.map(d => (<div key={d.value} className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold ${c.offDays?.includes(d.value) ? 'bg-rose-100 text-rose-400' : 'bg-gray-50 text-gray-300'}`}>{d.label}</div>))}</div>{c.holidayDates && c.holidayDates.length > 0 && <span className="text-[8px] font-bold text-rose-300">+{c.holidayDates.length} 特定休</span>}{c.priceList && c.priceList.length > 0 && <span className="text-[8px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded mt-1">已設 {c.priceList.length} 種單價</span>}</div></div>
                    <div className="space-y-3 mb-4 bg-gray-50/60 p-4 rounded-[24px] border border-gray-100"><div className="flex justify-between"><div className="text-[11px] font-bold text-slate-700 tracking-wide">配送時間:{formatTimeDisplay(c.deliveryTime)}</div><div className="flex gap-1">{c.deliveryMethod && <div className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-gray-100">{c.deliveryMethod}</div>}{c.paymentTerm && c.paymentTerm !== 'daily' && (<div className="text-[11px] font-bold text-morandi-blue bg-white px-2 py-0.5 rounded-lg border border-gray-100">{PAYMENT_TERMS.find(t => t.value === c.paymentTerm)?.label}</div>)}</div></div>{c.defaultItems && c.defaultItems.length > 0 ? (<div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-200/50">{c.defaultItems.map((di, idx) => { const p = products.find(prod => prod.id === di.productId); return (<div key={idx} className="bg-white px-2 py-1 rounded-xl text-[10px] border border-gray-200 flex items-center gap-1 shadow-sm"><span className="font-bold text-slate-700">{p?.name || '未知品項'}</span><span className="font-extrabold text-morandi-blue">{di.quantity}{di.unit || p?.unit || '斤'}</span></div>); })}</div>) : (<div className="text-[10px] text-gray-400 font-medium italic pt-2 border-t border-gray-200/50 tracking-wide">尚未設定預設品項</div>)}</div>
                    <div className="flex gap-2">
                       <motion.button whileTap={buttonTap} onClick={() => handleCreateOrderFromCustomer(c)} className="flex-[2] py-3 bg-morandi-blue rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-600 transition-colors shadow-md shadow-morandi-blue/20"><ClipboardList className="w-3.5 h-3.5" /> 建立訂單</motion.button>
                       <motion.button whileTap={buttonTap} onClick={() => { setCustomerForm({ ...c, deliveryTime: formatTimeForInput(c.deliveryTime), paymentTerm: c.paymentTerm || 'daily' }); setIsEditingCustomer(c.id); setTempPriceProdId(''); setTempPriceValue(''); setTempPriceUnit('斤'); }} className="flex-1 py-3 bg-gray-50 rounded-2xl text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors border border-gray-100"><Edit2 className="w-3.5 h-3.5" /> 編輯</motion.button>
                       <motion.button whileTap={buttonTap} onClick={() => handleDeleteCustomer(c.id)} className="px-4 py-3 bg-gray-50 rounded-2xl text-morandi-pink hover:text-rose-500 transition-colors border border-gray-100"><Trash2 className="w-4 h-4" /></motion.button>
                    </div>
                  </motion.div>
               );
            })}
            </motion.div>
            {filteredCustomers.length === 0 && <div className="text-center py-10 text-gray-300 text-sm font-bold tracking-wide">查無店家</div>}
           </motion.div>
        )}

        {/* ... Products, Work, Schedule, Finance tabs ... (Logic same as provided code, wrapped in activeTab check) */}
        {activeTab === 'products' && (
          <motion.div key="products" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-6">
             {/* ... Products content including Reorder logic ... */}
             <div className="flex justify-between items-center px-1"><h2 className="text-xl font-extrabold text-morandi-charcoal flex items-center gap-2 tracking-tight"><Package className="w-5 h-5 text-morandi-blue" /> 品項清單</h2><div className="flex gap-2">{hasReorderedProducts && (<motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileTap={buttonTap} onClick={handleSaveProductOrder} disabled={isSaving} className="p-3 rounded-2xl text-white shadow-lg bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center gap-2">{isSaving ? <Loader2 className="w-6 h-6 animate-spin"/> : <Save className="w-6 h-6" />}<span className="text-xs font-bold hidden sm:inline">儲存排序</span></motion.button>)}<motion.button whileTap={buttonTap} whileHover={buttonHover} onClick={() => { setProductForm({ name: '', unit: '斤', price: 0 }); setIsEditingProduct('new'); }} className="p-3 rounded-2xl text-white shadow-lg bg-morandi-blue hover:bg-slate-600 transition-colors"><Plus className="w-6 h-6" /></motion.button></div></div>
             <Reorder.Group axis="y" values={products} onReorder={(newOrder) => { setProducts(newOrder); setHasReorderedProducts(true); }} className="space-y-0">
               {products.map(p => (<SortableProductItem key={p.id} product={p} onEdit={(p) => { setProductForm(p); setIsEditingProduct(p.id); }} onDelete={(id) => handleDeleteProduct(id)} />))}
             </Reorder.Group>
          </motion.div>
        )}

        {/* ... Other tabs work, schedule, finance etc. ... */}
        {/* For brevity, assuming other tabs logic is included here exactly as in previous steps but alert() replaced with addToast() */}
        {activeTab === 'schedule' && (
           /* ... Schedule Content ... */
           <motion.div key="schedule" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-6">
              {/* ... (Schedule content same as provided, ensuring toast handlers are used) */}
              <div className="px-1"><h2 className="text-xl font-extrabold text-morandi-charcoal flex items-center gap-2 mb-4 tracking-tight"><CalendarCheck className="w-5 h-5 text-morandi-blue" /> 配送行程</h2><div className="mb-6"><WorkCalendar selectedDate={scheduleDate} onSelect={setScheduleDate} orders={orders} /></div>
              {/* ... Finance Dashboard ... */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-slate-700 rounded-[28px] p-5 shadow-lg text-white mb-6 relative overflow-hidden"><div className="absolute right-[-10px] bottom-[-20px] text-slate-600 opacity-20 rotate-12"><Banknote className="w-32 h-32" /></div><div className="flex justify-between items-start mb-2 relative z-10"><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">本日應收總額</p><h3 className="text-3xl font-black mt-1 text-white tracking-tight">${scheduleMoneySummary.totalReceivable.toLocaleString()}</h3></div><div className="text-right"><p className="text-[10px] font-bold text-morandi-green-text uppercase tracking-widest">已收款</p><h3 className="text-xl font-bold text-emerald-300 mt-1 tracking-tight">${scheduleMoneySummary.totalCollected.toLocaleString()}</h3></div></div><div className="w-full bg-slate-600 rounded-full h-1.5 mt-2 relative z-10"><motion.div className="bg-emerald-400 h-1.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${scheduleMoneySummary.totalReceivable > 0 ? (scheduleMoneySummary.totalCollected / scheduleMoneySummary.totalReceivable) * 100 : 0}%` }} transition={{ duration: 1, ease: "easeOut" }} /></div><p className="text-[9px] text-slate-400 mt-2 text-right relative z-10 tracking-wide">尚有 ${(scheduleMoneySummary.totalReceivable - scheduleMoneySummary.totalCollected).toLocaleString()} 未收</p></motion.div>
              {/* ... Filters & List ... */}
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar mb-4 items-center"><button onClick={() => setIsSelectionMode(!isSelectionMode)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1 ${isSelectionMode ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-morandi-blue border-morandi-blue'}`}>{isSelectionMode ? <X className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}{isSelectionMode ? '取消選取' : '批量操作'}</button><div className="w-[1px] h-6 bg-gray-300 mx-1"></div><button onClick={() => setScheduleDeliveryMethodFilter([])} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${scheduleDeliveryMethodFilter.length === 0 ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-gray-400 border-gray-200'}`}>全部方式</button>{DELIVERY_METHODS.map(m => { const isSelected = scheduleDeliveryMethodFilter.includes(m); return (<button key={m} onClick={() => { if (isSelected) { setScheduleDeliveryMethodFilter(scheduleDeliveryMethodFilter.filter(x => x !== m)); } else { setScheduleDeliveryMethodFilter([...scheduleDeliveryMethodFilter, m]); } }} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${isSelected ? 'text-white border-transparent' : 'bg-white text-gray-400 border-gray-200'}`} style={{ backgroundColor: isSelected ? COLORS.primary : '' }}>{m}</button>); })}</div>
              <div className="space-y-4 pb-20"><div className="flex justify-between items-center px-2"><h3 className="text-xs font-bold text-morandi-pebble uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4" /> 配送明細 [{scheduleDate}]</h3><div className="text-xs font-bold text-gray-300 tracking-wide">共 {scheduleOrders.length} 筆訂單</div></div>
              <motion.div variants={containerVariants} initial="hidden" animate="show">{scheduleOrders.length > 0 ? (scheduleOrders.map((order) => { const totalAmount = calculateOrderTotalAmount(order); const statusConfig = getStatusStyles(order.status || OrderStatus.PENDING); const isSelected = selectedOrderIds.has(order.id); const customer = customers.find(c => c.name === order.customerName); const isDeferredPayment = customer?.paymentTerm === 'weekly' || customer?.paymentTerm === 'monthly'; return (<motion.div variants={itemVariants} key={order.id} initial={false} animate={{ backgroundColor: statusConfig.cardBg, borderColor: statusConfig.cardBorder, x: isSelectionMode ? 10 : 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className={`rounded-[32px] overflow-hidden shadow-sm border-2 mb-5 p-1 relative ${isSelectionMode ? 'cursor-pointer' : ''}`} onClick={() => { if (!isSelectionMode) return; const newSet = new Set(selectedOrderIds); if (newSet.has(order.id)) newSet.delete(order.id); else newSet.add(order.id); setSelectedOrderIds(newSet); }}>{isSelectionMode && (<div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">{isSelected ? <div className="w-6 h-6 rounded-lg bg-morandi-blue flex items-center justify-center text-white shadow-md"><CheckCircle2 className="w-4 h-4" /></div> : <div className="w-6 h-6 rounded-lg border-2 border-slate-300 bg-white" />}</div>)}<div className={`p-5 transition-all ${isSelectionMode ? 'pl-14' : ''}`}><div className="flex justify-between items-center mb-4"><div className="flex items-center gap-3"><div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors duration-300`} style={{ backgroundColor: statusConfig.tagBg, color: statusConfig.tagText }}><Clock className="w-3.5 h-3.5" />{formatTimeDisplay(order.deliveryTime)}</div>{order.deliveryMethod && (<span className="text-[10px] font-bold text-gray-400 bg-white/60 px-2 py-1 rounded-lg border border-black/5">{order.deliveryMethod}</span>)}{isDeferredPayment && (<span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{customer?.paymentTerm === 'monthly' ? '月結' : '週結'}</span>)}</div><div className="relative group" onClick={(e) => isSelectionMode && e.stopPropagation()}><select disabled={isSelectionMode} value={order.status || OrderStatus.PENDING} onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)} className={`appearance-none pl-4 pr-9 py-2 rounded-xl text-xs font-extrabold cursor-pointer outline-none transition-all duration-300 border border-transparent hover:brightness-95 ${isSelectionMode ? 'opacity-50 pointer-events-none' : ''}`} style={{ backgroundColor: statusConfig.tagBg, color: statusConfig.tagText }}><option value={OrderStatus.PENDING}>待處理</option><option value={OrderStatus.SHIPPED}>已配送</option><option value={OrderStatus.PAID}>已收款</option></select><ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:rotate-180" style={{ color: statusConfig.iconColor }} /></div></div><div className="flex justify-between items-end mb-5"><h4 className="font-extrabold text-slate-800 text-xl tracking-tight leading-none">{order.customerName}</h4><div className="flex flex-col items-end"><span className="font-mono font-black text-xl text-morandi-charcoal tracking-tight"><span className="text-sm text-gray-400 mr-1">$</span>{totalAmount.toLocaleString()}</span></div></div><div className="space-y-2">{order.items.map((item, idx) => { const p = products.find(prod => prod.id === item.productId || prod.name === item.productId); return (<div key={idx} className="flex justify-between items-center py-2 px-3 bg-white/60 rounded-[16px] border border-black/5"><span className="text-sm font-bold text-slate-600 tracking-wide">{p?.name || item.productId}</span><div className="flex items-baseline gap-1"><span className="font-black text-lg text-slate-800">{item.quantity}</span><span className="text-[10px] font-bold text-gray-400">{item.unit || p?.unit || '斤'}</span></div></div>); })}</div><div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center"><div className="flex gap-2"><motion.button disabled={isSelectionMode} whileTap={buttonTap} onClick={(e) => { e.stopPropagation(); handleShareOrder(order); }} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 hover:shadow-sm transition-all border border-black/5 disabled:opacity-50"><Share2 className="w-4 h-4" /></motion.button><motion.button disabled={isSelectionMode} whileTap={buttonTap} onClick={(e) => { e.stopPropagation(); openGoogleMaps(order.customerName); }} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-400 hover:text-blue-600 hover:shadow-sm transition-all border border-black/5 disabled:opacity-50"><MapPin className="w-4 h-4" /></motion.button></div>{order.note && (<div className="text-[10px] font-bold text-gray-400 bg-white/40 px-3 py-1.5 rounded-lg max-w-[60%] truncate">備註: {order.note}</div>)}</div></div></motion.div>); })) : (<div className="text-center py-10"><p className="text-gray-300 font-bold text-sm tracking-wide">本日無配送行程</p></div>)}</motion.div></div></div>
           </motion.div>
        )}
        {activeTab === 'finance' && (
           /* ... Finance Content ... */
           <motion.div key="finance" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-6">
             {/* ... Finance dashboard ... */}
             <div className="px-1"><h2 className="text-xl font-extrabold text-morandi-charcoal flex items-center gap-2 mb-4 tracking-tight"><Wallet className="w-5 h-5 text-morandi-blue" /> 帳務總覽</h2><div className="bg-morandi-charcoal rounded-[28px] p-6 shadow-lg text-white mb-6 relative overflow-hidden"><div className="absolute right-[-20px] top-[-20px] opacity-10"><DollarSign className="w-40 h-40" /></div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">未結總金額</p><h3 className="text-4xl font-black text-white tracking-tight">${financeData.grandTotalDebt.toLocaleString()}</h3><p className="text-[10px] text-gray-500 mt-2 font-medium tracking-wide">包含所有已出貨但未收款的訂單</p></div><div className="space-y-4"><h3 className="text-xs font-bold text-morandi-pebble uppercase tracking-widest px-2 flex items-center gap-2"><ListChecks className="w-4 h-4" /> 欠款客戶列表 ({financeData.outstanding.length})</h3><motion.div variants={containerVariants} initial="hidden" animate="show">{financeData.outstanding.length > 0 ? (financeData.outstanding.map((item, idx) => (<motion.div variants={itemVariants} key={idx} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200 mb-3 relative overflow-hidden"><div className="flex justify-between items-start mb-4 relative z-10"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-[16px] bg-rose-50 flex items-center justify-center text-rose-400 font-extrabold text-xl">{item.name.charAt(0)}</div><div><h4 className="font-bold text-slate-800 text-lg">{item.name}</h4><p className="text-xs text-rose-400 font-bold bg-rose-50 inline-block px-1.5 rounded mt-0.5">{item.count} 筆未結</p></div></div><div className="text-right"><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">應收金額</p><p className="text-2xl font-black text-morandi-charcoal tracking-tight">${item.totalDebt.toLocaleString()}</p></div></div><div className="flex gap-2 relative z-10 pt-2 border-t border-gray-100"><button onClick={() => handleCopyStatement(item.name, item.totalDebt)} className="flex-1 py-3 rounded-xl bg-gray-50 text-slate-500 font-bold text-xs flex items-center justify-center gap-1 hover:bg-gray-100 transition-colors"><Copy className="w-3.5 h-3.5" /> 複製對帳單</button><button onClick={() => { setSettlementDate(getLastMonthEndDate()); setSettlementTarget({name: item.name, allOrderIds: item.orderIds}); }} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-600 shadow-md shadow-emerald-200 transition-all active:scale-95"><CheckCircle2 className="w-3.5 h-3.5" /> 結帳</button></div></motion.div>))) : (<div className="text-center py-10"><div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-400" /></div><p className="text-gray-400 font-bold text-sm">目前沒有未結款項</p><p className="text-xs text-gray-300 mt-1">所有配送單皆已完成收款</p></div>)}</motion.div></div></div>
           </motion.div>
        )}
        {activeTab === 'work' && (
           /* ... Work Content ... */
           <motion.div key="work" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-6">
             <div className="px-1"><div className="flex items-center gap-2 mb-4"><button onClick={() => setActiveTab('orders')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-morandi-pebble"><ChevronLeft className="w-5 h-5"/></button><h2 className="text-xl font-extrabold text-morandi-charcoal tracking-tight">工作小抄</h2></div>
              <div className="space-y-3 mb-4"><div className="relative"><Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" /><input type="text" placeholder="篩選特定店家..." className="w-full pl-12 pr-6 py-4 bg-white rounded-[24px] border border-slate-100 shadow-sm text-slate-800 font-bold tracking-wide focus:ring-2 focus:ring-morandi-blue transition-all placeholder:text-gray-300 text-sm" value={workCustomerFilter} onChange={(e) => setWorkCustomerFilter(e.target.value)} />{workCustomerFilter && <button onClick={() => setWorkCustomerFilter('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X className="w-4 h-4" /></button>}</div><div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar mb-2"><button onClick={() => setWorkDeliveryMethodFilter([])} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${workDeliveryMethodFilter.length === 0 ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-gray-400 border-gray-200'}`}>全部方式</button>{DELIVERY_METHODS.map(m => { const isSelected = workDeliveryMethodFilter.includes(m); return (<button key={m} onClick={() => { if (isSelected) { setWorkDeliveryMethodFilter(workDeliveryMethodFilter.filter(x => x !== m)); } else { setWorkDeliveryMethodFilter([...workDeliveryMethodFilter, m]); } }} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${isSelected ? 'text-white border-transparent' : 'bg-white text-gray-400 border-gray-200'}`} style={{ backgroundColor: isSelected ? COLORS.primary : '' }}>{m}</button>); })}</div><div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar"><button onClick={() => setWorkProductFilter([])} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${workProductFilter.length === 0 ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-gray-400 border-gray-200'}`}>全部麵種</button>{products.map(p => { const isSelected = workProductFilter.includes(p.name); return (<button key={p.id} onClick={() => { if (isSelected) { setWorkProductFilter(workProductFilter.filter(name => name !== p.name)); } else { setWorkProductFilter([...workProductFilter, p.name]); } }} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${isSelected ? 'text-white border-transparent' : 'bg-white text-gray-400 border-gray-200'}`} style={{ backgroundColor: isSelected ? COLORS.primary : '' }}>{p.name}</button>); })}</div></div>
              <div className="mb-6"><WorkCalendar selectedDate={workDates} onSelect={setWorkDates} orders={orders} /></div>
              <div className="space-y-4"><div className="flex justify-between items-center px-2"><h3 className="text-xs font-bold text-morandi-pebble uppercase tracking-widest flex items-center gap-2"><ListChecks className="w-4 h-4" /> 生產總表 [{workDates.length}天]</h3><div className="flex items-center gap-2"><span className="text-[10px] font-bold text-gray-300 tracking-wide">{workSheetData.length} 種品項</span><motion.button whileTap={buttonTap} onClick={handlePrint} className="bg-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-sm active:scale-95"><Printer className="w-3.5 h-3.5" /> 列印 / 匯出 PDF</motion.button></div></div><motion.div variants={containerVariants} initial="hidden" animate="show">{workSheetData.length > 0 ? (workSheetData.map((item, idx) => (<motion.div variants={itemVariants} key={idx} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-200 mb-3"><div className="p-5 flex justify-between items-center bg-gray-50/50"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100" style={{ color: COLORS.primary }}><span className="font-black text-lg">{idx + 1}</span></div><div><h3 className="font-bold text-slate-800 text-lg tracking-tight">{item.name}</h3><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">總需求量</p></div></div><div className="text-right"><span className="font-black text-3xl text-slate-800 tracking-tight">{item.totalQty}</span><span className="text-xs text-gray-400 font-bold ml-1">{item.unit}</span></div></div><div className="p-4 bg-white space-y-2 border-t border-gray-100">{item.details.map((detail, dIdx) => (<div key={dIdx} className="flex justify-between items-center py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors"><span className="text-sm font-bold text-slate-600 tracking-wide">{detail.customerName}</span><span className="text-sm font-bold text-slate-400">{detail.qty} {item.unit}</span></div>))}</div></motion.div>))) : (<div className="text-center py-10"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><WifiOff className="w-8 h-8 text-gray-300" /></div><p className="text-gray-300 font-bold text-sm tracking-wide">所選日期無生產需求</p><p className="text-xs text-gray-200 mt-1">請選擇其他日期或調整篩選條件</p></div>)}</motion.div></div></div>
           </motion.div>
        )}
        </AnimatePresence>

      </main>

      {/* ... (Batch Actions, Confirmation Modal, Holiday Calendar, Date Picker, Settings Modal, Quick Add Modal, Add Order Modal, Edit Customer Modal, Edit Product Modal, Nav) */}
      {/* Retain all modals as is, logic ensures alerts are removed */}
      <AnimatePresence>
        {isSelectionMode && selectedOrderIds.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-[80px] left-4 right-4 z-50 max-w-md mx-auto"
          >
            <div className="bg-morandi-charcoal rounded-[24px] p-4 shadow-2xl flex items-center justify-between gap-4">
               <div className="flex-1 flex flex-col pl-2">
                  <span className="text-white font-bold text-sm">已選 {selectedOrderIds.size} 筆</span>
                  <span className="text-gray-400 text-[10px]">批量更新狀態</span>
               </div>
               <div className="flex gap-2">
                  <motion.button whileTap={buttonTap} onClick={() => handleBatchUpdateStatus(OrderStatus.SHIPPED)} className="px-4 py-2 bg-morandi-oatmeal text-morandi-charcoal rounded-xl font-bold text-xs shadow-sm flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> 已配送</motion.button>
                  <motion.button whileTap={buttonTap} onClick={() => handleBatchUpdateStatus(OrderStatus.PAID)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 已收款</motion.button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
      {settlementTarget && settlementPreview && (
        <div className="fixed inset-0 bg-morandi-charcoal/40 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
           <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-xl">
              <div className="p-6 bg-morandi-oatmeal/30 border-b border-gray-100 flex justify-between items-center"><div><h3 className="font-extrabold text-morandi-charcoal text-lg tracking-tight">確認收款結帳</h3><p className="text-xs text-morandi-pebble font-bold uppercase tracking-widest mt-0.5">{settlementTarget.name}</p></div><button onClick={() => setSettlementTarget(null)} className="p-2 bg-white rounded-2xl shadow-sm border border-slate-100 text-morandi-pebble"><X className="w-5 h-5" /></button></div>
              <div className="p-6 space-y-6">
                 <div className="space-y-2"><label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest flex items-center gap-1.5"><CalendarRange className="w-3.5 h-3.5" /> 結算截止日 (含)</label><div className="relative"><input type="date" value={settlementDate} onChange={(e) => setSettlementDate(e.target.value)} className="w-full pl-4 pr-4 py-4 bg-white rounded-[20px] border-2 border-morandi-blue/20 text-morandi-charcoal font-black text-lg shadow-sm outline-none focus:border-morandi-blue transition-all" /><div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-bold text-morandi-blue bg-blue-50 px-2 py-1 rounded">預設: 上月底</div></div><p className="text-[10px] text-gray-400 font-medium px-1">系統自動選取此日期(含)以前的所有未結訂單。</p></div>
                 <div className="bg-emerald-50 p-5 rounded-[24px] border border-emerald-100"><div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-emerald-700">預計結算金額</span><span className="text-xs font-bold text-emerald-600/60">{settlementPreview.count} 筆訂單</span></div><div className="text-3xl font-black text-emerald-600 tracking-tight">${settlementPreview.totalAmount.toLocaleString()}</div></div>
              </div>
              <div className="p-6 pt-0 flex gap-3"><motion.button whileTap={buttonTap} onClick={() => setSettlementTarget(null)} className="flex-1 py-4 rounded-[20px] font-bold text-morandi-pebble bg-gray-50 border border-slate-100">取消</motion.button><motion.button whileTap={buttonTap} onClick={executeSettlement} disabled={settlementPreview.count === 0} className="flex-[2] py-4 rounded-[20px] font-bold text-white shadow-lg bg-emerald-500 disabled:opacity-50 disabled:shadow-none">確認結帳</motion.button></div>
           </motion.div>
        </div>
      )}
      </AnimatePresence>

      <ConfirmModal isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
      {holidayEditorId && (<HolidayCalendar storeName={isEditingCustomer ? (customerForm.name || '') : ''} holidays={customerForm.holidayDates || []} onToggle={(date) => { const current = customerForm.holidayDates || []; const newHolidays = current.includes(date) ? current.filter(d => d !== date) : [...current, date]; setCustomerForm({...customerForm, holidayDates: newHolidays}); }} onClose={() => setHolidayEditorId(null)} />)}
      <AnimatePresence>{isDatePickerOpen && <DatePickerModal selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsDatePickerOpen(false)} />}</AnimatePresence>
      <AnimatePresence>{isSettingsOpen && (<SettingsModal onClose={() => setIsSettingsOpen(false)} onSync={syncData} onSavePassword={handleChangePassword} currentUrl={apiEndpoint} onSaveUrl={handleSaveApiUrl} />)}</AnimatePresence>
      <AnimatePresence>{quickAddData && (<div className="fixed inset-0 bg-morandi-charcoal/40 z-[70] flex flex-col items-center justify-center p-4 backdrop-blur-sm"><motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white w-full max-w-sm max-h-[85vh] flex flex-col rounded-[32px] overflow-hidden shadow-xl border border-slate-200"><div className="p-5 bg-morandi-oatmeal/30 border-b border-gray-100 flex-shrink-0"><h3 className="text-center font-extrabold text-morandi-charcoal text-lg">追加訂單</h3><p className="text-center text-xs text-morandi-pebble font-bold tracking-wide mt-1">{quickAddData.customerName}</p></div><div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"><AnimatePresence initial={false}>{quickAddData.items.map((item, index) => (<motion.div key={index} initial={{ opacity: 0, height: 0, scale: 0.95 }} animate={{ opacity: 1, height: 'auto', scale: 1 }} exit={{ opacity: 0, height: 0, scale: 0.9 }} className="bg-white rounded-[20px] p-3 shadow-sm border border-slate-100 flex flex-wrap gap-2 items-center"><div className="flex-1 min-w-[120px]"><select className="w-full bg-morandi-oatmeal/50 p-3 rounded-xl font-bold text-sm text-morandi-charcoal border border-slate-200 outline-none focus:ring-2 focus:ring-morandi-blue transition-all" value={item.productId} onChange={(e) => { const p = products.find(x => x.id === e.target.value); const newItems = [...quickAddData.items]; newItems[index] = { ...item, productId: e.target.value, unit: p?.unit || '斤' }; setQuickAddData({...quickAddData, items: newItems}); }}><option value="">選擇品項...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="w-20"><input type="number" placeholder="數量" className="w-full bg-morandi-oatmeal/50 p-3 rounded-xl text-center font-black text-lg text-morandi-charcoal border border-slate-200 outline-none focus:ring-2 focus:ring-morandi-blue transition-all" value={item.quantity} onChange={(e) => { const newItems = [...quickAddData.items]; newItems[index].quantity = parseInt(e.target.value) || 0; setQuickAddData({...quickAddData, items: newItems}); }} /></div><div className="w-20"><select value={item.unit || '斤'} onChange={(e) => { const newItems = [...quickAddData.items]; newItems[index].unit = e.target.value; setQuickAddData({...quickAddData, items: newItems}); }} className="w-full bg-morandi-oatmeal/50 p-3 rounded-xl font-bold text-sm text-morandi-charcoal border border-slate-200 outline-none focus:ring-2 focus:ring-morandi-blue transition-all">{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div><button onClick={() => { const newItems = quickAddData.items.filter((_, i) => i !== index); setQuickAddData({...quickAddData, items: newItems}); }} className="p-3 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button></motion.div>))}</AnimatePresence><motion.button whileTap={buttonTap} onClick={() => setQuickAddData({...quickAddData, items: [...quickAddData.items, {productId: '', quantity: 10, unit: '斤'}]})} className="w-full py-3 rounded-[16px] border-2 border-dashed border-morandi-blue/30 text-morandi-blue font-bold text-sm flex items-center justify-center gap-2 hover:bg-morandi-blue/5 transition-colors tracking-wide mt-2"><Plus className="w-4 h-4" /> 增加品項</motion.button></div><div className="p-5 bg-white border-t border-gray-100 flex-shrink-0 space-y-4"><AnimatePresence>{(() => { const preview = getQuickAddPricePreview(); if (preview && preview.total > 0) { return (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-morandi-amber-bg p-4 rounded-xl border border-amber-100 flex justify-between items-center"><div className="flex flex-col"><span className="text-[10px] font-bold text-morandi-amber-text/70 uppercase tracking-widest">預估總金額</span><span className="text-xs font-medium text-morandi-amber-text/60 mt-0.5 tracking-wide">共 {preview.itemCount} 個品項</span></div><span className="text-2xl font-black text-morandi-amber-text tracking-tight">${preview.total.toLocaleString()}</span></motion.div>); } return null; })()}</AnimatePresence><div className="flex gap-2"><motion.button whileTap={buttonTap} onClick={() => setQuickAddData(null)} className="flex-1 py-3 rounded-[16px] font-bold text-morandi-pebble hover:bg-gray-50 transition-colors border border-slate-200">取消</motion.button><motion.button whileTap={buttonTap} onClick={handleQuickAddSubmit} className="flex-1 py-3 rounded-[16px] font-bold text-white shadow-md bg-morandi-blue hover:bg-slate-600">確認追加</motion.button></div></div></motion.div></div>)}</AnimatePresence>

      <AnimatePresence>
      {isAddingOrder && (
        <div className="fixed inset-0 bg-morandi-oatmeal z-[60] flex flex-col">
          <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="flex flex-col h-full">
          <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10"><motion.button whileTap={buttonTap} onClick={() => setIsAddingOrder(false)} className="p-2 rounded-2xl bg-gray-50 text-morandi-pebble"><X className="w-6 h-6" /></motion.button><h2 className="text-lg font-extrabold text-morandi-charcoal tracking-tight">建立配送訂單</h2><motion.button whileTap={buttonTap} onClick={handleSaveOrder} disabled={isSaving} className="font-bold px-4 py-2 transition-colors text-morandi-blue disabled:text-gray-300">{isSaving ? '儲存中...' : '儲存'}</motion.button></div>
          <div className="p-6 space-y-6 overflow-y-auto pb-10">
            <div className="flex bg-white p-1 rounded-[24px] shadow-sm border border-slate-100"><button onClick={() => setOrderForm({...orderForm, customerType: 'existing'})} className={`flex-1 py-4 rounded-[20px] text-xs font-bold transition-all tracking-wide ${orderForm.customerType === 'existing' ? 'bg-morandi-blue text-white shadow-md' : 'text-morandi-pebble'}`}>現有客戶</button><button onClick={() => setOrderForm({...orderForm, customerType: 'retail', customerId: ''})} className={`flex-1 py-4 rounded-[20px] text-xs font-bold transition-all tracking-wide ${orderForm.customerType === 'retail' ? 'bg-morandi-blue text-white shadow-md' : 'text-morandi-pebble'}`}>零售客戶</button></div>
            {orderForm.customerType === 'existing' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest px-2">配送店家 (今日營業)</label>
                <AnimatePresence>
                {lastOrderCandidate && (
                   <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} className="mb-2">
                      <motion.button whileTap={{ scale: 0.98 }} onClick={applyLastOrder} className="w-full bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-[20px] p-4 flex items-center justify-between group relative overflow-hidden">
                         <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500"><History className="w-5 h-5" /></div>
                            <div className="text-left"><p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">發現最近訂單紀錄 ({lastOrderCandidate.date})</p><p className="text-xs font-bold text-indigo-900 truncate max-w-[180px]">{lastOrderCandidate.items.map(i => { const p = products.find(prod => prod.id === i.productId); return `${p?.name || '未知'}${i.quantity}`; }).join('、')}...</p></div>
                         </div>
                         <div className="bg-white/50 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 border border-indigo-100 group-hover:bg-indigo-500 group-hover:text-white transition-colors relative z-10">套用此單</div>
                      </motion.button>
                   </motion.div>
                )}
                </AnimatePresence>
                <div className="relative">
                  <motion.button whileTap={buttonTap} onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)} className="w-full p-5 bg-white rounded-[24px] shadow-sm border border-slate-200 flex justify-between items-center font-bold text-morandi-charcoal focus:ring-2 focus:ring-morandi-blue transition-all"><span className="flex items-center gap-2">{orderForm.customerName || "選擇店家..."}{orderForm.customerName && groupedOrders[orderForm.customerName] && (<span className="bg-amber-400 text-white text-[9px] px-2 py-0.5 rounded-full tracking-wide">已建立</span>)}{orderForm.customerName && inactiveCustomersForDate.some(c => c.name === orderForm.customerName) && (<span className="bg-gray-400 text-white text-[9px] px-2 py-0.5 rounded-full tracking-wide">非排程</span>)}</span>{isCustomerDropdownOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}</motion.button>
                  <AnimatePresence>
                  {isCustomerDropdownOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 bg-white rounded-[24px] shadow-xl border border-gray-100 overflow-hidden z-20 absolute w-full">
                      <div className="p-3 border-b border-gray-50 bg-gray-50/50 sticky top-0 z-10"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" autoFocus placeholder="搜尋店家名稱..." className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-morandi-blue/50" value={orderDropdownSearch} onChange={(e) => setOrderDropdownSearch(e.target.value)} /></div></div>
                      <div className="max-h-60 overflow-y-auto p-2 space-y-4 custom-scrollbar">
                        {filteredActiveDropdown.length > 0 && (<div><h4 className="text-[10px] font-bold text-morandi-blue uppercase tracking-widest px-2 mb-1 flex items-center gap-1"><CalendarCheck className="w-3 h-3" /> 今日營業 (推薦)</h4><div className="space-y-1">{filteredActiveDropdown.map(c => { const hasOrder = !!groupedOrders[c.name]; const isSelected = orderForm.customerId === c.id; return (<motion.button whileTap={buttonTap} key={c.id} onClick={() => handleSelectExistingCustomer(c.id)} className={`w-full p-3 rounded-[16px] text-xs font-bold text-left flex justify-between items-center transition-all tracking-wide ${isSelected ? 'bg-morandi-blue text-white' : hasOrder ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'hover:bg-gray-50 text-slate-700 bg-white border border-transparent'}`}><span>{c.name}</span>{hasOrder && !isSelected && <span className="text-[9px] bg-amber-200 text-amber-800 px-2 py-1 rounded-full">已建立</span>}{isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}</motion.button>); })}</div></div>)}
                        {(filteredInactiveDropdown.length > 0 || filteredActiveDropdown.length === 0) && (<div><h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1 mt-1 flex items-center gap-1"><WifiOff className="w-3 h-3" /> 其他店家 (休息/非排程)</h4><div className="space-y-1">{filteredInactiveDropdown.map(c => { const hasOrder = !!groupedOrders[c.name]; const isSelected = orderForm.customerId === c.id; return (<motion.button whileTap={buttonTap} key={c.id} onClick={() => handleSelectExistingCustomer(c.id)} className={`w-full p-3 rounded-[16px] text-xs font-bold text-left flex justify-between items-center transition-all tracking-wide ${isSelected ? 'bg-gray-500 text-white' : 'hover:bg-gray-100 text-gray-400 bg-gray-50 border border-transparent'}`}><span className="flex items-center gap-1">{c.name}<span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">休</span></span>{hasOrder && !isSelected && <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full">已建立</span>}{isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}</motion.button>); })}{filteredInactiveDropdown.length === 0 && filteredActiveDropdown.length === 0 && (<div className="p-4 text-center text-gray-300 text-xs tracking-wide">查無店家</div>)}</div></div>)}
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (<div className="space-y-2"><label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest px-2">客戶名稱</label><input type="text" className="w-full p-5 bg-white rounded-[24px] shadow-sm border border-slate-200 text-morandi-charcoal font-bold outline-none focus:ring-2 focus:ring-morandi-blue transition-all" placeholder="輸入零售名稱..." value={orderForm.customerName} onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})} /></div>)}
            
            {/* ... Order Form Fields (Time, Items, Note etc.) ... */}
             <div className="space-y-2"><label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest px-2">配送設定</label><div className="flex gap-2"><div className="flex-1"><input type="time" className="w-full p-5 bg-white rounded-[24px] shadow-sm border border-slate-200 text-morandi-charcoal font-bold outline-none focus:ring-2 focus:ring-morandi-blue transition-all" value={orderForm.deliveryTime} onChange={(e) => setOrderForm({...orderForm, deliveryTime: e.target.value})} /></div><div className="flex-1"><select value={orderForm.deliveryMethod} onChange={(e) => setOrderForm({...orderForm, deliveryMethod: e.target.value})} className="w-full h-full p-5 bg-white rounded-[24px] shadow-sm border border-slate-200 text-morandi-charcoal font-bold outline-none focus:ring-2 focus:ring-morandi-blue transition-all appearance-none"><option value="">配送方式...</option>{DELIVERY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></div></div></div>
             <div className="space-y-4"><div className="flex justify-between items-center"><label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest px-2">品項明細</label><button onClick={() => setOrderForm({...orderForm, items: [...orderForm.items, {productId: '', quantity: 10, unit: '斤'}]})} className="text-[10px] font-bold text-morandi-blue tracking-wide"><Plus className="w-3 h-3 inline mr-1" /> 增加品項</button></div>{orderForm.items.map((item, idx) => (<motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={idx} className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-200 flex items-center gap-2 flex-wrap"><select className="w-full sm:flex-1 bg-morandi-oatmeal/50 p-4 rounded-xl text-sm font-bold border border-slate-100 text-morandi-charcoal outline-none focus:ring-2 focus:ring-morandi-blue transition-all mb-2 sm:mb-0" value={item.productId} onChange={(e) => { const n = [...orderForm.items]; n[idx].productId = e.target.value; setOrderForm({...orderForm, items: n}); }}><option value="">選擇品項...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="flex items-center gap-2 w-full sm:w-auto justify-between"><input type="number" className="w-20 bg-morandi-oatmeal/50 p-4 rounded-xl text-center font-bold border border-slate-100 text-morandi-charcoal outline-none focus:ring-2 focus:ring-morandi-blue transition-all" value={item.quantity} onChange={(e) => { const n = [...orderForm.items]; n[idx].quantity = parseInt(e.target.value)||0; setOrderForm({...orderForm, items: n}); }} /><select value={item.unit || '斤'} onChange={(e) => { const n = [...orderForm.items]; n[idx].unit = e.target.value; setOrderForm({...orderForm, items: n}); }} className="w-20 bg-morandi-oatmeal/50 p-4 rounded-xl font-bold text-morandi-charcoal border border-slate-100 outline-none focus:ring-2 focus:ring-morandi-blue transition-all">{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select><motion.button whileTap={buttonTap} onClick={() => { const n = orderForm.items.filter((_, i) => i !== idx); setOrderForm({...orderForm, items: n.length ? n : [{productId:'', quantity:10, unit:'斤'}]}); }} className="p-2 text-morandi-pink hover:text-rose-300 transition-colors"><Trash2 className="w-4 h-4" /></motion.button></div></motion.div>))}</div>
             {/* ... Order Preview & Note ... */}
             <div className="space-y-2"><label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest px-2">訂單預覽與金額試算</label><div className="bg-morandi-amber-bg rounded-[24px] p-5 shadow-sm border border-amber-100/50"><div className="flex justify-between items-center mb-3 border-b border-amber-100 pb-2"><div className="flex items-center gap-2 text-morandi-amber-text"><Calculator className="w-4 h-4" /><span className="text-xs font-bold tracking-wide">預估清單</span></div><div className="text-xs font-bold text-morandi-amber-text/60 tracking-wide">共 {orderSummary.details.filter(d => d.rawQty > 0).length} 項</div></div><div className="space-y-2 mb-4">{orderSummary.details.filter(d => d.rawQty > 0).map((detail, i) => (<div key={i} className="flex justify-between items-center text-sm"><div className="flex flex-col"><span className="font-bold text-slate-700 tracking-wide">{detail.name}</span>{detail.isCalculated && (<span className="text-[10px] text-gray-400">(以單價 ${detail.unitPrice} 換算: {detail.rawQty}元 &rarr; {detail.displayQty}{detail.displayUnit})</span>)}</div><div className="flex items-center gap-3"><span className="font-bold text-slate-600">{detail.displayQty} {detail.displayUnit}</span><span className="font-black text-amber-600 w-12 text-right tracking-tight">${detail.subtotal}</span></div></div>))}{orderSummary.details.filter(d => d.rawQty > 0).length === 0 && (<div className="text-center text-xs text-amber-400 italic py-2 tracking-wide">尚未加入有效品項</div>)}</div><div className="flex justify-between items-center pt-3 border-t border-amber-200"><span className="text-xs font-bold text-amber-700 tracking-wide">預估總金額</span><span className="text-xl font-black text-amber-600 tracking-tight">${orderSummary.totalPrice}</span></div></div></div>
             <div className="space-y-2"><label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest px-2">訂單備註</label><textarea className="w-full p-5 bg-white rounded-[24px] shadow-sm border border-slate-200 text-morandi-charcoal font-bold resize-none outline-none focus:ring-2 focus:ring-morandi-blue transition-all placeholder:text-gray-300" rows={3} placeholder="備註特殊需求..." value={orderForm.note} onChange={(e) => setOrderForm({...orderForm, note: e.target.value})} /></div>
          </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      <AnimatePresence>
       {isEditingCustomer && (
        <div className="fixed inset-0 bg-morandi-oatmeal z-[60] flex flex-col">
          <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="flex flex-col h-full">
          <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10"><motion.button whileTap={buttonTap} onClick={() => setIsEditingCustomer(null)} className="p-2 rounded-2xl bg-gray-50"><X className="w-6 h-6 text-morandi-pebble" /></motion.button><h2 className="text-lg font-extrabold text-morandi-charcoal tracking-tight">店家詳細資料</h2><motion.button whileTap={buttonTap} onClick={handleSaveCustomer} disabled={isSaving} className="font-bold px-4 py-2 transition-colors text-morandi-blue disabled:text-gray-300">{isSaving ? '儲存中...' : '儲存'}</motion.button></div>
          <div className="p-6 space-y-6 overflow-y-auto pb-10">
            {/* ... Customer Form Fields ... */}
             <div className="space-y-2"><label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest px-2">基本資訊</label><div className="space-y-4"><input type="text" className="w-full p-5 bg-white rounded-[24px] shadow-sm border border-slate-200 font-bold text-morandi-charcoal outline-none focus:ring-2 focus:ring-morandi-blue transition-all" placeholder="店名" value={customerForm.name || ''} onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})} /><input type="tel" className="w-full p-5 bg-white rounded-[24px] shadow-sm border border-slate-200 font-bold text-morandi-charcoal outline-none focus:ring-2 focus:ring-morandi-blue transition-all" placeholder="電話" value={customerForm.phone || ''} onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})} /></div></div>
             <div className="space-y-2"><label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest px-2">配送設定</label><div className="space-y-4"><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 pl-1">配送方式</label><select value={customerForm.deliveryMethod || ''} onChange={(e) => setCustomerForm({...customerForm, deliveryMethod: e.target.value})} className="w-full p-5 bg-white rounded-[24px] shadow-sm border border-slate-200 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all appearance-none"><option value="">選擇配送方式...</option>{DELIVERY_METHODS.map(method => (<option key={method} value={method}>{method}</option>))}</select></div><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 pl-1">付款方式</label><select value={customerForm.paymentTerm || 'daily'} onChange={(e) => setCustomerForm({...customerForm, paymentTerm: e.target.value as any})} className="w-full p-5 bg-white rounded-[24px] shadow-sm border border-slate-200 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all appearance-none">{PAYMENT_TERMS.map(term => (<option key={term.value} value={term.value}>{term.label}</option>))}</select></div><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 pl-1">配送時間</label><input type="time" className="w-full p-5 bg-white rounded-[24px] shadow-sm border border-slate-200 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" value={customerForm.deliveryTime || '08:00'} onChange={(e) => setCustomerForm({...customerForm, deliveryTime: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 pl-1">每週公休</label><div className="flex gap-2">{WEEKDAYS.map(d => { const isOff = (customerForm.offDays || []).includes(d.value); return (<button key={d.value} onClick={() => { const current = customerForm.offDays || []; const newOff = isOff ? current.filter(x => x !== d.value) : [...current, d.value]; setCustomerForm({...customerForm, offDays: newOff}); }} className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${isOff ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-gray-400 border border-slate-200'}`}>{d.label}</button>); })}</div></div><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 pl-1">特定公休</label><div className="flex flex-wrap gap-2">{(customerForm.holidayDates || []).map(date => (<span key={date} className="bg-rose-50 text-rose-500 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-rose-100">{date} <button onClick={() => setCustomerForm({...customerForm, holidayDates: customerForm.holidayDates?.filter(d => d !== date)})}><X className="w-3 h-3" /></button></span>))}<button onClick={() => setHolidayEditorId('new')} className="bg-gray-50 text-gray-400 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gray-100 border border-slate-200"><Plus className="w-3 h-3" /> 新增日期</button></div></div></div></div>
             <div className="space-y-2"><label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest px-2">預設品項</label><div className="space-y-3">{(customerForm.defaultItems || []).map((item, idx) => (<div key={idx} className="flex gap-2"><select className="flex-1 p-3 bg-white rounded-xl text-sm font-bold text-slate-700 outline-none border border-slate-200" value={item.productId} onChange={(e) => { const newItems = [...(customerForm.defaultItems || [])]; newItems[idx] = { ...item, productId: e.target.value }; setCustomerForm({...customerForm, defaultItems: newItems}); }}><option value="">選擇品項</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="number" className="w-16 p-3 bg-white rounded-xl text-center font-bold text-slate-700 outline-none border border-slate-200" value={item.quantity} onChange={(e) => { const newItems = [...(customerForm.defaultItems || [])]; newItems[idx].quantity = Number(e.target.value); setCustomerForm({...customerForm, defaultItems: newItems}); }} /><select value={item.unit || '斤'} onChange={(e) => { const newItems = [...(customerForm.defaultItems || [])]; newItems[idx].unit = e.target.value; setCustomerForm({...customerForm, defaultItems: newItems}); }} className="w-20 p-3 bg-white rounded-xl font-bold text-slate-700 outline-none border border-slate-200">{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select><button onClick={() => setCustomerForm({...customerForm, defaultItems: customerForm.defaultItems?.filter((_, i) => i !== idx)})} className="p-3 bg-rose-50 text-rose-400 rounded-xl"><Trash2 className="w-4 h-4" /></button></div>))}<button onClick={() => setCustomerForm({...customerForm, defaultItems: [...(customerForm.defaultItems || []), {productId: '', quantity: 10, unit: '斤'}]})} className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-gray-400 font-bold text-xs flex items-center justify-center gap-1 hover:bg-gray-50 tracking-wide"><Plus className="w-4 h-4" /> 新增預設品項</button></div></div>
             <div className="space-y-2"><label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest px-2">專屬價目表</label><div className="bg-amber-50 p-4 rounded-[24px] space-y-3 border border-amber-100"><div className="flex gap-2"><select className="flex-1 p-3 bg-white rounded-xl text-sm font-bold text-slate-700 outline-none border border-slate-100" value={tempPriceProdId} onChange={(e) => setTempPriceProdId(e.target.value)}><option value="">選擇品項...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="number" placeholder="單價" className="w-20 p-3 bg-white rounded-xl text-center font-bold text-slate-700 outline-none border border-slate-100" value={tempPriceValue} onChange={(e) => setTempPriceValue(e.target.value)} /><select value={tempPriceUnit} onChange={(e) => setTempPriceUnit(e.target.value)} className="w-20 p-3 bg-white rounded-xl font-bold text-slate-700 outline-none border border-slate-100">{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select><button onClick={() => { if(tempPriceProdId && tempPriceValue) { const newPriceList = [...(customerForm.priceList || [])]; const existingIdx = newPriceList.findIndex(x => x.productId === tempPriceProdId); if(existingIdx >= 0) { newPriceList[existingIdx].price = Number(tempPriceValue); newPriceList[existingIdx].unit = tempPriceUnit; } else { newPriceList.push({productId: tempPriceProdId, price: Number(tempPriceValue), unit: tempPriceUnit}); } setCustomerForm({...customerForm, priceList: newPriceList}); setTempPriceProdId(''); setTempPriceValue(''); setTempPriceUnit('斤'); } }} className="p-3 bg-amber-400 text-white rounded-xl shadow-sm"><Plus className="w-4 h-4" /></button></div><div className="space-y-2">{(customerForm.priceList || []).map((pl, idx) => { const p = products.find(prod => prod.id === pl.productId); return (<div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100"><span className="text-sm font-bold text-slate-700 tracking-wide">{p?.name || pl.productId}</span><div className="flex items-center gap-3"><span className="font-black text-amber-500 tracking-tight">${pl.price} <span className="text-xs text-gray-400 font-bold">/ {pl.unit || '斤'}</span></span><button onClick={() => setCustomerForm({...customerForm, priceList: customerForm.priceList?.filter((_, i) => i !== idx)})} className="text-gray-300 hover:text-rose-400"><X className="w-4 h-4" /></button></div></div>); })}</div></div></div>
          </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {isEditingProduct && (
         <div className="fixed inset-0 bg-morandi-oatmeal z-[60] flex flex-col">
           <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="flex flex-col h-full">
           <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10"><motion.button whileTap={buttonTap} onClick={() => setIsEditingProduct(null)} className="p-2 rounded-2xl bg-gray-50"><X className="w-6 h-6 text-morandi-pebble" /></motion.button><h2 className="text-lg font-extrabold text-morandi-charcoal tracking-tight">品項資料</h2><motion.button whileTap={buttonTap} onClick={handleSaveProduct} disabled={isSaving} className="font-bold px-4 py-2 transition-colors text-morandi-blue disabled:text-gray-300">完成儲存</motion.button></div>
           <div className="p-6 space-y-6">
              <div className="space-y-2"><label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest px-2">品項名稱</label><input type="text" className="w-full p-5 bg-white rounded-[24px] shadow-sm border border-slate-200 font-bold text-morandi-charcoal outline-none focus:ring-2 focus:ring-morandi-blue transition-all" placeholder="例如：油麵 (小)" value={productForm.name || ''} onChange={(e) => setProductForm({...productForm, name: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest px-2">計算單位</label><input type="text" className="w-full p-5 bg-white rounded-[24px] shadow-sm border border-slate-200 font-bold text-morandi-charcoal outline-none focus:ring-2 focus:ring-morandi-blue transition-all" placeholder="例如：斤" value={productForm.unit || ''} onChange={(e) => setProductForm({...productForm, unit: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-morandi-pebble uppercase tracking-widest px-2">預設單價</label><input type="number" className="w-full p-5 bg-white rounded-[24px] shadow-sm border border-slate-200 font-bold text-morandi-charcoal outline-none focus:ring-2 focus:ring-morandi-blue transition-all" placeholder="例如：35" value={productForm.price || ''} onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})} /></div>
           </div>
           </motion.div>
         </div>
      )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 flex justify-around py-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <NavItem active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ClipboardList className="w-6 h-6" />} label="訂單" />
        <NavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={<Users className="w-6 h-6" />} label="客戶" />
        <NavItem active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package className="w-6 h-6" />} label="品項" />
        <NavItem active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<CalendarCheck className="w-6 h-6" />} label="行程" />
        <NavItem active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={<Wallet className="w-6 h-6" />} label="帳務" />
      </nav>
    </div>
  );
};

export default App;
