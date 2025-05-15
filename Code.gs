// Google Apps Script for handling referrals
const SPREADSHEET_ID = '1XhsSeeMdgw8Flk8KxDEDmziMnKLHPy9756y8fbeRmKc';
const SHEET_NAME = 'OnlyFrens Referrals';
const ALLOWED_ORIGINS = ['https://frensfr.vercel.app', 'https://*.vercel.app'];

// Simple logging function
function logToSheet(message) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = spreadsheet.getSheetByName('Logs');
    if (!logSheet) {
      logSheet = spreadsheet.insertSheet('Logs');
      logSheet.appendRow(['Timestamp', 'Message']);
    }
    logSheet.appendRow([new Date().toISOString(), message]);
  } catch (error) {
    console.error('Logging error:', error);
  }
}

// Create JSON response with CORS headers
function createJsonResponse(data, origin = null) {
  const response = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
    
  if (origin) {
    // Check if origin is allowed
    const isAllowed = ALLOWED_ORIGINS.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = new RegExp('^' + allowed.replace('*', '.*') + '$');
        return pattern.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    }
  }
  
  return response;
}

// Handle OPTIONS request for CORS
function doOptions(e) {
  const origin = e.parameter.origin;
  const response = ContentService.createTextOutput('');
  
  if (origin) {
    // Check if origin is allowed
    const isAllowed = ALLOWED_ORIGINS.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = new RegExp('^' + allowed.replace('*', '.*') + '$');
        return pattern.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
      response.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
    }
  }
  
  return response;
}

// Main GET handler
function doGet(e) {
  logToSheet('GET request: ' + JSON.stringify(e.parameters));
  
  try {
    const action = e.parameter.action;
    const wallet = e.parameter.wallet;
    const origin = e.parameter.origin;
    
    if (!action) {
      return createJsonResponse({ error: 'Missing action parameter' }, origin);
    }
    
    if (!wallet && (action === 'check' || action === 'stats')) {
      return createJsonResponse({ error: 'Missing wallet parameter' }, origin);
    }
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    if (action === 'check') {
      // Find wallet in sheet
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === wallet) {
          return createJsonResponse({
            exists: true,
            referralCode: data[i][1],
            bonusPercentage: data[i][4] || 0
          }, origin);
        }
      }
      return createJsonResponse({ exists: false }, origin);
    }
    
    if (action === 'stats') {
      // Find wallet in sheet
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === wallet) {
          const referralCode = data[i][1];
          let referralCount = 0;
          
          // Count referrals
          for (let j = 1; j < data.length; j++) {
            if (data[j][2] === referralCode) {
              referralCount++;
            }
          }
          
          return createJsonResponse({
            referralCode: referralCode,
            bonusPercentage: data[i][4] || 0,
            referralCount: referralCount
          }, origin);
        }
      }
      return createJsonResponse({ error: 'Wallet not found' }, origin);
    }
    
    return createJsonResponse({ error: 'Invalid action' }, origin);
  } catch (error) {
    logToSheet('Error in doGet: ' + error.toString());
    return createJsonResponse({ error: error.toString() }, e.parameter.origin);
  }
}

// Main POST handler
function doPost(e) {
  logToSheet('POST request: ' + e.postData.contents);
  
  try {
    if (!e.postData || !e.postData.contents) {
      return createJsonResponse({ error: 'No data received' }, e.parameter.origin);
    }
    
    const data = JSON.parse(e.postData.contents);
    const origin = data.origin;
    
    if (!data.action || data.action !== 'submit' || !data.walletAddress) {
      return createJsonResponse({ error: 'Invalid request data' }, origin);
    }
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const existingData = sheet.getDataRange().getValues();
    const walletAddress = data.walletAddress;
    const referredBy = data.referredBy || '';
    const timestamp = new Date().toISOString();
    
    // Check if wallet exists
    let referralCode = '';
    let rowIndex = -1;
    
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0] === walletAddress) {
        referralCode = existingData[i][1];
        rowIndex = i + 1;
        break;
      }
    }
    
    // If new wallet, add it
    if (!referralCode) {
      referralCode = walletAddress.substring(0, 6).toUpperCase();
      sheet.appendRow([walletAddress, referralCode, referredBy, timestamp, 0]);
    } else {
      // Update timestamp for existing wallet
      sheet.getRange(rowIndex, 4).setValue(timestamp);
    }
    
    // If referred, update referrer's bonus
    if (referredBy) {
      for (let i = 1; i < existingData.length; i++) {
        if (existingData[i][1] === referredBy) {
          let referralCount = 0;
          for (let j = 1; j < existingData.length; j++) {
            if (existingData[j][2] === referredBy) {
              referralCount++;
            }
          }
          const bonusPercentage = Math.min(referralCount * 10, 100);
          sheet.getRange(i + 1, 5).setValue(bonusPercentage);
          break;
        }
      }
    }
    
    // Count referrals for response
    let referralCount = 0;
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][2] === referralCode) {
        referralCount++;
      }
    }
    
    return createJsonResponse({
      success: true,
      referralCode: referralCode,
      bonusPercentage: Math.min(referralCount * 10, 100),
      referralCount: referralCount
    }, origin);
    
  } catch (error) {
    logToSheet('Error in doPost: ' + error.toString());
    return createJsonResponse({ error: error.toString() }, e.parameter.origin);
  }
} 