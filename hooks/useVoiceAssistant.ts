import React, { useState, useEffect } from 'react';
import { Customer, Product, OrderItem, ToastType } from '../types';
import { formatDateStr } from '../utils';

interface UseVoiceAssistantProps {
  customers: Customer[];
  products: Product[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  setOrderForm: React.Dispatch<React.SetStateAction<any>>;
  setEditingOrderId: (id: string | null) => void;
  setIsAddingOrder: (isAdding: boolean) => void;
  setCustomerPickerConfig: (config: any) => void;
  handleSelectExistingCustomer: (id: string) => void;
  addToast: (msg: string, type: ToastType) => void;
}

// Step 1: 同義詞字典
const PRODUCT_ALIASES: Record<string, string[]> = {
  '油麵': ['黃麵', '切仔麵', '油面', '黃面'],
  '陽春麵': ['白麵', '扁麵', '陽春面', '白面'],
  '意麵': ['鹽水意麵', '乾意麵', '意面'],
  '拉麵': ['細拉麵', '粗拉麵', '拉面'],
  '米粉': ['炊粉', '新竹米粉'],
  '冬粉': ['粉絲', '冬粉'],
  '板條': ['粿仔', '粄條', '粿仔條'],
  '水餃皮': ['餃子皮'],
  '餛飩皮': ['雲吞皮', '扁食皮'],
};

// 中文數字轉換
const parseChineseNumber = (str: string): number => {
  const map: Record<string, number> = {
    '一': 1, '二': 2, '兩': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '半': 0.5
  };
  if (map[str]) return map[str];
  const num = parseFloat(str);
  return isNaN(num) ? 1 : num;
};

export const useVoiceAssistant = ({
  customers,
  products,
  selectedDate,
  setSelectedDate,
  setOrderForm,
  setEditingOrderId,
  setIsAddingOrder,
  setCustomerPickerConfig,
  handleSelectExistingCustomer,
  addToast
}: UseVoiceAssistantProps) => {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceLoadingText, setVoiceLoadingText] = useState('AI 正在解析您的訂單...');

