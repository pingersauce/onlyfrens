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
                
                if (response.ok) {
                    showFeedback('Wallet submitted successfully!');
                    document.getElementById('walletForm').reset();
                    // Show the referral popup with the referral code and position
                    showReferralPopup(data.data.referralCode, data.data.positionInLine);
                } else if (response.status === 400 && data.error === "Wallet already exists") {
                    // If the wallet is a duplicate, show the duplicate modal
                    openDuplicateModal(walletAddress);
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

    // Function to show popup
    function showReferralPopup(referralCode, positionInLine) {
        // Get the modal elements
        const modal = document.getElementById('referralModal');
        const codeElement = document.getElementById('referral-code');
        const linkElement = document.getElementById('referral-link');
        
        // Set the referral code and link
        codeElement.textContent = referralCode;
        linkElement.textContent = `https://onlyfrens.pro?ref=${referralCode}`;
        
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
        const referralLinkDiv = linkElement.parentElement;
        referralLinkDiv.parentElement.insertBefore(positionElement, referralLinkDiv.nextSibling);
        
        // Show the modal
        modal.style.display = 'flex';
    }

    // Function to hide popup
    function hideReferralPopup() {
        const modal = document.getElementById('referralModal');
        modal.style.display = 'none';
    }

    // Function to open duplicate modal
    function openDuplicateModal(wallet) {
        const modal = document.getElementById("duplicateModal");
        modal.style.display = "flex";
    }

    // Function to close duplicate modal
    function closeDuplicateModal() {
        const modal = document.getElementById("duplicateModal");
        modal.style.display = "none";
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

    // Add event listener for duplicate modal close button
    document.querySelector('#duplicateModal button').addEventListener('click', closeDuplicateModal);

    // Check for referral code in URL on page load
    const urlParams = new URLSearchParams(window.location.search);
    const referredBy = urlParams.get('ref');
    if (referredBy) {
        showFeedback(`Referred by: ${referredBy}`);
    }
});