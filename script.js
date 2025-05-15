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

    // Test API URL
    const API_URL = 'https://script.google.com/macros/s/AKfycbxc6j3bgU8mp7JUQ3hBZHzQNcHIftAuoYs4b4nsDYZAajrBsE_WZNRrK_jQeGiWtI_H/exec';

    if (submitButton && walletInput) {
        submitButton.addEventListener('click', async () => {
            const walletAddress = walletInput.value.trim();
            
            if (walletAddress) {
                try {
                    // Visual feedback
                    submitButton.disabled = true;
                    submitButton.textContent = 'Testing...';
                    
                    console.log('Testing connection to:', API_URL);
                    
                    // Simple test request
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            test: true,
                            walletAddress: walletAddress
                        })
                    });
                    
                    console.log('Response status:', response.status);
                    const data = await response.json();
                    console.log('Response data:', data);
                    
                    if (data.status === 'success') {
                        showFeedback('Connection test successful!');
                    } else {
                        showFeedback('Test failed: ' + (data.message || 'Unknown error'), true);
                    }
                    
                } catch (error) {
                    console.error('Test error:', error);
                    showFeedback('Error testing connection: ' + error.message, true);
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