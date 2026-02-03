
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Package, 
  ClipboardList, 
  History,
  Settings,
  ChevronRight,
  ChevronLeft,
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
  CheckCircle2
} from 'lucide-react';
import { Customer, Product, Order, OrderStatus, OrderItem, GASResponse, DefaultItem } from './types';
import { COLORS, WEEKDAYS, GAS_URL } from './constants';

// --- 工具函數 ---
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

// --- 子組件：日期選擇器 ---
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

// --- 主要 App 組件 ---
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'products' | 'history'>('orders');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowDate());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [holidayEditorId, setHolidayEditorId] = useState<string | null>(null);

  const [orderForm, setOrderForm] = useState<{
    customerType: 'existing' | 'retail';
    customerId: string;
    customerName: string;
    deliveryTime: string;
    items: OrderItem[];
    note: string;
  }>({
    customerType: 'existing',
    customerId: '',
    customerName: '',
    deliveryTime: '08:00',
    items: [{ productId: '', quantity: 10 }],
    note: ''
  });

  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({});
  const [isEditingCustomer, setIsEditingCustomer] = useState<string | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const [historySearch, setHistorySearch] = useState('');

  // ------------------ 雲端資料同步讀取 ------------------
  useEffect(() => {
    const fetchData = async () => {
      if (!GAS_URL) {
        setIsInitialLoading(false);
        return;
      }
      try {
        const res = await fetch(`${GAS_URL}?type=init`);
        const result: GASResponse<any> = await res.json();
        
        if (result.success && result.data) {
          const mappedCustomers: Customer[] = (result.data.customers || []).map((c: any) => {
            return {
              id: String(c.ID || c.id || ''),
              name: c.客戶名稱 || c.name || '',
              phone: c.電話 || c.phone || '',
              // 嘗試讀取多種可能的配送時間欄位名稱
              deliveryTime: c.配送時間 || c.deliveryTime || '',
              // 嘗試讀取多種可能的 JSON 欄位名稱 (有無 JSON 後綴)
              defaultItems: safeJsonArray(c.預設品項JSON || c.預設品項 || c.defaultItems),
              offDays: safeJsonArray(c.公休日週期JSON || c.公休日週期 || c.offDays),
              holidayDates: safeJsonArray(c.特定公休日JSON || c.特定公休日 || c.holidayDates)
            };
          });

          const mappedProducts: Product[] = (result.data.products || []).map((p: any) => ({
            id: String(p.ID || p.id),
            name: p.品項 || p.name,
            unit: p.單位 || p.unit
          }));

          const rawOrders = result.data.orders || [];
          const orderMap: { [key: string]: Order } = {};
          rawOrders.forEach((o: any) => {
            const oid = String(o.訂單ID || o.id);
            if (!orderMap[oid]) {
              orderMap[oid] = {
                id: oid,
                createdAt: o.建立時間 || o.createdAt,
                customerName: o.客戶名 || o.customerName || '未知客戶',
                deliveryDate: o.配送日期 || o.deliveryDate,
                deliveryTime: o.配送時間 || o.deliveryTime,
                items: [],
                note: o.備註 || o.note || '',
                status: (o.狀態 || o.status as OrderStatus) || OrderStatus.PENDING
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
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  // ------------------ 業務邏輯 ------------------
  const ordersForDate = useMemo(() => {
    return orders.filter(o => o.deliveryDate === selectedDate);
  }, [orders, selectedDate]);

  const activeCustomersForDate = useMemo(() => {
    const dayOfWeek = new Date(selectedDate).getDay();
    return customers.filter(c => {
      const isSpecificHoliday = (c.holidayDates || []).includes(selectedDate);
      const isWeeklyHoliday = (c.offDays || []).includes(dayOfWeek);
      return !isSpecificHoliday && !isWeeklyHoliday;
    });
  }, [customers, selectedDate]);

  const filteredHistory = useMemo(() => {
    return orders
      .filter(o => {
        const search = (historySearch || '').toLowerCase();
        const name = (o.customerName || '').toLowerCase();
        return name.includes(search);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, historySearch]);

  const handleSelectExistingCustomer = (id: string) => {
    const cust = customers.find(c => c.id === id);
    if (cust) {
      setOrderForm({
        ...orderForm,
        customerId: id,
        customerName: cust.name,
        deliveryTime: formatTimeForInput(cust.deliveryTime),
        items: cust.defaultItems && cust.defaultItems.length > 0 
          ? cust.defaultItems.map(di => ({ ...di })) 
          : [{ productId: '', quantity: 10 }]
      });
    }
  };

  const handleSaveOrder = async () => {
    if (isSaving) return;
    const finalName = orderForm.customerType === 'existing' ? orderForm.customerName : orderForm.customerName;
    if (!finalName) return;
    const validItems = orderForm.items.filter(i => i.productId !== '' && i.quantity > 0);
    if (validItems.length === 0) return;

    setIsSaving(true);
    const newOrder: Order = {
      id: 'ORD-' + Date.now(),
      createdAt: new Date().toISOString(),
      customerName: finalName,
      deliveryDate: selectedDate,
      deliveryTime: orderForm.deliveryTime,
      items: validItems,
      note: orderForm.note,
      status: OrderStatus.PENDING
    };

    try {
      if (GAS_URL) {
        const uploadItems = validItems.map(item => {
          const p = products.find(prod => prod.id === item.productId);
          return { productName: p?.name || item.productId, quantity: item.quantity };
        });
        await fetch(GAS_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'createOrder', data: { ...newOrder, items: uploadItems } })
        });
      }
    } catch (e) { console.error(e); }

    setOrders([newOrder, ...orders]);
    setIsSaving(false);
    setIsAddingOrder(false);
    setOrderForm({ customerType: 'existing', customerId: '', customerName: '', deliveryTime: '08:00', items: [{ productId: '', quantity: 10 }], note: '' });
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('確定要刪除此訂單嗎？')) return;
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name || isSaving) return;
    setIsSaving(true);

    const isDuplicateName = customers.some(c => 
      c.name.trim() === (customerForm.name || '').trim() && 
      c.id !== (isEditingCustomer === 'new' ? null : isEditingCustomer)
    );

    if (isDuplicateName) {
      alert('客戶名稱不可重複！請使用其他名稱。');
      setIsSaving(false);
      return;
    }

    const finalCustomer: Customer = {
      id: isEditingCustomer === 'new' ? Date.now().toString() : (isEditingCustomer as string),
      name: (customerForm.name || '').trim(),
      phone: (customerForm.phone || '').trim(),
      deliveryTime: customerForm.deliveryTime || '08:00',
      defaultItems: (customerForm.defaultItems || []).filter(i => i.productId !== ''),
      offDays: customerForm.offDays || [],
      holidayDates: customerForm.holidayDates || []
    };

    try {
      if (GAS_URL) {
        await fetch(GAS_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'updateCustomer', data: finalCustomer })
        });
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
      unit: productForm.unit || '斤'
    };
    try {
      if (GAS_URL) {
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'updateProduct', data: finalProduct }) });
      }
    } catch (e) { console.error(e); }
    if (isEditingProduct === 'new') setProducts([...products, finalProduct]);
    else setProducts(products.map(p => p.id === isEditingProduct ? finalProduct : p));
    setIsSaving(false);
    setIsEditingProduct(null);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f1ea] p-10 text-center">
        <Loader2 className="w-12 h-12 text-[#8e9775] animate-spin mb-6" />
        <h2 className="text-xl font-bold text-gray-700">正在同步雲端資料...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#f4f1ea] relative shadow-2xl overflow-hidden">
      <header className="p-6 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-40">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">麵廠職人</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">專業訂單管理系統</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
          <Settings className="w-5 h-5 text-gray-400" />
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
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-400 px-2 flex items-center gap-2 uppercase tracking-widest"><Layers className="w-4 h-4" /> 今日清單 ({ordersForDate.length})</h2>
              {ordersForDate.length > 0 ? ordersForDate.map(order => (
                <div key={order.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-white group relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg font-bold" style={{ color: COLORS.primary }}>{order.customerName.charAt(0)}</div>
                      <div><h3 className="font-bold text-slate-800">{order.customerName}</h3><div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase"><Clock className="w-3 h-3" /> {order.deliveryTime}</div></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-500 px-3 py-1 rounded-full border border-amber-100 uppercase">待處理</span>
                      <button onClick={() => handleDeleteOrder(order.id)} className="p-2 text-rose-200 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3 bg-gray-50/50 p-4 rounded-2xl">
                    {order.items.map((item, idx) => {
                      const p = products.find(prod => prod.id === item.productId);
                      return <div key={idx} className="flex justify-between items-center text-sm"><span className="font-medium text-slate-600">{p?.name || item.productId}</span><span className="font-black text-slate-800">{item.quantity} {p?.unit || '斤'}</span></div>;
                    })}
                  </div>
                  {order.note && (
                    <div className="flex items-start gap-2 text-slate-500 text-xs px-2 italic"><MessageSquare className="w-3.5 h-3.5 mt-0.5 text-gray-300" /> {order.note}</div>
                  )}
                </div>
              )) : (
                <div className="py-20 flex flex-col items-center text-center gap-4"><ClipboardList className="w-16 h-16 text-gray-200" /><p className="text-gray-300 italic text-sm">此日期尚無訂單</p></div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Users className="w-5 h-5" style={{ color: COLORS.primary }} /> 店家管理</h2>
              <button onClick={() => { setCustomerForm({ name: '', phone: '', deliveryTime: '08:00', defaultItems: [], offDays: [], holidayDates: [] }); setIsEditingCustomer('new'); }} className="p-3 rounded-2xl text-white shadow-lg" style={{ backgroundColor: COLORS.primary }}><Plus className="w-6 h-6" /></button>
            </div>
            {customers.map(c => (
              <div key={c.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-[22px] bg-gray-50 flex items-center justify-center text-xl font-bold" style={{ color: COLORS.primary }}>{c.name.charAt(0)}</div>
                    <div><h3 className="font-bold text-slate-800 text-lg">{c.name}</h3><p className="text-xs text-slate-500 font-medium">{c.phone || '無電話'}</p></div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1">
                      {WEEKDAYS.map(d => (
                        <div key={d.value} className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold ${c.offDays?.includes(d.value) ? 'bg-rose-100 text-rose-400' : 'bg-gray-50 text-gray-300'}`}>{d.label}</div>
                      ))}
                    </div>
                    {c.holidayDates && c.holidayDates.length > 0 && <span className="text-[8px] font-bold text-rose-300">+{c.holidayDates.length} 特定休</span>}
                  </div>
                </div>

                {/* --- 卡片詳情區塊 --- */}
                <div className="space-y-3 mb-4 bg-gray-50/60 p-4 rounded-[24px]">
                  <div className="text-[11px] font-bold text-slate-700">
                    配送時間:{formatTimeDisplay(c.deliveryTime)}
                  </div>

                  {c.defaultItems && c.defaultItems.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100/50">
                      {c.defaultItems.map((di, idx) => {
                        const p = products.find(prod => prod.id === di.productId);
                        return (
                          <div key={idx} className="bg-white px-2 py-1 rounded-xl text-[10px] border border-gray-100 flex items-center gap-1 shadow-sm">
                            <span className="font-bold text-slate-700">{p?.name || '未知品項'}</span>
                            <span className="font-black" style={{ color: COLORS.primary }}>{di.quantity}{p?.unit || '斤'}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-300 font-medium italic pt-2 border-t border-gray-100/50">尚未設定預設品項</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { 
                    setCustomerForm({
                      ...c,
                      deliveryTime: formatTimeForInput(c.deliveryTime)
                    }); 
                    setIsEditingCustomer(c.id); 
                  }} className="flex-1 py-3 bg-gray-50 rounded-2xl text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"><Edit2 className="w-3.5 h-3.5" /> 編輯資料</button>
                  <button onClick={() => { if(confirm('刪除店家？')) setCustomers(customers.filter(x => x.id !== c.id)); }} className="px-4 py-3 bg-gray-50 rounded-2xl text-rose-200 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Package className="w-5 h-5" style={{ color: COLORS.primary }} /> 品項清單</h2>
              <button onClick={() => { setProductForm({ name: '', unit: '斤' }); setIsEditingProduct('new'); }} className="p-3 rounded-2xl text-white shadow-lg" style={{ backgroundColor: COLORS.primary }}><Plus className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-white flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center" style={{ color: COLORS.primary }}><Box className="w-5 h-5" /></div>
                    <span className="font-bold text-slate-700">{p.name} <span className="text-[10px] text-gray-300 ml-1">({p.unit})</span></span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setProductForm(p); setIsEditingProduct(p.id); }} className="p-2 text-gray-300 hover:text-slate-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { if(confirm('刪除品項？')) setProducts(products.filter(x => x.id !== p.id)); }} className="p-2 text-rose-100 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="px-1">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4"><History className="w-5 h-5" style={{ color: COLORS.primary }} /> 歷史紀錄</h2>
              <div className="relative mb-6">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input type="text" placeholder="搜尋店名或訂單內容..." className="w-full pl-14 pr-6 py-5 bg-white rounded-[28px] border-none shadow-sm text-slate-800 font-bold focus:ring-2 focus:ring-[#8e9775] transition-all placeholder:text-gray-300" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
              </div>
              <div className="space-y-4">
                {filteredHistory.map(o => (
                  <div key={o.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-white">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800">{o.customerName}</h3>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{o.deliveryDate}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mb-2 font-medium">
                      {o.items.map((item, idx) => {
                        const p = products.find(prod => prod.id === item.productId || prod.name === item.productId);
                        return <span key={idx}>{p?.name || item.productId} {item.quantity}{p?.unit || '斤'}{idx < o.items.length - 1 ? '、' : ''}</span>;
                      })}
                    </div>
                    {o.note && <div className="text-[10px] text-slate-400 italic flex items-center gap-1 font-medium"><MessageSquare className="w-3 h-3 text-gray-200" /> {o.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- 彈窗模組 --- */}
      {isDatePickerOpen && <DatePickerModal selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsDatePickerOpen(false)} />}
      
      {isAddingOrder && (
        <div className="fixed inset-0 bg-[#f4f1ea] z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
            <button onClick={() => setIsAddingOrder(false)} className="p-2 rounded-2xl bg-gray-50"><X className="w-6 h-6 text-gray-400" /></button>
            <h2 className="text-lg font-bold text-slate-800">建立配送訂單</h2>
            <button onClick={handleSaveOrder} disabled={isSaving} className="font-bold px-4 py-2 transition-colors" style={{ color: isSaving ? '#ccc' : COLORS.primary }}>{isSaving ? '儲存中...' : '儲存'}</button>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto pb-10">
            <div className="flex bg-white p-1 rounded-[24px] shadow-sm">
              <button onClick={() => setOrderForm({...orderForm, customerType: 'existing'})} className={`flex-1 py-4 rounded-[20px] text-xs font-bold transition-all ${orderForm.customerType === 'existing' ? 'bg-sage-600 text-white shadow-md' : 'text-gray-400'}`} style={{ backgroundColor: orderForm.customerType === 'existing' ? COLORS.primary : '' }}>現有客戶</button>
              <button onClick={() => setOrderForm({...orderForm, customerType: 'retail', customerId: ''})} className={`flex-1 py-4 rounded-[20px] text-xs font-bold transition-all ${orderForm.customerType === 'retail' ? 'bg-sage-600 text-white shadow-md' : 'text-gray-400'}`} style={{ backgroundColor: orderForm.customerType === 'retail' ? COLORS.primary : '' }}>零售客戶</button>
            </div>
            {orderForm.customerType === 'existing' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">配送店家 (今日營業)</label>
                <select className="w-full p-5 bg-white rounded-[24px] shadow-sm font-bold text-slate-800 border-none appearance-none outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" value={orderForm.customerId} onChange={(e) => handleSelectExistingCustomer(e.target.value)}>
                  <option value="">選擇店家...</option>
                  {activeCustomersForDate.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">客戶名稱</label>
                <input type="text" className="w-full p-5 bg-white rounded-[24px] shadow-sm text-slate-800 font-bold border-none outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" placeholder="輸入零售名稱..." value={orderForm.customerName} onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})} />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">配送時間</label>
              <input type="time" className="w-full p-5 bg-white rounded-[24px] shadow-sm text-slate-800 font-bold border-none outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" value={orderForm.deliveryTime} onChange={(e) => setOrderForm({...orderForm, deliveryTime: e.target.value})} />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">品項明細</label><button onClick={() => setOrderForm({...orderForm, items: [...orderForm.items, {productId: '', quantity: 10}]})} className="text-[10px] font-bold" style={{ color: COLORS.primary }}><Plus className="w-3 h-3 inline mr-1" /> 增加品項</button></div>
              {orderForm.items.map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-[28px] shadow-sm flex items-center gap-4 animate-in slide-in-from-right duration-200">
                  <select className="flex-1 bg-gray-50 p-4 rounded-xl text-sm font-bold border-none text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" value={item.productId} onChange={(e) => { const n = [...orderForm.items]; n[idx].productId = e.target.value; setOrderForm({...orderForm, items: n}); }}>
                    <option value="">選擇品項...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <input type="number" className="w-20 bg-gray-50 p-4 rounded-xl text-center font-bold border-none text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" value={item.quantity} onChange={(e) => { const n = [...orderForm.items]; n[idx].quantity = parseInt(e.target.value)||0; setOrderForm({...orderForm, items: n}); }} />
                    <button onClick={() => { const n = orderForm.items.filter((_, i) => i !== idx); setOrderForm({...orderForm, items: n.length ? n : [{productId:'', quantity:10}]}); }} className="p-2 text-rose-100 hover:text-rose-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">訂單備註</label>
              <textarea className="w-full p-5 bg-white rounded-[24px] shadow-sm text-slate-700 font-bold border-none resize-none outline-none focus:ring-2 focus:ring-[#8e9775] transition-all placeholder:text-gray-300" rows={3} placeholder="備註特殊需求..." value={orderForm.note} onChange={(e) => setOrderForm({...orderForm, note: e.target.value})} />
            </div>
          </div>
        </div>
      )}

      {isEditingCustomer && (
        <div className="fixed inset-0 bg-[#f4f1ea] z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
            <button onClick={() => setIsEditingCustomer(null)} className="p-2 rounded-2xl bg-gray-50"><X className="w-6 h-6 text-gray-400" /></button>
            <h2 className="text-lg font-bold text-slate-800">店家詳細資料</h2>
            <button onClick={handleSaveCustomer} disabled={isSaving} className="font-bold px-4 py-2 transition-colors" style={{ color: isSaving ? '#ccc' : COLORS.primary }}>完成儲存</button>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto pb-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">基本資訊</label>
              <div className="space-y-4">
                <input type="text" className="w-full p-5 bg-white rounded-[24px] shadow-sm border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" placeholder="店名" value={customerForm.name || ''} onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})} />
                <input type="tel" className="w-full p-5 bg-white rounded-[24px] shadow-sm border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" placeholder="聯絡電話" value={customerForm.phone || ''} onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})} />
                <input type="time" className="w-full p-5 bg-white rounded-[24px] shadow-sm border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" value={formatTimeForInput(customerForm.deliveryTime)} onChange={(e) => setCustomerForm({...customerForm, deliveryTime: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">預設配送內容 (每次自動帶入)</label>
              <div className="bg-white rounded-[28px] p-5 shadow-sm space-y-4">
                {customerForm.defaultItems?.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select className="flex-1 bg-gray-50 p-3 rounded-xl text-xs font-bold border-none text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" value={item.productId} onChange={(e) => { const n = [...(customerForm.defaultItems || [])]; n[idx].productId = e.target.value; setCustomerForm({...customerForm, defaultItems: n}); }}>
                      <option value="">選擇品項...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" className="w-16 bg-gray-50 p-3 rounded-xl text-center font-bold border-none text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" value={item.quantity} onChange={(e) => { const n = [...(customerForm.defaultItems || [])]; n[idx].quantity = parseInt(e.target.value)||0; setCustomerForm({...customerForm, defaultItems: n}); }} />
                    <button onClick={() => { const n = (customerForm.defaultItems || []).filter((_, i) => i !== idx); setCustomerForm({...customerForm, defaultItems: n}); }} className="text-rose-200 hover:text-rose-400 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => setCustomerForm({...customerForm, defaultItems: [...(customerForm.defaultItems || []), {productId:'', quantity:10}]})} className="w-full py-3 bg-gray-50 rounded-xl text-slate-400 font-bold text-[10px] flex items-center justify-center gap-1 hover:bg-gray-100 transition-colors"><Plus className="w-3 h-3" /> 新增預設品項</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">公休日設定</label>
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-[28px] shadow-sm">
                  <p className="text-[10px] text-gray-400 mb-3 font-bold">每週固定休</p>
                  <div className="flex justify-between">
                    {WEEKDAYS.map(day => (
                      <button 
                        key={day.value} 
                        onClick={() => {
                          const current = customerForm.offDays || [];
                          const next = current.includes(day.value) ? current.filter(d => d !== day.value) : [...current, day.value];
                          setCustomerForm({...customerForm, offDays: next});
                        }}
                        className={`w-10 h-10 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${customerForm.offDays?.includes(day.value) ? 'bg-rose-500 text-white shadow-md' : 'bg-gray-50 text-gray-300'}`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setHolidayEditorId(isEditingCustomer)} className="w-full p-5 bg-white rounded-[24px] shadow-sm flex items-center justify-between font-bold text-slate-800 hover:bg-gray-100 transition-colors">特定日期公休 (月曆選擇)<span className="text-xs bg-rose-50 text-rose-400 px-3 py-1 rounded-full font-bold">{customerForm.holidayDates?.length || 0} 天</span></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditingProduct && (
        <div className="fixed inset-0 bg-[#f4f1ea] z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
            <button onClick={() => setIsEditingProduct(null)} className="p-2 rounded-2xl bg-gray-50"><X className="w-6 h-6 text-gray-400" /></button>
            <h2 className="text-lg font-bold text-slate-800">品項規格編輯</h2>
            <button onClick={handleSaveProduct} disabled={isSaving} className="font-bold px-4 py-2 transition-colors" style={{ color: isSaving ? '#ccc' : COLORS.primary }}>儲存修改</button>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">品項名稱</label>
              <input type="text" className="w-full p-5 bg-white rounded-[24px] shadow-sm border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" placeholder="例如: 白麵, 拉麵, 意麵" value={productForm.name || ''} onChange={(e) => setProductForm({...productForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">計量單位</label>
              <input type="text" className="w-full p-5 bg-white rounded-[24px] shadow-sm border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#8e9775] transition-all" placeholder="例如: 斤, 包, 籃" value={productForm.unit || ''} onChange={(e) => setProductForm({...productForm, unit: e.target.value})} />
            </div>
          </div>
        </div>
      )}

      {holidayEditorId && (
        <HolidayCalendar storeName={customerForm.name || ''} holidays={customerForm.holidayDates || []} onClose={() => setHolidayEditorId(null)} onToggle={d => {
          const current = customerForm.holidayDates || [];
          const next = current.includes(d) ? current.filter(x => x !== d) : [...current, d];
          setCustomerForm({...customerForm, holidayDates: next});
        }} />
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 flex justify-around py-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <NavItem active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ClipboardList className="w-6 h-6" />} label="訂單" />
        <NavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={<Users className="w-6 h-6" />} label="客戶" />
        <NavItem active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package className="w-6 h-6" />} label="品項" />
        <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History className="w-6 h-6" />} label="歷史" />
      </nav>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-sage-600' : 'text-gray-300'}`} style={{ color: active ? COLORS.primary : '' }}>
    <div className={`p-1 rounded-xl transition-colors ${active ? 'bg-sage-50' : ''}`} style={{ backgroundColor: active ? `${COLORS.primary}15` : '' }}>{icon}</div>
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
