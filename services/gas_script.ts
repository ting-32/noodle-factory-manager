
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
  // 新增欄位: 付款週期 (第 10 欄)
  SHEETS.CUSTOMERS.getRange(1, 1, 1, 10).setValues([["ID", "客戶名稱", "電話", "配送時間", "預設品項JSON", "公休日週期JSON", "特定公休日JSON", "價目表JSON", "配送方式", "付款週期"]]);
  // 設定 JSON 欄位為純文字格式，避免 Google Sheets 自動格式化導致讀取錯誤
  SHEETS.CUSTOMERS.getRange(2, 5, SHEETS.CUSTOMERS.getMaxRows() - 1, 4).setNumberFormat("@");
  
  SHEETS.ORDERS.getRange(1, 1, 1, 10).setValues([["建立時間", "訂單ID", "客戶名", "配送日期", "配送時間", "品項", "數量", "備註", "狀態", "配送方式"]]);
  
  SHEETS.PRODUCTS.getRange(1, 1, 1, 4).setValues([["ID", "品項", "單位", "單價"]]);

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
      case "login": // 新增：後端登入驗證
        result = login(params.data);
        break;
      case "changePassword": // 新增：後端更改密碼
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
      case "reorderProducts": // 新增：產品排序
        result = reorderProducts(params.data);
        break;
      case "batchUpdatePaymentStatus": // 新增：批次付款更新
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
    let data;

    if (type === "init") {
      data = {
        customers: getSheetData(SHEETS.CUSTOMERS),
        products: getSheetData(SHEETS.PRODUCTS),
        orders: getSheetData(SHEETS.ORDERS)
      };
    } else if (type === "orders") {
      data = getSheetData(SHEETS.ORDERS);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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
  // data: { customerName: string, orderIds: string[], newStatus: 'PAID' }
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
  
  const headerRange = sheet.getRange(1, 10);
  if (headerRange.getValue() !== "付款週期") {
    headerRange.setValue("付款週期");
  }

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
  
  const headerRange = sheet.getRange(1, 4);
  if (headerRange.getValue() !== "單價") {
    headerRange.setValue("單價");
  }

  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(product.id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = [product.id, product.name, product.unit, product.price || 0];

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, 4).setValues([rowData]);
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
  
  // 建立 ID 到 RowData 的 Map
  const rowMap = new Map();
  dataRows.forEach(row => {
    const id = String(row[0]).trim();
    rowMap.set(id, row);
  });
  
  // 根據 orderedIds 重建新的 rows 陣列
  const newRows = [];
  orderedIds.forEach(id => {
    if (rowMap.has(id)) {
      newRows.push(rowMap.get(id));
      rowMap.delete(id); // 移除已處理的
    }
  });
  
  // 將剩餘未在 orderedIds 中的項目 (防呆) 加到最後
  rowMap.forEach(row => {
    newRows.push(row);
  });
  
  // 清空舊資料並寫入新排序資料
  // 注意：我們保留 Header (Row 1)
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
      
      // Robust JSON parsing: attempts to parse if it looks like a JSON array or object
      if (typeof val === "string" && (val.trim().startsWith("[") || val.trim().startsWith("{"))) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      
      obj[headerStr] = val;
    });
    return obj;
  });
}
`;
