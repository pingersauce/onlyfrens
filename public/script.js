// Add a simple event listener to the submit button as a placeholder
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submitWallet');
    const walletInput = document.getElementById('walletAddress');
    const container = document.querySelector('.container');

    // Create popup element for invalid wallet
    const invalidWalletPopup = document.createElement('div');
    invalidWalletPopup.id = 'invalidWalletPopup';
    invalidWalletPopup.style.cssText = `
        display: none;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(26, 26, 46, 0.95);
        padding: 2rem;
        border-radius: 12px;
        border: 1px solid #ff4444;
        color: white;
        z-index: 1000;
        max-width: 90%;
        width: 400px;
        text-align: center;
        box-shadow: 0 0 20px rgba(255, 68, 68, 0.3);
    `;
    invalidWalletPopup.innerHTML = `
        <h2 style="color: #ff4444; margin-bottom: 1rem;">Invalid Wallet Address</h2>
        <p style="color: #e0e0e0; margin-bottom: 1.5rem;">
            Please enter a valid Solana wallet address.<br>
            It should be 32-44 characters long and contain only base58 characters.
        </p>
        <button id="closeInvalidPopup" style="
            background: #ff4444;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background-color 0.3s;
        ">Close</button>
    `;
    document.body.appendChild(invalidWalletPopup);

    // Add overlay for invalid wallet popup
    const invalidWalletOverlay = document.createElement('div');
    invalidWalletOverlay.id = 'invalidWalletOverlay';
    invalidWalletOverlay.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 999;
    `;
    document.body.appendChild(invalidWalletOverlay);

    // Function to show invalid wallet popup
    function showInvalidWalletPopup() {
        invalidWalletPopup.style.display = 'block';
        invalidWalletOverlay.style.display = 'block';
    }

    // Function to hide invalid wallet popup
    function hideInvalidWalletPopup() {
        invalidWalletPopup.style.display = 'none';
        invalidWalletOverlay.style.display = 'none';
    }

    // Add event listener for closing invalid wallet popup
    document.getElementById('closeInvalidPopup').addEventListener('click', hideInvalidWalletPopup);
    invalidWalletOverlay.addEventListener('click', hideInvalidWalletPopup);

    // Function to validate Solana wallet address
    function isValidSolanaWallet(address) {
        // Solana addresses are 32-44 characters long and use base58 encoding
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        return base58Regex.test(address);
    }

    // Create feedback element
    const feedbackElement = document.createElement('div');
    feedbackElement.className = 'feedback-message';
    container.insertBefore(feedbackElement, document.querySelector('.image-container'));

    function showFeedback(message, isError = false) {
        feedbackElement.textContent = message;
        feedbackElement.className = `feedback-message ${isError ? 'error' : 'success'}`;
        feedbackElement.style.display = 'block';
        
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 5000);
    }

    // API endpoint
    const API_URL = '/api/wallets';

    if (submitButton && walletInput) {
        submitButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const walletAddress = walletInput.value.trim();
            
            if (!walletAddress) {
                showFeedback('Please enter a wallet address', true);
                return;
            }

            if (!isValidSolanaWallet(walletAddress)) {
                showInvalidWalletPopup();
                return;
            }

            try {
                // Visual feedback
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';
                
                console.log('Submitting wallet:', walletAddress);
                
                // Get referral code from URL if present
                const urlParams = new URLSearchParams(window.location.search);
                const referredBy = urlParams.get('ref');
                
                // Make the request
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        walletAddress,
                        referredBy
                    })
                });
                
                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Response:', data);
                
                if (data.status === 'success') {
                    showFeedback('Wallet submitted successfully!');
                    // Show the referral popup with the referral code and position
                    showReferralPopup(data.data.referralCode, data.data.positionInLine);
                } else {
                    showFeedback(data.message || 'Submission failed', true);
                }
                
            } catch (error) {
                console.error('Submission error:', error);
                showFeedback('Error submitting wallet. Please try again.', true);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit';
            }
        });
    }

    // Create popup element
    const popup = document.createElement('div');
    popup.id = 'referral-popup';
    popup.style.cssText = `
        display: none;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        padding: 2rem;
        border-radius: 12px;
        border: 1px solid #333;
        color: white;
        z-index: 1000;
        max-width: 90%;
        width: 400px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    // Add popup content
    popup.innerHTML = `
        <h2 style="color: #fff; margin-bottom: 1rem;">We goon together, we moon together!</h2>
        <div style="margin-bottom: 1.5rem;">
            <p style="color: #ccc; margin-bottom: 0.5rem;">Your referral code:</p>
            <div style="
                background: #1a1a1a;
                padding: 0.75rem;
                border-radius: 8px;
                border: 1px solid #333;
                margin-bottom: 1rem;
                font-family: monospace;
                font-size: 1.2rem;
                color: #fff;
            " id="referral-code"></div>
            <p style="color: #ccc; margin-bottom: 0.5rem;">Your referral link:</p>
            <div style="
                background: #1a1a1a;
                padding: 0.75rem;
                border-radius: 8px;
                border: 1px solid #333;
                margin-bottom: 1rem;
                font-family: monospace;
                font-size: 0.9rem;
                color: #fff;
                word-break: break-all;
            " id="referral-link"></div>
            <button id="copy-link" style="
                background: #4CAF50;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 0.5rem;
                font-size: 0.9rem;
            ">Copy Link</button>
        </div>
        <div style="margin-bottom: 1.5rem;">
            <h3 style="color: #fff; margin-bottom: 0.5rem;">🎁 Tiered Airdrop Rewards</h3>
            <div style="
                background: #1a1a1a;
                padding: 1rem;
                border-radius: 8px;
                border: 1px solid #333;
                margin-bottom: 1rem;
                text-align: left;
            ">
                <p style="color: #00ffff; margin-bottom: 0.5rem; font-weight: bold;">Early Bird Tiers:</p>
                <ul style="color: #ccc; font-size: 0.9rem; margin: 0; padding-left: 1.2rem;">
                    <li style="margin-bottom: 0.3rem;">First 100 wallets: <span style="color: #4CAF50;">2x Base Reward</span></li>
                    <li style="margin-bottom: 0.3rem;">Wallets 101-500: <span style="color: #4CAF50;">1.5x Base Reward</span></li>
                    <li style="margin-bottom: 0.3rem;">Wallets 501-1000: <span style="color: #4CAF50;">1.25x Base Reward</span></li>
                    <li>Wallets 1001+: <span style="color: #4CAF50;">1x Base Reward</span></li>
                </ul>
            </div>
            <p style="color: #ccc; font-size: 0.9rem;">
                • Get 10% bonus for each friend you refer<br>
                • Share your link to start earning!
            </p>
        </div>
        <button id="close-popup" style="
            background: #333;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
        ">Close</button>
    `;
    document.body.appendChild(popup);

    // Add overlay
    const overlay = document.createElement('div');
    overlay.id = 'popup-overlay';
    overlay.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 999;
    `;
    document.body.appendChild(overlay);

    // Function to show popup
    function showReferralPopup(referralCode, positionInLine) {
        const baseUrl = window.location.origin;
        const referralLink = `${baseUrl}?ref=${referralCode}`;
        
        document.getElementById('referral-code').textContent = referralCode;
        document.getElementById('referral-link').textContent = referralLink;
        
        // Add position in line to the popup with tier information
        const positionElement = document.createElement('div');
        positionElement.style.cssText = `
            margin-bottom: 1.5rem;
            padding: 0.75rem;
            background: #1a1a1a;
            border-radius: 8px;
            border: 1px solid #333;
            color: #00ffff;
            font-size: 1.2rem;
            font-weight: bold;
        `;
        
        // Determine tier based on position
        let tierMultiplier = "1x";
        if (positionInLine <= 100) {
            tierMultiplier = "2x";
        } else if (positionInLine <= 500) {
            tierMultiplier = "1.5x";
        } else if (positionInLine <= 1000) {
            tierMultiplier = "1.25x";
        }
        
        positionElement.innerHTML = `You are #${positionInLine} in line!<br><span style="font-size: 0.9rem; color: #4CAF50;">(${tierMultiplier} Base Reward)</span>`;
        
        // Insert position element after the referral link
        const referralLinkDiv = document.getElementById('referral-link').parentElement;
        referralLinkDiv.parentElement.insertBefore(positionElement, referralLinkDiv.nextSibling);
        
        popup.style.display = 'block';
        overlay.style.display = 'block';
    }

    // Function to hide popup
    function hideReferralPopup() {
        popup.style.display = 'none';
        overlay.style.display = 'none';
    }

    // Add event listeners for popup
    document.getElementById('close-popup').addEventListener('click', hideReferralPopup);
    document.getElementById('copy-link').addEventListener('click', () => {
        const link = document.getElementById('referral-link').textContent;
        navigator.clipboard.writeText(link).then(() => {
            const button = document.getElementById('copy-link');
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.background = '#45a049';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '#4CAF50';
            }, 2000);
        });
    });

    // Check for referral code in URL on page load
    const urlParams = new URLSearchParams(window.location.search);
    const referredBy = urlParams.get('ref');
    if (referredBy) {
        showFeedback(`Referred by: ${referredBy}`);
    }
});