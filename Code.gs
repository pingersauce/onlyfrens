// Google Apps Script for handling referrals
const SPREADSHEET_ID = '1-92t8fsEOpGVTgOUGFy-hjgcSUecuZKvRkWwu8tgvtw'; // Your spreadsheet ID
const SHEET_NAME = 'frens';

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'check') {
    return handleCheck(e);
  } else if (action === 'stats') {
    return handleStats(e);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  if (action === 'submit') {
    return handleSubmit(data);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleCheck(e) {
  const wallet = e.parameter.wallet;
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === wallet) {
      return ContentService.createTextOutput(JSON.stringify({
        exists: true,
        referralCode: data[i][1], // Assuming column B contains referral codes
        bonusPercentage: calculateBonus(data[i][0]),
        referralCount: countReferrals(data[i][1])
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    exists: false
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleStats(e) {
  const wallet = e.parameter.wallet;
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === wallet) {
      const referralCode = data[i][1];
      const bonusPercentage = calculateBonus(wallet);
      const referralCount = countReferrals(referralCode);
      
      return ContentService.createTextOutput(JSON.stringify({
        referralCode: referralCode,
        bonusPercentage: bonusPercentage,
        referralCount: referralCount
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    error: 'Wallet not found'
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleSubmit(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const walletAddress = data.walletAddress;
  const referredBy = data.referredBy;
  const timestamp = data.timestamp;
  
  // Check if wallet already exists
  const existingData = sheet.getDataRange().getValues();
  let referralCode = '';
  let rowIndex = -1;
  
  // Skip header row
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0] === walletAddress) {
      referralCode = existingData[i][1];
      rowIndex = i + 1;
      break;
    }
  }
  
  // If wallet doesn't exist, generate new referral code
  if (!referralCode) {
    referralCode = generateReferralCode(walletAddress);
    rowIndex = sheet.getLastRow() + 1;
    
    // Add new row
    sheet.appendRow([
      walletAddress,
      referralCode,
      referredBy,
      timestamp,
      0 // Initial bonus percentage
    ]);
  } else {
    // Update existing row with new timestamp
    sheet.getRange(rowIndex, 4).setValue(timestamp);
  }
  
  // If user was referred, update referrer's bonus
  if (referredBy) {
    updateReferrerBonus(referredBy);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    referralCode: referralCode,
    bonusPercentage: calculateBonus(walletAddress),
    referralCount: countReferrals(referralCode)
  })).setMimeType(ContentService.MimeType.JSON);
}

function generateReferralCode(walletAddress) {
  // Use first 6 characters of wallet address as referral code
  return walletAddress.substring(0, 6).toUpperCase();
}

function calculateBonus(walletAddress) {
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
}

function countReferrals(referralCode) {
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
}

function updateReferrerBonus(referralCode) {
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
} 