
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
  SHEETS.CUSTOMERS.getRange(1, 1, 1, 7).setValues([["ID", "客戶名稱", "電話", "配送時間", "預設品項JSON", "公休日週期JSON", "特定公休日JSON"]]);
  SHEETS.ORDERS.getRange(1, 1, 1, 9).setValues([["建立時間", "訂單ID", "客戶名", "配送日期", "配送時間", "品項", "數量", "備註", "狀態"]]);
  SHEETS.PRODUCTS.getRange(1, 1, 1, 3).setValues([["ID", "品項", "單位"]]);
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
  
  const rows = orderData.items.map(item => [
    timestamp,
    orderId,
    orderData.customerName,
    orderData.deliveryDate,
    orderData.deliveryTime,
    item.productName,
    item.quantity,
    orderData.note || "",
    "PENDING"
  ]);

  SHEETS.ORDERS.getRange(SHEETS.ORDERS.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
  return orderId;
}

function updateCustomer(customer) {
  const sheet = SHEETS.CUSTOMERS;
  const values = sheet.getDataRange().getValues(); // 獲取所有資料包含 Header
  let rowIndex = -1;

  // 1. 優先透過 ID 尋找是否存在 (Column Index 0)
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(customer.id).trim()) {
      rowIndex = i + 1; // 陣列索引轉為試算表列號 (從1開始)
      break;
    }
  }

  // 2. 如果 ID 沒找到，改透過「客戶名稱」尋找 (防止重複店名) (Column Index 1)
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
    JSON.stringify(customer.holidayDates || [])
  ];

  if (rowIndex !== -1) {
    // 找到既有資料，進行覆蓋更新
    sheet.getRange(rowIndex, 1, 1, 7).setValues([rowData]);
  } else {
    // 完全新資料，新增一行
    sheet.appendRow(rowData);
  }
  return true;
}

function updateProduct(product) {
  const sheet = SHEETS.PRODUCTS;
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;

  // ID 比對 (Column 0)
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(product.id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = [
    product.id,
    product.name,
    product.unit
  ];

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, 3).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return true;
}

function getSheetData(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      const headerStr = String(h);

      // 如果是日期對象（例如時間儲存格），轉化為字串，使用試算表的時區
      if (val instanceof Date) {
        // 1. 如果標題包含 "日期" (Date)，強制格式化為 yyyy-MM-dd
        if (headerStr.includes("日期") || headerStr.includes("Date")) {
           val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "yyyy-MM-dd");
        } 
        // 2. 如果是 "建立時間" (CreatedAt)，保留完整時間
        else if (headerStr.includes("建立") || headerStr.includes("Created")) {
           val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "yyyy-MM-dd HH:mm:ss");
        }
        // 3. 其他包含 "時間" (Time) 的欄位 (如配送時間)，只取 HH:mm
        else if (headerStr.includes("時間") || headerStr.includes("Time")) {
           val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "HH:mm");
        }
        // 4. 其他未預期的日期欄位，預設給日期
        else {
           val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "yyyy-MM-dd");
        }
      }
      
      // 嘗試解析 JSON 字串
      if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      
      obj[headerStr.trim()] = val;
    });
    return obj;
  });
}
`;
