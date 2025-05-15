// Google Apps Script for handling referrals
const SPREADSHEET_ID = '1XhsSeeMdgw8Flk8KxDEDmziMnKLHPy9756y8fbeRmKc';
const SHEET_NAME = 'OnlyFrens Referrals';
const ALLOWED_ORIGINS = [
    'https://frensfr.vercel.app',
    'https://*.vercel.app',
    'http://localhost:3000',  // For local development
    'http://localhost:5173'   // For Vite development server
];

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
  logToSheet('Creating JSON response for origin: ' + origin);
  logToSheet('Response data: ' + JSON.stringify(data));
  
  const response = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
    
  // Always set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}

// Main GET handler
function doGet(e) {
  logToSheet('GET request received');
  logToSheet('Parameters: ' + JSON.stringify(e.parameters));
  
  try {
    const action = e.parameter.action;
    const wallet = e.parameter.wallet;
    const origin = e.parameter.origin;
    
    logToSheet('Action: ' + action);
    logToSheet('Wallet: ' + wallet);
    logToSheet('Origin: ' + origin);
    
    if (!action) {
      return createJsonResponse({ error: 'Missing action parameter' });
    }
    
    if (!wallet && (action === 'check' || action === 'stats')) {
      return createJsonResponse({ error: 'Missing wallet parameter' });
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
          });
        }
      }
      return createJsonResponse({ exists: false });
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
          });
        }
      }
      return createJsonResponse({ error: 'Wallet not found' });
    }
    
    return createJsonResponse({ error: 'Invalid action' });
  } catch (error) {
    logToSheet('Error in doGet: ' + error.toString());
    return createJsonResponse({ error: error.toString() });
  }
}

// Main POST handler
function doPost(e) {
  logToSheet('POST request received');
  logToSheet('Parameters: ' + JSON.stringify(e.parameters));
  
  try {
    if (!e.postData || !e.postData.contents) {
      logToSheet('No post data received');
      return createJsonResponse({ error: 'No data received' });
    }
    
    logToSheet('Post data: ' + e.postData.contents);
    
    const data = JSON.parse(e.postData.contents);
    const action = e.parameter.action;
    
    logToSheet('Action: ' + action);
    logToSheet('Wallet address: ' + data.walletAddress);
    
    if (action !== 'submit' || !data.walletAddress) {
      logToSheet('Invalid request data');
      return createJsonResponse({ error: 'Invalid request data' });
    }
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const existingData = sheet.getDataRange().getValues();
    const walletAddress = data.walletAddress;
    const referredBy = data.referredBy || '';
    const timestamp = new Date().toISOString();
    
    logToSheet('Processing wallet: ' + walletAddress);
    logToSheet('Referred by: ' + referredBy);
    
    // Check if wallet exists
    let referralCode = '';
    let rowIndex = -1;
    
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0] === walletAddress) {
        referralCode = existingData[i][1];
        rowIndex = i + 1;
        logToSheet('Found existing wallet with referral code: ' + referralCode);
        break;
      }
    }
    
    // If new wallet, add it
    if (!referralCode) {
      referralCode = walletAddress.substring(0, 6).toUpperCase();
      sheet.appendRow([walletAddress, referralCode, referredBy, timestamp, 0]);
      logToSheet('Added new wallet with referral code: ' + referralCode);
    } else {
      // Update timestamp for existing wallet
      sheet.getRange(rowIndex, 4).setValue(timestamp);
      logToSheet('Updated timestamp for existing wallet');
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
          logToSheet('Updated referrer bonus to: ' + bonusPercentage + '%');
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
    
    const response = {
      success: true,
      referralCode: referralCode,
      bonusPercentage: Math.min(referralCount * 10, 100),
      referralCount: referralCount
    };
    
    logToSheet('Sending response: ' + JSON.stringify(response));
    return createJsonResponse(response);
    
  } catch (error) {
    logToSheet('Error in doPost: ' + error.toString());
    return createJsonResponse({ error: error.toString() });
  }
} 