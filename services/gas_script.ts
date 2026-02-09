
/**
 * GOOGLE APPS SCRIPT BACKEND CODE
 * Copy this into your Google Apps Script editor.
 */
export const GAS_BACKEND_CODE = `
/**
 * 麵廠訂單管理系統 - 後端 GAS 邏輯
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();
const SHEETS = {
  CUSTOMERS: SS.getSheetByName("Customers") || SS.insertSheet("Customers"),
  ORDERS: SS.getSheetByName("Orders") || SS.insertSheet("Orders"),
  PRODUCTS: SS.getSheetByName("Products") || SS.insertSheet("Products"),
  SETTINGS: SS.getSheetByName("Settings") || SS.insertSheet("Settings")
};

// 初始化表格結構
function setup() {
  // 設定 Header
  SHEETS.CUSTOMERS.getRange(1, 1, 1, 10).setValues([["ID", "客戶名稱", "電話", "配送時間", "預設品項JSON", "公休日週期JSON", "特定公休日JSON", "價目表JSON", "配送方式", "付款週期"]]);
  // 設定 JSON 欄位為純文字格式，避免 Google Sheets 自動格式化導致讀取錯誤
  SHEETS.CUSTOMERS.getRange(2, 5, SHEETS.CUSTOMERS.getMaxRows() - 1, 4).setNumberFormat("@");
  
  SHEETS.ORDERS.getRange(1, 1, 1, 10).setValues([["建立時間", "訂單ID", "客戶名", "配送日期", "配送時間", "品項", "數量", "備註", "狀態", "配送方式"]]);
  
  // 更新：新增 "分類" 欄位 (第 5 欄)
  SHEETS.PRODUCTS.getRange(1, 1, 1, 5).setValues([["ID", "品項", "單位", "單價", "分類"]]);

  // 初始化設定頁 (密碼)
  if (SHEETS.SETTINGS.getLastRow() === 0) {
     SHEETS.SETTINGS.getRange(1, 1, 1, 2).setValues([["Key", "Value"]]);
     // 預設密碼: 8888
     SHEETS.SETTINGS.getRange(2, 1, 1, 2).setValues([["ADMIN_PASSWORD", "8888"]]);
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    let result;

    switch (action) {
      case "login":
        result = login(params.data);
        break;
      case "changePassword":
        result = changePassword(params.data);
        break;
      case "createOrder":
        result = createOrder(params.data);
        break;
      case "updateCustomer":
        result = updateCustomer(params.data);
        break;
      case "updateProduct":
        result = updateProduct(params.data);
        break;
      case "deleteOrder":
        result = deleteOrder(params.data);
        break;
      case "deleteCustomer":
        result = deleteCustomer(params.data);
        break;
      case "deleteProduct":
        result = deleteProduct(params.data);
        break;
      case "updateOrderStatus":
        result = updateOrderStatus(params.data);
        break;
      case "reorderProducts":
        result = reorderProducts(params.data);
        break;
      case "batchUpdatePaymentStatus":
        result = batchUpdatePaymentStatus(params.data);
        break;
      default:
        throw new Error("Unknown action: " + action);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const type = e.parameter.type;
    const startDate = e.parameter.startDate; // Optional: format yyyy-MM-dd
    
    let data;

    if (type === "init") {
      data = {
        customers: getSheetData(SHEETS.CUSTOMERS),
        products: getSheetData(SHEETS.PRODUCTS),
        // Optimize: If startDate is provided, filter orders. Otherwise default to reasonable limit in frontend.
        orders: getFilteredOrders(startDate)
      };
    } else if (type === "orders") {
      data = getFilteredOrders(startDate);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- Helper to Filter Orders ---
function getFilteredOrders(startDateStr) {
  const allOrders = getSheetData(SHEETS.ORDERS);
  
  if (!startDateStr) {
    return allOrders;
  }

  // Simple string comparison works for yyyy-MM-dd format
  return allOrders.filter(order => {
    // Check '配送日期' or 'deliveryDate' depending on how getSheetData processes headers
    const orderDate = order['配送日期'] || order['deliveryDate']; 
    if (!orderDate) return false;
    return orderDate >= startDateStr;
  });
}

// --- 身份驗證邏輯 ---
function login(data) {
  const inputPassword = String(data.password).trim();
  const storedPassword = String(SHEETS.SETTINGS.getRange(2, 2).getValue()).trim();
  
  // 若後端尚未設定密碼 (例如新部署)，預設為 8888
  if (!storedPassword) {
    SHEETS.SETTINGS.getRange(2, 1, 1, 2).setValues([["ADMIN_PASSWORD", "8888"]]);
    return inputPassword === "8888";
  }
  
  return inputPassword === storedPassword;
}

function changePassword(data) {
  const oldPassword = String(data.oldPassword).trim();
  const newPassword = String(data.newPassword).trim();
  
  const storedPassword = String(SHEETS.SETTINGS.getRange(2, 2).getValue()).trim();
  
  if (storedPassword !== oldPassword) {
    return false; // 舊密碼錯誤
  }
  
  SHEETS.SETTINGS.getRange(2, 2).setValue(newPassword);
  return true;
}
// ------------------

function createOrder(orderData) {
  const timestamp = Utilities.formatDate(new Date(), SS.getSpreadsheetTimeZone(), "yyyy/MM/dd HH:mm:ss");
  const orderId = orderData.id || ("ORD-" + Date.now());
  
  const headerRange = SHEETS.ORDERS.getRange(1, 10);
  if (headerRange.getValue() !== "配送方式") {
    headerRange.setValue("配送方式");
  }

  const rows = orderData.items.map(item => {
    const displayProductName = item.productName; 
    return [
      timestamp,
      orderId,
      orderData.customerName,
      orderData.deliveryDate,
      orderData.deliveryTime,
      displayProductName,
      item.quantity,
      orderData.note || "",
      orderData.status || "PENDING", 
      orderData.deliveryMethod || "" 
    ];
  });

  SHEETS.ORDERS.getRange(SHEETS.ORDERS.getLastRow() + 1, 1, rows.length, 10).setValues(rows);
  return orderId;
}

function updateOrderStatus(data) {
  const sheet = SHEETS.ORDERS;
  const values = sheet.getDataRange().getValues();
  let updated = false;
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]).trim() === String(data.id).trim()) {
      sheet.getRange(i + 1, 9).setValue(data.status);
      updated = true;
    }
  }
  
  if (!updated) throw new Error("Order not found");
  return true;
}

function batchUpdatePaymentStatus(data) {
  const sheet = SHEETS.ORDERS;
  const values = sheet.getDataRange().getValues();
  const orderIdSet = new Set(data.orderIds.map(String));
  let updateCount = 0;

  for (let i = 1; i < values.length; i++) {
    const rowOrderId = String(values[i][1]).trim();
    if (orderIdSet.has(rowOrderId)) {
      sheet.getRange(i + 1, 9).setValue(data.newStatus);
      updateCount++;
    }
  }
  return updateCount;
}

function updateCustomer(customer) {
  const sheet = SHEETS.CUSTOMERS;
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(customer.id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][1]).trim() === String(customer.name).trim()) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  const rowData = [
    customer.id,
    customer.name,
    customer.phone,
    customer.deliveryTime,
    JSON.stringify(customer.defaultItems),
    JSON.stringify(customer.offDays || []),
    JSON.stringify(customer.holidayDates || []),
    JSON.stringify(customer.priceList || []),
    customer.deliveryMethod || "",
    customer.paymentTerm || "daily"
  ];

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, 10).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return true;
}

function updateProduct(product) {
  const sheet = SHEETS.PRODUCTS;
  
  // 修正：檢查第 5 欄標題 (E1)，如果不是 "分類" 才進行更新
  // 使用 getRange(1, 5).getValue() 取得單一儲存格的值
  if (sheet.getRange(1, 5).getValue() !== "分類") {
    // 重新設定 A1:E1 的標題
    sheet.getRange(1, 1, 1, 5).setValues([["ID", "品項", "單位", "單價", "分類"]]);
  }

  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(product.id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }
  
  // 寫入 5 個欄位：ID, Name, Unit, Price, Category
  const rowData = [
    product.id, 
    product.name, 
    product.unit, 
    product.price || 0,
    product.category || "other" // 預設分類
  ];

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, 5).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return true;
}

function reorderProducts(orderedIds) {
  const sheet = SHEETS.PRODUCTS;
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const dataRows = values.slice(1);
  
  const rowMap = new Map();
  dataRows.forEach(row => {
    const id = String(row[0]).trim();
    rowMap.set(id, row);
  });
  
  const newRows = [];
  orderedIds.forEach(id => {
    if (rowMap.has(id)) {
      newRows.push(rowMap.get(id));
      rowMap.delete(id); 
    }
  });
  
  rowMap.forEach(row => {
    newRows.push(row);
  });
  
  if (newRows.length > 0) {
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, headers.length).clearContent();
    sheet.getRange(2, 1, newRows.length, headers.length).setValues(newRows);
  }
  
  return true;
}

function deleteOrder(data) {
  const sheet = SHEETS.ORDERS;
  const values = sheet.getDataRange().getValues();
  let deleted = false;
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][1]).trim() === String(data.id).trim()) {
      sheet.deleteRow(i + 1);
      deleted = true;
    }
  }
  return deleted;
}

function deleteCustomer(data) {
  const sheet = SHEETS.CUSTOMERS;
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(data.id).trim()) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function deleteProduct(data) {
  const sheet = SHEETS.PRODUCTS;
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(data.id).trim()) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function getSheetData(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      const headerStr = String(h).trim();
      
      if (val instanceof Date) {
        if (headerStr.includes("日期") || headerStr.includes("Date")) {
           val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "yyyy-MM-dd");
        } 
        else if (headerStr.includes("建立") || headerStr.includes("Created")) {
           val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "yyyy-MM-dd HH:mm:ss");
        }
        else if (headerStr.includes("時間") || headerStr.includes("Time")) {
           val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "HH:mm");
        }
        else {
           val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "yyyy-MM-dd");
        }
      }
      
      if (typeof val === "string" && (val.trim().startsWith("[") || val.trim().startsWith("{"))) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      
      obj[headerStr] = val;
    });
    return obj;
  });
}
`;