  // Effect for dynamic loading text
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isProcessingVoice) {
      setVoiceLoadingText('AI 正在解析您的訂單...');
      timer = setTimeout(() => {
        setVoiceLoadingText('正在思考中，請稍候...');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isProcessingVoice]);

  const handleProcessVoiceOrder = async (transcript: string) => {
    setIsProcessingVoice(true);

    try {
      // 1. 預處理：移除無意義的語助詞
      let cleanText = transcript.replace(/那個|然後|幫我|一下|麻煩|請/g, '');
      
      // 2. 識別客戶
      let matchedCustomerId = '';
      let matchedCustomerName = '';
      
      // 簡單模糊比對客戶名稱
      for (const customer of customers) {
        if (cleanText.includes(customer.name)) {
          matchedCustomerId = customer.id;
          matchedCustomerName = customer.name;
          // 移除已識別的客戶名稱，避免干擾後續解析
          cleanText = cleanText.replace(customer.name, '');
          break;
        }
      }

      // 3. 識別品項 (使用同義詞與模糊比對)
      const identifiedItems: any[] = [];
      
      // 依產品名稱長度排序，優先匹配較長的名稱，避免誤判 (例如 "油麵(大)" 優先於 "油麵")
      const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
      
      for (const p of sortedProducts) {
         const aliases = PRODUCT_ALIASES[p.name] || [];
         // 加上產品名稱本身，並過濾掉空字串
         const keywords = [p.name, ...aliases].filter(Boolean);
         
         // 檢查 transcript 是否包含關鍵字
         const match = keywords.find(k => cleanText.includes(k));
         
         if (match) {
            // 4. 解析數量 (尋找關鍵字附近的數字)
            // Regex 解釋:
            // 匹配關鍵字後面的內容
            // (\d+|半|一|兩|二|三|四|五|六|七|八|九|十) -> 捕捉數字或中文數字
            // (.*?) -> 非貪婪匹配中間的字 (可能是空白或其他字)
            // (斤|包|袋|公斤|kg|g|台斤|個|顆|粒) -> 捕捉單位
            const qtyRegex = new RegExp(`${match}.*?(\\d+|半|一|兩|二|三|四|五|六|七|八|九|十)(.*?)(斤|包|袋|公斤|kg|g|台斤|個|顆|粒)`, 'i');
            const qtyMatch = cleanText.match(qtyRegex);
            
            let quantity = 10; // 預設
            let unit = '斤';
            let note = '';
            
            if (qtyMatch) {
               quantity = parseChineseNumber(qtyMatch[1]); 
               unit = qtyMatch[3];
               
               // 移除已識別的部分 (關鍵字 + 數量 + 單位)
               // 這裡比較粗略，直接把匹配到的整段移除
               cleanText = cleanText.replace(qtyMatch[0], '');
            } else {
               // 如果只有品項沒有數量，預設 10 斤，並只移除品項名稱
               cleanText = cleanText.replace(match, '');
            }
            
            identifiedItems.push({ productId: p.id, quantity, unit, note });
         }
      }

      // 5. 提取備註 (移除已識別的品項和數量，剩下的就是備註)
      // 清理剩餘文字中的標點符號和多餘空白
      let remainingNote = cleanText.replace(/[，。、,.]/g, ' ').trim();
      
      // 如果有識別到品項，將剩餘文字作為第一個品項的備註 (或是全域備註)
      // 這裡簡單處理：如果有剩餘文字，且長度大於 1 (避免只剩一個字)，就當作備註
      if (remainingNote.length > 1 && identifiedItems.length > 0) {
          identifiedItems[0].note = remainingNote;
      }

      // Populate Form
      const newItems: OrderItem[] = identifiedItems.length > 0 
        ? identifiedItems.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unit: i.unit
          }))
        : [{ productId: '', quantity: 10, unit: '斤' }];

      // Find Customer Delivery Method if ID matched
      let deliveryMethod = '';
      let deliveryTime = '08:00';
      
      if (matchedCustomerId) {
        const c = customers.find(x => x.id === matchedCustomerId);
        if (c) {
          deliveryMethod = c.deliveryMethod || '';
          deliveryTime = c.deliveryTime || '08:00';
        }
      }

      setOrderForm((prev: any) => ({
        ...prev,
        customerType: 'existing',
        customerName: matchedCustomerName || transcript.substring(0, 10),
        customerId: matchedCustomerId || '',
        deliveryTime: deliveryTime,
        deliveryMethod: deliveryMethod,
        items: newItems,
        note: remainingNote // 將剩餘文字也放入全域備註，以防萬一
      }));

      // Open Editor
      setEditingOrderId(null);
      setIsAddingOrder(true);
      
      // UX: If customer not found, open picker automatically after a short delay
      if (!matchedCustomerId) {
         setTimeout(() => {
            setCustomerPickerConfig({
               isOpen: true,
               onSelect: (id: string) => handleSelectExistingCustomer(id)
            });
            addToast('AI 未能確定店家，請手動選擇', 'info');
         }, 500);
      } else {
         addToast('語音解析成功！請確認內容', 'success');
      }

    } catch (e: any) {
      console.error("Voice Processing Error:", e);
      addToast('解析失敗，請手動輸入', 'error');
      
      // Still open the form but empty
      setEditingOrderId(null);
      setIsAddingOrder(true);
      setOrderForm((prev: any) => ({ ...prev, note: `語音轉錄: ${transcript}` }));
    } finally {
      setIsProcessingVoice(false);
    }
  };

  return {
    isVoiceModalOpen,
    setIsVoiceModalOpen,
    isProcessingVoice,
    voiceLoadingText,
    handleProcessVoiceOrder
  };
};