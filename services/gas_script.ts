// @ts-nocheck

const SS = SpreadsheetApp.getActiveSpreadsheet();
const SHEETS = {
  ORDERS: SS.getSheetByName("Orders"),
  CUSTOMERS: SS.getSheetByName("Customers"),
  PRODUCTS: SS.getSheetByName("Products"),
  CONFIG: SS.getSheetByName("Config")
};

function doGet(e) {
  const startDateStr = e.parameter.startDate;
  const data = getData(startDateStr);
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    let result = null;

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
      case "updateOrderContent":
        result = updateOrderContent(params.data);
        break;
      case "updateOrderStatus":
        result = updateOrderStatus(params.data);
        break;
      case "batchUpdatePaymentStatus":
        result = batchUpdatePaymentStatus(params.data);
        break;
      case "deleteOrder":
        result = deleteOrder(params.data);
        break;
      case "reorderProducts":
        result = reorderProducts(params.data);
        break;
      case "updateCustomer":
        result = updateCustomer(params.data);
        break;
      case "deleteCustomer":
        result = deleteCustomer(params.data);
        break;
      case "updateProduct":
        result = updateProduct(params.data);
        break;
      case "deleteProduct":
        result = deleteProduct(params.data);
        break;
      default:
        throw new Error("Unknown action: " + action);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- Logic Functions ---

function login(data) {
  const sheet = SHEETS.CONFIG;
  if (!sheet) return data.password === "8888"; 
  const password = sheet.getRange("B1").getValue();
  return String(data.password) === String(password);
}

function changePassword(data) {
  const sheet = SHEETS.CONFIG;
  if (!sheet) throw new Error("Config sheet missing");
  const currentPwd = sheet.getRange("B1").getValue();
  
  if (String(data.oldPassword) !== String(currentPwd)) {
    return false;
  }
  
  sheet.getRange("B1").setValue(data.newPassword);
  return true;
}

function getData(startDateStr) {
  // Helpers to get data as array of objects
  const getSheetData = (sheet) => {
    if (!sheet) return [];
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return []; // Only header or empty
    
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const data = [];
    for (let i = 1; i < values.length; i++) {
      let obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = values[i][j];
      }
      data.push(obj);
    }
    return data;
  };

  const customers = getSheetData(SHEETS.CUSTOMERS).map(c => ({
    id: c.ID || c.id,
    name: c.Name || c.name || c.客戶名稱,
    phone: c.Phone || c.phone || c.電話,
    deliveryTime: c.DeliveryTime || c.deliveryTime || c.配送時間,
    // Add exact Chinese headers from user prompt to ensure reading works
    defaultItems: c.DefaultItems || c.defaultItems || c.預設品項JSON || c.預設品項, 
    priceList: c.PriceList || c.priceList || c.價目表JSON || c.價目表,
    offDays: c.OffDays || c.offDays || c.公休日週期JSON || c.公休日週期,
    holidayDates: c.HolidayDates || c.holidayDates || c.特定公休日JSON || c.特定公休日,
    deliveryMethod: c.DeliveryMethod || c.deliveryMethod || c.配送方式,
    paymentTerm: c.PaymentTerm || c.paymentTerm || c.付款週期
  }));

  const products = getSheetData(SHEETS.PRODUCTS).map(p => ({
    id: p.ID || p.id,
    name: p.Name || p.name || p.品項,
    unit: p.Unit || p.unit || p.單位,
    price: p.Price || p.price || p.單價,
    category: p.Category || p.category || p.分類
  }));

  const ordersRaw = getSheetData(SHEETS.ORDERS);
  let orders = ordersRaw.map(o => ({
    id: o.ID || o.id || o["Order ID"] || o.訂單ID,
    createdAt: o.CreatedAt || o.createdAt || o.建立時間,
    customerName: o.CustomerName || o.customerName || o.客戶名,
    deliveryDate: o.DeliveryDate || o.deliveryDate || o.配送日期,
    deliveryTime: o.DeliveryTime || o.deliveryTime || o.配送時間,
    productName: o.ProductName || o.productName || o.品項,
    quantity: o.Quantity || o.quantity || o.數量,
    unit: o.Unit || o.unit || o.單位,
    note: o.Note || o.note || o.備註,
    status: o.Status || o.status || o.狀態,
    deliveryMethod: o.DeliveryMethod || o.deliveryMethod || o.配送方式
  }));

  if (startDateStr) {
    const start = new Date(startDateStr);
    orders = orders.filter(o => new Date(o.deliveryDate) >= start);
  }

  return { customers, products, orders };
}

function createOrder(orderData) {
  const sheet = SHEETS.ORDERS;
  
  // Ensure we have enough columns (11)
  if (sheet.getMaxColumns() < 11) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 11 - sheet.getMaxColumns());
  }

  const timestamp = Utilities.formatDate(new Date(), SS.getSpreadsheetTimeZone(), "yyyy/MM/dd HH:mm:ss");
  
  // Schema based on User's Orders Sheet:
  // 1.建立時間, 2.訂單ID, 3.客戶名, 4.配送日期, 5.配送時間, 6.品項, 7.數量, 8.備註, 9.狀態, 10.配送方式, 11.單位
  const rows = orderData.items.map(item => [
    timestamp,
    orderData.id,
    orderData.customerName,
    orderData.deliveryDate,
    orderData.deliveryTime,
    item.productName || item.productId,
    item.quantity,
    orderData.note || "",
    orderData.status || "PENDING",
    orderData.deliveryMethod || "",
    item.unit || "斤" 
  ]);
  
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 11).setValues(rows);
  }
  return true;
}

