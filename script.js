// Add a simple event listener to the submit button as a placeholder
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submitWallet');
    const walletInput = document.getElementById('walletAddress');
    const container = document.querySelector('.container');

    // Create feedback element
    const feedbackElement = document.createElement('div');
    feedbackElement.className = 'feedback-message';
    container.insertBefore(feedbackElement, document.querySelector('.walletList'));

    function showFeedback(message, isError = false) {
        feedbackElement.textContent = message;
        feedbackElement.className = `feedback-message ${isError ? 'error' : 'success'}`;
        feedbackElement.style.display = 'block';
        
        // Hide feedback after 5 seconds
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 5000);
    }

    // API endpoint
    const API_URL = '/api/wallets';

    if (submitButton && walletInput) {
        submitButton.addEventListener('click', async () => {
            const walletAddress = walletInput.value.trim();
            
            if (walletAddress) {
                try {
                    // Visual feedback
                    submitButton.disabled = true;
                    submitButton.textContent = 'Submitting...';
                    
                    // Make the request
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ walletAddress })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        if (data.status === 'processing') {
                            showFeedback('Wallet submission queued. Processing...');
                            // Poll for updates
                            pollWalletStatus(walletAddress);
                        } else {
                            showFeedback('Wallet added successfully!');
                            walletInput.value = ''; // Clear input
                            loadWallets(); // Refresh the wallet list
                        }
                    } else {
                        showFeedback(data.error || 'Failed to add wallet', true);
                    }
                    
                } catch (error) {
                    console.error('Submission error:', error);
                    showFeedback('Error submitting wallet. Please try again.', true);
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Submit';
                }
            } else {
                showFeedback('Please enter a wallet address', true);
            }
        });
    }

    // Function to poll wallet status
    async function pollWalletStatus(walletAddress) {
        const maxAttempts = 10;
        let attempts = 0;
        
        const poll = async () => {
            try {
                const wallets = await loadWallets();
                const wallet = wallets.find(w => w.address === walletAddress);
                
                if (wallet) {
                    showFeedback('Wallet added successfully!');
                    walletInput.value = ''; // Clear input
                    return true;
                }
                
                attempts++;
                if (attempts >= maxAttempts) {
                    showFeedback('Wallet submission is taking longer than expected. Please check back later.', true);
                    return true;
                }
                
                // Poll again after 2 seconds
                setTimeout(poll, 2000);
            } catch (error) {
                console.error('Polling error:', error);
                showFeedback('Error checking wallet status', true);
                return true;
            }
        };
        
        poll();
    }

    // Function to load wallets
    async function loadWallets() {
        try {
            const response = await fetch(API_URL);
            const wallets = await response.json();
            const walletsDiv = document.getElementById('wallets');
            walletsDiv.innerHTML = wallets.map(wallet => `
                <div class="wallet-item">
                    <span>${wallet.address}</span>
                    <button class="delete-btn" onclick="deleteWallet('${wallet.id}')">Delete</button>
                </div>
            `).join('');
            return wallets;
        } catch (error) {
            console.error('Error loading wallets:', error);
            showFeedback('Error loading wallets', true);
            return [];
        }
    }

    // Function to delete wallet
    window.deleteWallet = async function(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                showFeedback('Wallet deleted successfully');
                loadWallets();
            } else {
                showFeedback('Error deleting wallet', true);
            }
        } catch (error) {
            console.error('Error deleting wallet:', error);
            showFeedback('Error deleting wallet', true);
        }
    };

    // Load wallets when page loads
    loadWallets();
});