const express = require('express');
const cors = require('cors');
const { kv } = require('@vercel/kv');
const { Client } = require('@upstash/qstash');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize KV with Redis URL and token
const kvClient = new kv({
    url: 'redis://darling-cheetah-31096.upstash.io:6379',
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
        const wallets = await kvClient.get('wallets') || [];
        return wallets;
    } catch (error) {
        console.error('Error reading wallets:', error);
        return [];
    }
}

// Helper function to write wallets
async function writeWallets(wallets) {
    await kvClient.set('wallets', wallets);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Get all wallets
app.get('/api/wallets', async (req, res) => {
    try {
        const wallets = await readWallets();
        res.json(wallets);
    } catch (error) {
        console.error('Error reading wallets:', error);
        res.status(500).json({ error: 'Failed to read wallets' });
    }
});

// Queue wallet submission
app.post('/api/wallets', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        
        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Queue the wallet submission
        await qstash.publishJSON({
            url: `${process.env.VERCEL_URL || `http://localhost:${port}`}/api/process-wallet`,
            body: { walletAddress },
            retries: 3, // Retry up to 3 times if failed
            delay: 0 // Process immediately
        });

        res.status(202).json({ 
            message: 'Wallet submission queued',
            status: 'processing'
        });
    } catch (error) {
        console.error('Error queueing wallet:', error);
        res.status(500).json({ error: 'Failed to queue wallet submission' });
    }
});

// Process queued wallet submission
app.post('/api/process-wallet', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        
        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        const wallets = await readWallets();
        
        // Check if wallet already exists
        if (wallets.some(w => w.address === walletAddress)) {
            return res.status(400).json({ error: 'Wallet already exists' });
        }

        // Add new wallet
        const newWallet = {
            id: Date.now().toString(),
            address: walletAddress,
            timestamp: new Date().toISOString()
        };

        wallets.push(newWallet);
        await writeWallets(wallets);

        res.status(201).json(newWallet);
    } catch (error) {
        console.error('Error processing wallet:', error);
        // Return 500 to trigger QStash retry
        res.status(500).json({ error: 'Failed to process wallet' });
    }
});

// Delete a wallet
app.delete('/api/wallets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let wallets = await readWallets();
        
        const initialLength = wallets.length;
        wallets = wallets.filter(w => w.id !== id);
        
        if (wallets.length === initialLength) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        await writeWallets(wallets);
        res.json({ message: 'Wallet deleted successfully' });
    } catch (error) {
        console.error('Error deleting wallet:', error);
        res.status(500).json({ error: 'Failed to delete wallet' });
    }
});

// Start server
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

// Export for Vercel
module.exports = app; 