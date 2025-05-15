// Add a simple event listener to the submit button as a placeholder
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submitWallet');
    const walletInput = document.getElementById('walletAddress');
    const container = document.querySelector('.container');

    // Create feedback element
    const feedbackElement = document.createElement('div');
    feedbackElement.className = 'feedback-message';
    container.insertBefore(feedbackElement, document.querySelector('.image-gallery'));

    // Create referral popup
    const referralPopup = document.createElement('div');
    referralPopup.className = 'referral-popup';
    referralPopup.style.display = 'none';
    referralPopup.innerHTML = `
        <div class="referral-content">
            <h2>We goon together, we moon together!</h2>
            <p>Share your unique referral link to earn 10% bonus for each friend who joins!</p>
            <div class="referral-link-container">
                <input type="text" id="referralLink" readonly>
                <button id="copyLink">Copy</button>
            </div>
            <p class="bonus-info">Current Bonus: <span id="bonusAmount">0%</span></p>
            <p class="referral-count">Total Referrals: <span id="referralCount">0</span></p>
            <button id="closePopup">Close</button>
        </div>
    `;
    document.body.appendChild(referralPopup);

    // Add styles for the popup
    const style = document.createElement('style');
    style.textContent = `
        .referral-popup {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .referral-content {
            background: #1a1a2e;
            padding: 30px;
            border-radius: 10px;
            border: 1px solid #00bfff;
            box-shadow: 0 0 20px rgba(0, 191, 255, 0.3);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        .referral-content h2 {
            color: #00ffff;
            margin-bottom: 20px;
        }
        .referral-link-container {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        .referral-link-container input {
            flex-grow: 1;
            padding: 10px;
            border: 1px solid #00bfff;
            border-radius: 5px;
            background: #2a2a4a;
            color: #fff;
        }
        .referral-content button {
            padding: 10px 20px;
            background: #00bfff;
            border: none;
            border-radius: 5px;
            color: #1a1a2e;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .referral-content button:hover {
            background: #00ffff;
            box-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
        }
        .bonus-info, .referral-count {
            color: #00ffff;
            font-size: 1.2em;
            margin: 20px 0;
        }
        #bonusAmount, #referralCount {
            font-weight: bold;
            color: #00ff00;
        }
    `;
    document.head.appendChild(style);

    function showFeedback(message, isError = false) {
        feedbackElement.textContent = message;
        feedbackElement.className = `feedback-message ${isError ? 'error' : 'success'}`;
        feedbackElement.style.display = 'block';
        
        // Hide feedback after 5 seconds
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 5000);
    }

    function showReferralPopup(referralCode, bonusPercentage = 0, referralCount = 0) {
        const linkInput = document.getElementById('referralLink');
        const bonusAmount = document.getElementById('bonusAmount');
        const referralCountElement = document.getElementById('referralCount');
        const baseUrl = window.location.origin + window.location.pathname;
        const referralLink = `${baseUrl}?ref=${referralCode}`;
        
        linkInput.value = referralLink;
        bonusAmount.textContent = `${bonusPercentage}%`;
        referralCountElement.textContent = referralCount;
        referralPopup.style.display = 'flex';

        // Copy button functionality
        document.getElementById('copyLink').addEventListener('click', () => {
            linkInput.select();
            document.execCommand('copy');
            showFeedback('Referral link copied to clipboard!');
        });

        // Close button functionality
        document.getElementById('closePopup').addEventListener('click', () => {
            referralPopup.style.display = 'none';
        });
    }

    // Function to validate Solana address
    function isValidSolanaAddress(address) {
        // Basic Solana address validation (44 characters, base58)
        return address && address.length === 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
    }

    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlReferralCode = urlParams.get('ref');

    if (submitButton && walletInput) {
        submitButton.addEventListener('click', async () => {
            const walletAddress = walletInput.value.trim();
            
            if (isValidSolanaAddress(walletAddress)) {
                try {
                    // Visual feedback
                    submitButton.disabled = true;
                    submitButton.textContent = 'Submitting...';
                    
                    // Google Apps Script deployment URL
                    const API_URL = 'https://script.google.com/macros/s/AKfycbzGKrywJ2MgIo3zeHDotO15lLPc_0z1N9GdYVcNQbwDFGNdCnMpmoHcbkdzxyaFW7gm/exec';
                    
                    console.log('Checking wallet:', walletAddress);
                    
                    // First, check if this wallet already exists
                    const checkResponse = await fetch(`${API_URL}?action=check&wallet=${encodeURIComponent(walletAddress)}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    }).then(response => response.json()).catch(error => {
                        console.error('Check wallet error:', error);
                        throw new Error('Failed to check wallet');
                    });

                    console.log('Submitting wallet to Google Sheets...');
                    
                    // Send to Google Sheets
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            walletAddress: walletAddress,
                            referredBy: urlReferralCode || '',
                            timestamp: new Date().toISOString(),
                            action: 'submit'
                        })
                    }).then(response => response.json()).catch(error => {
                        console.error('Submit wallet error:', error);
                        throw new Error('Failed to submit wallet');
                    });

                    console.log('Getting referral stats...');
                    
                    // Get user's referral stats
                    const statsResponse = await fetch(`${API_URL}?action=stats&wallet=${encodeURIComponent(walletAddress)}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    }).then(response => response.json()).catch(error => {
                        console.error('Get stats error:', error);
                        throw new Error('Failed to get referral stats');
                    });

                    console.log('All operations completed successfully');
                    showFeedback('Wallet address submitted successfully!');
                    walletInput.value = '';
                    
                    // Show referral popup with user's data
                    const userReferralCode = response.referralCode || walletAddress.substring(0, 6).toUpperCase();
                    const bonusPercentage = response.bonusPercentage || 0;
                    const referralCount = response.referralCount || 0;
                    showReferralPopup(userReferralCode, bonusPercentage, referralCount);
                    
                } catch (error) {
                    console.error('Error in wallet submission process:', error);
                    showFeedback('Error submitting wallet address. Please try again.', true);
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Submit';
                }
            } else {
                showFeedback('Please enter a valid Solana wallet address (44 characters).', true);
                walletInput.focus();
            }
        });
    }
});