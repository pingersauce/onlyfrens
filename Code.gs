// Google Apps Script for handling referrals
const SPREADSHEET_ID = '1XhsSeeMdgw8Flk8KxDEDmziMnKLHPy9756y8fbeRmKc';
const SHEET_NAME = 'OnlyFrens Referrals';
const ALLOWED_ORIGINS = ['https://frensfr.vercel.app', 'http://localhost:3000', 'https://frensfr.vercel.app'];

// Add logging function with more details and better error handling
function logToSheet(message, type = 'INFO') {
  // Don't throw any errors from this function, just log to console
  try {
    // First try to get the spreadsheet
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (error) {
      console.error('Failed to open spreadsheet:', error);
      return; // Exit silently if we can't access the spreadsheet
    }

    // Then try to get or create the log sheet
    let logSheet;
    try {
      logSheet = spreadsheet.getSheetByName('Logs');
      if (!logSheet) {
        try {
          logSheet = spreadsheet.insertSheet('Logs');
          // Add headers if it's a new sheet
          logSheet.appendRow(['Timestamp', 'Type', 'Message', 'Details']);
        } catch (error) {
          console.error('Failed to create log sheet:', error);
          return; // Exit silently if we can't create the log sheet
        }
      }
    } catch (error) {
      console.error('Failed to get log sheet:', error);
      return; // Exit silently if we can't access the log sheet
    }

    // Get stack trace if available
    let stackTrace = '';
    try {
      throw new Error();
    } catch (e) {
      stackTrace = e.stack || '';
    }

    // Try to append the log entry
    try {
      const timestamp = new Date().toISOString();
      const logEntry = [timestamp, type, message, stackTrace];
      
      // Use try-catch for each operation
      try {
        logSheet.appendRow(logEntry);
      } catch (error) {
        console.error('Failed to append log entry:', error);
        // Try alternative method if appendRow fails
        try {
          const lastRow = logSheet.getLastRow();
          logSheet.getRange(lastRow + 1, 1, 1, 4).setValues([logEntry]);
        } catch (error2) {
          console.error('Failed to set log entry values:', error2);
          return; // Exit silently if both methods fail
        }
      }
    } catch (error) {
      console.error('Error in log entry creation:', error);
      return; // Exit silently if we can't create the log entry
    }
  } catch (error) {
    console.error('Logging error:', error);
    // Don't throw the error, just log it to console
  }
}

// Create JSON response with CORS headers
function createJsonResponse(data, origin) {
  try {
    const response = ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
    
    // Check if origin is allowed
    const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);
    
    if (isAllowedOrigin) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    }
    
    return response;
  } catch (error) {
    console.error('Error creating JSON response:', error);
    // Return a basic error response if something goes wrong
    const errorResponse = ContentService.createTextOutput(JSON.stringify({
      error: 'Internal server error',
      details: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
    
    // Add CORS headers to error response as well
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      errorResponse.setHeader('Access-Control-Allow-Origin', origin);
      errorResponse.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      errorResponse.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    }
    
    return errorResponse;
  }
}

// Verify sheet setup with better error handling
function verifySheetSetup() {
  try {
    // First try to get the spreadsheet
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (error) {
      logToSheet('Failed to open spreadsheet: ' + error.toString(), 'ERROR');
      throw new Error('Cannot access spreadsheet. Please check permissions.');
    }

    // Then try to get the sheet
    let sheet;
    try {
      sheet = spreadsheet.getSheetByName(SHEET_NAME);
      if (!sheet) {
        throw new Error(`Sheet "${SHEET_NAME}" not found`);
      }
    } catch (error) {
      logToSheet('Failed to get sheet: ' + error.toString(), 'ERROR');
      throw error;
    }

    // Try to get headers
    let headers;
    try {
      headers = sheet.getRange(1, 1, 1, 5).getValues()[0];
    } catch (error) {
      logToSheet('Failed to get headers: ' + error.toString(), 'ERROR');
      throw new Error('Cannot read sheet headers. Please check permissions.');
    }

    const requiredHeaders = ['Wallet Address', 'Referral Code', 'Referred By', 'Timestamp', 'Bonus Percentage'];
    
    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        const error = `Missing required header: ${header}`;
        logToSheet(error, 'ERROR');
        throw new Error(error);
      }
    }
    
    return true;
  } catch (error) {
    logToSheet('Sheet setup verification failed: ' + error.toString(), 'ERROR');
    throw error;
  }
}

