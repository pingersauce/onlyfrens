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
                    const API_URL = 'https://script.google.com/macros/s/AKfycbxW5TAZ2lbzIyEy8Jru-B8wLOz38LUCvf1Sd1JGxXjp1-2oVZfPOQRrXk3PTt9KCayj/exec';
                    
                    console.log('Submitting wallet:', walletAddress);
                    console.log('Request origin:', window.location.origin);
                    
                    // Single API call to submit wallet
                    try {
                        console.log('Starting fetch request...');
                        console.log('Request URL:', API_URL);
                        
                        // Create URL with parameters
                        const url = new URL(API_URL);
                        url.searchParams.append('action', 'submit');
                        url.searchParams.append('origin', window.location.origin);
                        console.log('Full URL with params:', url.toString());
                        
                        // Make the request with a timeout
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                        
                        try {
                            const response = await fetch(url.toString(), {
                                method: 'POST',
                                signal: controller.signal,
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    walletAddress: walletAddress,
                                    referredBy: urlReferralCode || '',
                                    timestamp: new Date().toISOString()
                                })
                            });
                            
                            clearTimeout(timeoutId);
                            
                            console.log('Response status:', response.status);
                            console.log('Response status text:', response.statusText);
                            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
                            
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            
                            const text = await response.text();
                            console.log('Raw response:', text);
                            
                            if (!text) {
                                throw new Error('Empty response received');
                            }
                            
                            const data = JSON.parse(text);
                            console.log('Parsed response:', data);

                            if (data.error) {
                                throw new Error(data.error);
                            }

                            console.log('Wallet submitted successfully');
                            showFeedback('Wallet address submitted successfully!');
                            walletInput.value = '';
                            
                            // Show referral popup with user's data
                            const userReferralCode = data.referralCode || walletAddress.substring(0, 6).toUpperCase();
                            const bonusPercentage = data.bonusPercentage || 0;
                            const referralCount = data.referralCount || 0;
                            showReferralPopup(userReferralCode, bonusPercentage, referralCount);
                            
                        } catch (fetchError) {
                            console.error('Fetch error:', {
                                name: fetchError.name,
                                message: fetchError.message,
                                stack: fetchError.stack,
                                type: fetchError.type,
                                cause: fetchError.cause
                            });
                            
                            if (fetchError.name === 'AbortError') {
                                throw new Error('Request timed out after 10 seconds');
                            }
                            
                            throw fetchError;
                        }
                        
                    } catch (error) {
                        console.error('Error in wallet submission:', {
                            name: error.name,
                            message: error.message,
                            stack: error.stack
                        });
                        
                        // More user-friendly error message
                        let errorMessage = 'Error submitting wallet address. ';
                        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                            errorMessage += 'Unable to connect to the server. Please check your internet connection and try again.';
                        } else if (error.message.includes('timed out')) {
                            errorMessage += 'The request took too long to complete. Please try again.';
                        } else {
                            errorMessage += error.message;
                        }
                        showFeedback(errorMessage, true);
                    } finally {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Submit';
                    }
                } catch (error) {
                    console.error('Error in wallet submission process:', error);
                    showFeedback(error.message || 'Error submitting wallet address. Please try again.', true);
                }
            } else {
                showFeedback('Please enter a valid Solana wallet address (44 characters).', true);
                walletInput.focus();
            }
        });
    }
});