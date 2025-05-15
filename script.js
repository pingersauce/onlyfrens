// Add a simple event listener to the submit button as a placeholder
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submitWallet');
    const walletInput = document.getElementById('walletAddress');
    const container = document.querySelector('.container');

    // Create feedback element
    const feedbackElement = document.createElement('div');
    feedbackElement.className = 'feedback-message';
    container.insertBefore(feedbackElement, document.querySelector('.image-gallery'));

    function showFeedback(message, isError = false) {
        feedbackElement.textContent = message;
        feedbackElement.className = `feedback-message ${isError ? 'error' : 'success'}`;
        feedbackElement.style.display = 'block';
        
        // Hide feedback after 5 seconds
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 5000);
    }

    // API endpoint - will be automatically handled by Vercel
    const API_URL = '/api/submit-wallet';

    if (submitButton && walletInput) {
        submitButton.addEventListener('click', async () => {
            const walletAddress = walletInput.value.trim();
            
            if (walletAddress) {
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
                        const message = data.data.referralCount > 0 
                            ? `Wallet submitted successfully! Your referral code is ${data.data.referralCode} (${data.data.referralCount} referrals)`
                            : 'Wallet submitted successfully! Your referral code is ' + data.data.referralCode;
                        showFeedback(message);
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
            } else {
                showFeedback('Please enter a wallet address', true);
            }
        });
    }
});