// Main entry points for web app
function doGet(e) {
  const origin = e.parameter.origin || '';
  logToSheet('GET request received: ' + JSON.stringify(e.parameters), 'REQUEST');
  
  try {
    // Verify sheet setup first
    verifySheetSetup();
    
    const action = e.parameter.action;
    const wallet = e.parameter.wallet;
    
    if (!action) {
      throw new Error('Missing action parameter');
    }
    
    if (!wallet && (action === 'check' || action === 'stats')) {
      throw new Error('Missing wallet parameter');
    }
    
    let response;
    if (action === 'check') {
      logToSheet(`Processing check request for wallet: ${wallet}`, 'INFO');
      response = handleCheck(e);
    } else if (action === 'stats') {
      logToSheet(`Processing stats request for wallet: ${wallet}`, 'INFO');
      response = handleStats(e);
    } else {
      throw new Error('Invalid action: ' + action);
    }
    
    return createJsonResponse(response, origin);
  } catch (error) {
    logToSheet('Error in doGet: ' + error.toString(), 'ERROR');
    return createJsonResponse({ 
      error: error.toString(),
      parameters: e.parameters 
    }, origin);
  }
}

function doPost(e) {
  const origin = e.postData?.contents ? JSON.parse(e.postData.contents).origin : '';
  logToSheet('POST request received: ' + e.postData.contents, 'REQUEST');
  
  try {
    // Verify sheet setup first
    verifySheetSetup();
    
    if (!e.postData || !e.postData.contents) {
      throw new Error('No data received in POST request');
    }
    
    const data = JSON.parse(e.postData.contents);
    logToSheet('Parsed POST data: ' + JSON.stringify(data), 'INFO');
    
    if (!data.action) {
      throw new Error('Missing action in POST data');
    }
    
    let response;
    if (data.action === 'submit') {
      if (!data.walletAddress) {
        throw new Error('Missing walletAddress in submit action');
      }
      logToSheet(`Processing submit request for wallet: ${data.walletAddress}`, 'INFO');
      response = handleSubmit(data);
    } else {
      throw new Error('Invalid action: ' + data.action);
    }
    
    return createJsonResponse(response, origin);
  } catch (error) {
    logToSheet('Error in doPost: ' + error.toString(), 'ERROR');
    return createJsonResponse({ 
      error: error.toString(),
      receivedData: e.postData ? e.postData.contents : 'No data'
    }, origin);
  }
}

// Handle OPTIONS request for CORS
function doOptions(e) {
  const origin = e.parameter.origin || (e.postData?.contents ? JSON.parse(e.postData.contents).origin : '');
  
  // Create response with CORS headers
  const response = ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
  
  // Check if origin is allowed
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);
  
  if (isAllowedOrigin) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    response.setHeader('Access-Control-Max-Age', '3600');
  }
  
  return response;
}

// Handler functions
function handleCheck(e) {
  try {
    const wallet = e.parameter.wallet;
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === wallet) {
        return {
          exists: true,
          referralCode: data[i][1],
          bonusPercentage: calculateBonus(data[i][0]),
          referralCount: countReferrals(data[i][1])
        };
      }
    }
    
    return { exists: false };
  } catch (error) {
    logToSheet('Error in handleCheck: ' + error.toString(), 'ERROR');
    throw error;
  }
}

function handleStats(e) {
  try {
    const wallet = e.parameter.wallet;
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === wallet) {
        const referralCode = data[i][1];
        const bonusPercentage = calculateBonus(wallet);
        const referralCount = countReferrals(referralCode);
        
        return {
          referralCode: referralCode,
          bonusPercentage: bonusPercentage,
          referralCount: referralCount
        };
      }
    }
    
    return { error: 'Wallet not found' };
  } catch (error) {
    logToSheet('Error in handleStats: ' + error.toString(), 'ERROR');
    throw error;
  }
}

