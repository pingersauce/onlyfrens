// Vercel Serverless Function for handling wallet submissions
import { google } from 'googleapis';

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    // We'll add these credentials later
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'OnlyFrens Referrals';

// Helper function to log to console (Vercel will capture these)
function log(message, data = null) {
  console.log(`[${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data) : '');
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, referredBy } = req.body;

    // Validate input
    if (!walletAddress) {
      log('Missing wallet address');
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    log('Processing wallet submission', { walletAddress, referredBy });

    // Get existing data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:E`,
    });

    const rows = response.data.values || [];
    const timestamp = new Date().toISOString();

    // Check if wallet exists
    let existingRow = -1;
    let referralCode = '';

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === walletAddress) {
        existingRow = i;
        referralCode = rows[i][1];
        log('Found existing wallet', { walletAddress, referralCode });
        break;
      }
    }

    if (existingRow === -1) {
      // New wallet - generate referral code
      referralCode = walletAddress.substring(0, 6).toUpperCase();
      
      // Add new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:E`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[walletAddress, referralCode, referredBy || '', timestamp, 0]],
        },
      });

      log('Added new wallet', { walletAddress, referralCode });
    } else {
      // Update timestamp for existing wallet
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!D${existingRow + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[timestamp]],
        },
      });

      log('Updated timestamp for existing wallet', { walletAddress });
    }

    // If referred, update referrer's bonus
    if (referredBy) {
      let referrerRow = -1;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === referredBy) {
          referrerRow = i;
          break;
        }
      }

      if (referrerRow !== -1) {
        // Count referrals
        let referralCount = 0;
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][2] === referredBy) {
            referralCount++;
          }
        }

        // Calculate bonus (10% per referral, max 100%)
        const bonusPercentage = Math.min(referralCount * 10, 100);

        // Update bonus
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!E${referrerRow + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[bonusPercentage]],
          },
        });

        log('Updated referrer bonus', { referredBy, bonusPercentage });
      }
    }

    // Count referrals for response
    let referralCount = 0;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][2] === referralCode) {
        referralCount++;
      }
    }

    const bonusPercentage = Math.min(referralCount * 10, 100);

    // Send success response
    return res.status(200).json({
      status: 'success',
      message: 'Wallet submitted successfully',
      data: {
        referralCode,
        bonusPercentage,
        referralCount,
      },
    });

  } catch (error) {
    log('Error processing submission', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process submission',
      error: error.message,
    });
  }
} 