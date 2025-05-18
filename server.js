const express = require('express');
const cors = require('cors');
const { Redis } = require('@upstash/redis');
const { Client } = require('@upstash/qstash');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Upstash Redis client
const redis = new Redis({
    url: 'https://darling-cheetah-31096.upstash.io',
    token: 'AXl4AAIjcDEzNTJhMWEwYWM0NWI0ZWU1ODgxMzY5MTNmMDAxMmI3NXAxMA'
});

// Initialize QStash client
const qstash = new Client({
    token: process.env.QSTASH_TOKEN
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper function to read wallets
async function readWallets() {
    try {
        console.log('Attempting to read wallets from Redis...');
        const wallets = await redis.get('wallets');
        console.log('Wallets read successfully:', wallets);
        return wallets || [];
    } catch (error) {
        console.error('Error reading wallets from Redis:', error);
        return [];
    }
}

// Helper function to write wallets
async function writeWallets(wallets) {
    try {
        console.log('Attempting to write wallets to Redis:', wallets);
        await redis.set('wallets', wallets);
        console.log('Wallets written successfully');
    } catch (error) {
        console.error('Error writing wallets to Redis:', error);
        throw error;
    }
}

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Test Redis connection
        await redis.ping();
        res.json({
            status: 'ok',
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            redis: 'connected'
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server is running but Redis connection failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get all wallets
app.get('/api/wallets', async (req, res) => {
    try {
        console.log('GET /api/wallets - Fetching all wallets');
        const wallets = await readWallets();
        console.log('GET /api/wallets - Success:', wallets);
        res.json(wallets);
    } catch (error) {
        console.error('GET /api/wallets - Error:', error);
        res.status(500).json({ 
            error: 'Failed to read wallets',
            details: error.message 
        });
    }
});

// Add a new wallet
app.post('/api/wallets', async (req, res) => {
    try {
        const { walletAddress, referredBy } = req.body;
        console.log('POST /api/wallets - Received wallet:', walletAddress);
        
        if (!walletAddress) {
            console.log('POST /api/wallets - Missing wallet address');
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        const wallets = await readWallets();
        console.log('POST /api/wallets - Current wallets:', wallets);
        
        // Check if wallet already exists
        if (wallets.some(w => w.address === walletAddress)) {
            console.log('POST /api/wallets - Wallet already exists');
            return res.status(400).json({ error: 'Wallet already exists' });
        }

        // Generate referral code from wallet address
        const referralCode = walletAddress.substring(0, 6).toUpperCase();
        
        // Add new wallet
        const newWallet = {
            id: Date.now().toString(),
            address: walletAddress,
            timestamp: new Date().toISOString(),
            referralCode: referralCode,
            referredBy: referredBy || ''
        };
        console.log('POST /api/wallets - Adding new wallet:', newWallet);

        wallets.push(newWallet);
        await writeWallets(wallets);
        console.log('POST /api/wallets - Successfully added wallet');

        // Calculate position in line (1-based index)
        const positionInLine = wallets.length;

        // Return success response with the same format as local version
        res.status(201).json({
            status: 'success',
            message: 'Wallet submitted successfully',
            data: {
                referralCode,
                positionInLine,
                bonusPercentage: 0,
                referralCount: 0
            }
        });
    } catch (error) {
        console.error('POST /api/wallets - Error:', error);
        res.status(500).json({ 
            error: 'Failed to add wallet',
            details: error.message 
        });
    }
});

// Delete a wallet
app.delete('/api/wallets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('DELETE /api/wallets - Deleting wallet:', id);
        
        let wallets = await readWallets();
        const initialLength = wallets.length;
        wallets = wallets.filter(w => w.id !== id);
        
        if (wallets.length === initialLength) {
            console.log('DELETE /api/wallets - Wallet not found');
            return res.status(404).json({ error: 'Wallet not found' });
        }

        await writeWallets(wallets);
        console.log('DELETE /api/wallets - Successfully deleted wallet');
        res.json({ message: 'Wallet deleted successfully' });
    } catch (error) {
        console.error('DELETE /api/wallets - Error:', error);
        res.status(500).json({ 
            error: 'Failed to delete wallet',
            details: error.message 
        });
    }
});

// Add a new endpoint to POST a referral (referrer and referee wallet addresses)
app.post('/api/referrals', async (req, res) => {
    try {
        const { referrer, referee } = req.body;
        if (!referrer || !referee) {
            return res.status(400).json({ error: "Referrer and referee wallet addresses are required." });
        }
        console.log("POST /api/referrals – Received referral:", { referrer, referee });
        // Read current referrals (or initialize an empty array if none exist)
        let referrals = await redis.get("referrals") || [];
        // Append new referral (for example, as an object { referrer, referee, timestamp })
        const newReferral = { referrer, referee, timestamp: new Date().toISOString() };
        referrals.push(newReferral);
        // Write updated referrals back to Redis
        await redis.set("referrals", referrals);
        console.log("Referral written successfully:", newReferral);
        res.status(201).json(newReferral);
    } catch (error) {
        console.error("POST /api/referrals – Error:", error);
        res.status(500).json({ error: "Failed to add referral", details: error.message });
    }
});

// Get all referrals
app.get('/api/referrals', async (req, res) => {
    try {
        console.log('GET /api/referrals - Fetching all referrals');
        const referrals = await redis.get('referrals') || [];
        console.log('GET /api/referrals - Success:', referrals);
        res.json(referrals);
    } catch (error) {
        console.error('GET /api/referrals - Error:', error);
        res.status(500).json({ 
            error: 'Failed to read referrals',
            details: error.message 
        });
    }
});

// Start server
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log('Redis Configuration:', {
            url: 'https://darling-cheetah-31096.upstash.io',
            token: 'AXl4AAIjcDEzNTJhMWEwYWM0NWI0ZWU1ODgxMzY5MTNmMDAxMmI3NXAxMA'
        });
    });
}

// Export for Vercel
module.exports = app; 