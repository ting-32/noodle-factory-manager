
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
  PRODUCTS: SS.getSheetByName("Products") || SS.insertSheet("Products")
};

// 初始化表格結構
function setup() {
  // 更新：增加第9欄 "配送方式"
  // 設定 Header
  SHEETS.CUSTOMERS.getRange(1, 1, 1, 9).setValues([["ID", "客戶名稱", "電話", "配送時間", "預設品項JSON", "公休日週期JSON", "特定公休日JSON", "價目表JSON", "配送方式"]]);
  // 設定 JSON 欄位為純文字格式，避免 Google Sheets 自動格式化導致讀取錯誤
  SHEETS.CUSTOMERS.getRange(2, 5, SHEETS.CUSTOMERS.getMaxRows() - 1, 4).setNumberFormat("@");
  
  // 更新：Orders 增加第10欄 "配送方式"
  SHEETS.ORDERS.getRange(1, 1, 1, 10).setValues([["建立時間", "訂單ID", "客戶名", "配送日期", "配送時間", "品項", "數量", "備註", "狀態", "配送方式"]]);
  
  // 更新：Products 增加第4欄 "單價"
  SHEETS.PRODUCTS.getRange(1, 1, 1, 4).setValues([["ID", "品項", "單位", "單價"]]);
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    let result;

    switch (action) {
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
      case "updateOrderStatus": // 新增狀態更新
        result = updateOrderStatus(params.data);
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

function createOrder(orderData) {
  const timestamp = Utilities.formatDate(new Date(), SS.getSpreadsheetTimeZone(), "yyyy/MM/dd HH:mm:ss");
  const orderId = orderData.id || ("ORD-" + Date.now());
  
  // 自動修復：檢查 Orders 表頭 (Row 1, Col 10) 是否為 "配送方式"，若否則補上
  const headerRange = SHEETS.ORDERS.getRange(1, 10);
  if (headerRange.getValue() !== "配送方式") {
    headerRange.setValue("配送方式");
  }

  const rows = orderData.items.map(item => {
    // 修改：只保留品項名稱，不加入單位
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
      orderData.status || "PENDING", // 確保寫入狀態
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
  
  // 從第2行開始遍歷 (跳過表頭)
  for (let i = 1; i < values.length; i++) {
    // 第2欄是訂單ID (Index 1)
    if (String(values[i][1]).trim() === String(data.id).trim()) {
      // 第9欄是狀態 (Index 8)
      sheet.getRange(i + 1, 9).setValue(data.status);
      updated = true;
      // 這裡不 break，因為同一張訂單可能會有多個品項佔用多行，全部都要更新狀態
    }
  }
  
  if (!updated) throw new Error("Order not found");
  return true;
}

function updateCustomer(customer) {
  const sheet = SHEETS.CUSTOMERS;
  
  // 自動修復：檢查 Customers 表頭
  const headerRange = sheet.getRange(1, 9);
  if (headerRange.getValue() !== "配送方式") {
    headerRange.setValue("配送方式");
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
    customer.deliveryMethod || ""
  ];

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, 9).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return true;
}

function updateProduct(product) {
  const sheet = SHEETS.PRODUCTS;
  
  // 自動修復：Products 增加第4欄 "單價"
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