function updateOrderContent(orderData) {
  const sheet = SHEETS.ORDERS;
  const values = sheet.getDataRange().getValues();
  
  Logger.log("UpdateOrderContent called for ID: " + orderData.id);
  
  const targetId = String(orderData.id).trim();
  let originalCreatedAt = "";
  let deletedCount = 0;
  
  // Remove old rows backwards
  for (let i = values.length - 1; i >= 1; i--) {
    const sheetId = String(values[i][1]).trim();
    
    if (sheetId === targetId) {
      if (!originalCreatedAt) originalCreatedAt = values[i][0];
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }
  
  Logger.log("Deleted " + deletedCount + " old rows.");

  // Check column width again
  if (sheet.getMaxColumns() < 11) {
     sheet.insertColumnsAfter(sheet.getMaxColumns(), 11 - sheet.getMaxColumns());
  }

  const timestamp = originalCreatedAt || Utilities.formatDate(new Date(), SS.getSpreadsheetTimeZone(), "yyyy/MM/dd HH:mm:ss");
  
  const rows = orderData.items.map(item => [
    timestamp,
    orderData.id,
    orderData.customerName,
    orderData.deliveryDate,
    orderData.deliveryTime,
    item.productName || item.productId,
    item.quantity,
    orderData.note || "",
    orderData.status || "PENDING",
    orderData.deliveryMethod || "",
    item.unit || "斤"
  ]);

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 11).setValues(rows);
    Logger.log("Appended " + rows.length + " new rows.");
  } else {
    Logger.log("Warning: No items to append for order " + targetId);
  }
  
  return true;
}

function updateOrderStatus(data) {
  const sheet = SHEETS.ORDERS;
  const values = sheet.getDataRange().getValues();
  let updated = false;
  const targetId = String(data.id).trim();
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]).trim() === targetId) {
      sheet.getRange(i + 1, 9).setValue(data.status); // Column 9 is Status
      updated = true;
    }
  }
  
  if (!updated) throw new Error("Order not found: " + targetId);
  return true;
}

function batchUpdatePaymentStatus(data) {
  const sheet = SHEETS.ORDERS;
  const values = sheet.getDataRange().getValues();
  const orderIds = new Set(data.orderIds.map(id => String(id).trim()));
  
  for (let i = 1; i < values.length; i++) {
    const id = String(values[i][1]).trim();
    if (orderIds.has(id)) {
      sheet.getRange(i + 1, 9).setValue(data.newStatus);
    }
  }
  return true;
}

function deleteOrder(data) {
  const sheet = SHEETS.ORDERS;
  const values = sheet.getDataRange().getValues();
  const targetId = String(data.id).trim();
  
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][1]).trim() === targetId) {
      sheet.deleteRow(i + 1);
    }
  }
  return true;
}

function reorderProducts(orderedIds) {
  const sheet = SHEETS.PRODUCTS;
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return true;

  const headers = values[0];
  const rows = values.slice(1);
  
  const map = new Map();
  rows.forEach(r => map.set(String(r[0]), r));
  
  const newRows = [];
  orderedIds.forEach(id => {
    if (map.has(String(id))) {
      newRows.push(map.get(String(id)));
      map.delete(String(id));
    }
  });
  
  map.forEach(r => newRows.push(r));
  
  sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  sheet.getRange(2, 1, newRows.length, newRows[0].length).setValues(newRows);
  
  return true;
}

function updateCustomer(data) {
  const sheet = SHEETS.CUSTOMERS;
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;
  const targetId = String(data.id).trim();
  
  // Find existing by ID (Column 0 / A Column)
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === targetId) {
      rowIndex = i + 1;
      break;
    }
  }
  
  // FIXED Schema based on User's Customers Sheet:
  // 1.ID, 2.客戶名稱, 3.電話, 4.配送時間, 5.預設品項, 6.公休日週期, 7.特定公休日, 8.價目表, 9.配送方式, 10.付款週期
  const rowData = [
    data.id,                              // 1. ID
    data.name,                            // 2. 客戶名稱
    data.phone,                           // 3. 電話
    data.deliveryTime,                    // 4. 配送時間
    JSON.stringify(data.defaultItems),    // 5. 預設品項 (JSON)
    JSON.stringify(data.offDays),         // 6. 公休日週期 (JSON)
    JSON.stringify(data.holidayDates),    // 7. 特定公休日 (JSON)
    JSON.stringify(data.priceList),       // 8. 價目表 (JSON)
    data.deliveryMethod,                  // 9. 配送方式
    data.paymentTerm                      // 10. 付款週期
  ];
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return true;
}

function deleteCustomer(data) {
  const sheet = SHEETS.CUSTOMERS;
  const values = sheet.getDataRange().getValues();
  const targetId = String(data.id).trim();
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === targetId) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function updateProduct(data) {
  const sheet = SHEETS.PRODUCTS;
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;
  const targetId = String(data.id).trim();
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === targetId) {
      rowIndex = i + 1;
      break;
    }
  }
  
  // Schema: ID, Name, Unit, Price, Category
  const rowData = [
    data.id,
    data.name,
    data.unit,
    data.price,
    data.category
  ];
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return true;
}

function deleteProduct(data) {
  const sheet = SHEETS.PRODUCTS;
  const values = sheet.getDataRange().getValues();
  const targetId = String(data.id).trim();
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === targetId) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}