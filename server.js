const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Data file path - use /tmp in Vercel for writable storage
const DATA_FILE = process.env.NODE_ENV === 'production' 
  ? '/tmp/data.json'
  : path.join(__dirname, 'data.json');

// Helper function to log
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : '');
}

// Helper function to read/write data
async function getData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create it with empty data
    if (error.code === 'ENOENT') {
      const initialData = {
        wallets: [],
        lastUpdated: new Date().toISOString()
      };
      await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    throw error;
  }
}

async function saveData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Submit wallet endpoint
app.post('/api/submit-wallet', async (req, res) => {
  try {
    const { walletAddress, referredBy } = req.body;

    // Validate input
    if (!walletAddress) {
      log('Missing wallet address');
      return res.status(400).json({ 
        status: 'error',
        message: 'Wallet address is required' 
      });
    }

    log('Processing wallet submission', { walletAddress, referredBy });

    // Get existing data
    const data = await getData();
    const timestamp = new Date().toISOString();

    // Check if wallet exists
    let wallet = data.wallets.find(w => w.address === walletAddress);
    let referralCode = '';

    if (!wallet) {
      // New wallet - generate referral code
      referralCode = walletAddress.substring(0, 6).toUpperCase();
      
      // Add new wallet
      wallet = {
        address: walletAddress,
        referralCode,
        referredBy: referredBy || '',
        timestamp,
        bonusPercentage: 0
      };
      
      data.wallets.push(wallet);
      log('Added new wallet', { walletAddress, referralCode });
    } else {
      // Update timestamp for existing wallet
      wallet.timestamp = timestamp;
      referralCode = wallet.referralCode;
      log('Updated timestamp for existing wallet', { walletAddress });
    }

    // If referred, update referrer's bonus
    if (referredBy) {
      const referrer = data.wallets.find(w => w.referralCode === referredBy);
      if (referrer) {
        // Count referrals
        const referralCount = data.wallets.filter(w => w.referredBy === referredBy).length;
        
        // Calculate bonus (10% per referral, max 100%)
        referrer.bonusPercentage = Math.min(referralCount * 10, 100);
        log('Updated referrer bonus', { referredBy, bonusPercentage: referrer.bonusPercentage });
      }
    }

    // Save updated data
    await saveData(data);

    // Count referrals for response
    const referralCount = data.wallets.filter(w => w.referredBy === referralCode).length;
    const bonusPercentage = Math.min(referralCount * 10, 100);

    // Send success response
    return res.json({
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all wallets endpoint (for testing)
app.get('/api/wallets', async (req, res) => {
  try {
    const data = await getData();
    res.json({
      status: 'success',
      data: data.wallets
    });
  } catch (error) {
    log('Error getting wallets', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get wallets'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  log('Server error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server only if not in Vercel environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    log(`Server running on port ${port}`);
  });
}

// Export for Vercel
module.exports = app; 