function handleSubmit(data) {
  try {
    logToSheet('Starting handleSubmit for wallet: ' + data.walletAddress, 'INFO');
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    // Verify sheet headers
    const headers = sheet.getRange(1, 1, 1, 5).getValues()[0];
    logToSheet('Sheet headers: ' + JSON.stringify(headers), 'INFO');
    
    if (!headers.includes('Wallet Address') || !headers.includes('Referral Code')) {
      throw new Error('Required headers not found in sheet');
    }
    
    const walletAddress = data.walletAddress;
    const referredBy = data.referredBy;
    const timestamp = data.timestamp;
    
    logToSheet(`Processing wallet: ${walletAddress}, referred by: ${referredBy}`, 'INFO');
    
    // Check if wallet already exists
    const existingData = sheet.getDataRange().getValues();
    let referralCode = '';
    let rowIndex = -1;
    
    // Skip header row
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0] === walletAddress) {
        referralCode = existingData[i][1];
        rowIndex = i + 1;
        logToSheet(`Found existing wallet at row: ${rowIndex}`, 'INFO');
        break;
      }
    }
    
    // If wallet doesn't exist, generate new referral code
    if (!referralCode) {
      referralCode = generateReferralCode(walletAddress);
      rowIndex = sheet.getLastRow() + 1;
      
      logToSheet(`Adding new wallet with referral code: ${referralCode}`, 'INFO');
      
      try {
        // Add new row
        sheet.appendRow([
          walletAddress,
          referralCode,
          referredBy || '',
          timestamp,
          0 // Initial bonus percentage
        ]);
        
        logToSheet('Successfully added new wallet', 'SUCCESS');
      } catch (error) {
        logToSheet('Error adding new row: ' + error.toString(), 'ERROR');
        throw error;
      }
    } else {
      // Update existing row with new timestamp
      try {
        sheet.getRange(rowIndex, 4).setValue(timestamp);
        logToSheet('Updated timestamp for existing wallet', 'INFO');
      } catch (error) {
        logToSheet('Error updating timestamp: ' + error.toString(), 'ERROR');
        throw error;
      }
    }
    
    // If user was referred, update referrer's bonus
    if (referredBy) {
      logToSheet('Updating referrer bonus for: ' + referredBy, 'INFO');
      try {
        updateReferrerBonus(referredBy);
      } catch (error) {
        logToSheet('Error updating referrer bonus: ' + error.toString(), 'ERROR');
        // Don't throw here, as the main operation succeeded
      }
    }
    
    return {
      success: true,
      referralCode: referralCode,
      bonusPercentage: calculateBonus(walletAddress),
      referralCount: countReferrals(referralCode)
    };
  } catch (error) {
    logToSheet('Error in handleSubmit: ' + error.toString(), 'ERROR');
    throw error;
  }
}

// Utility functions
function generateReferralCode(walletAddress) {
  return walletAddress.substring(0, 6).toUpperCase();
}

function calculateBonus(walletAddress) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    let referralCount = 0;
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === walletAddress) { // Column C contains referredBy
        referralCount++;
      }
    }
    
    // 10% bonus per referral, capped at 100%
    return Math.min(referralCount * 10, 100);
  } catch (error) {
    logToSheet('Error in calculateBonus: ' + error.toString(), 'ERROR');
    return 0; // Return 0 if there's an error
  }
}

function countReferrals(referralCode) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    let count = 0;
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === referralCode) { // Column C contains referredBy
        count++;
      }
    }
    
    return count;
  } catch (error) {
    logToSheet('Error in countReferrals: ' + error.toString(), 'ERROR');
    return 0; // Return 0 if there's an error
  }
}

function updateReferrerBonus(referralCode) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === referralCode) { // Column B contains referral codes
        const bonusPercentage = calculateBonus(data[i][0]); // Column A contains wallet addresses
        sheet.getRange(i + 1, 5).setValue(bonusPercentage); // Column E stores bonus percentage
        break;
      }
    }
  } catch (error) {
    logToSheet('Error in updateReferrerBonus: ' + error.toString(), 'ERROR');
    throw error;
  }
} 