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
    const API_URL = 'https://script.google.com/macros/s/AKfycbwruL1ef15vNIwZlp89eVDJDf7AX_V80xZWt6u4mC2n3xiyA57nq0dXsTeNUzh2W2Dd/exec';

    if (submitButton && walletInput) {
        submitButton.addEventListener('click', async () => {
            const walletAddress = walletInput.value.trim();
            
            if (walletAddress) {
                try {
                    // Visual feedback
                    submitButton.disabled = true;
                    submitButton.textContent = 'Submitting...';
                    
                    console.log('Submitting wallet:', walletAddress);
                    console.log('Current origin:', window.location.origin);
                    
                    // Make the request
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            walletAddress: walletAddress,
                            origin: window.location.origin
                        })
                    });
                    
                    console.log('Response status:', response.status);
                    const text = await response.text();
                    console.log('Raw response:', text);
                    
                    let data;
                    try {
                        data = JSON.parse(text);
                        console.log('Parsed response:', data);
                    } catch (parseError) {
                        console.error('Failed to parse response:', parseError);
                        throw new Error('Invalid JSON response');
                    }
                    
                    if (data.status === 'success') {
                        showFeedback('Wallet submitted successfully!');
                    } else {
                        showFeedback('Submission failed: ' + (data.message || 'Unknown error'), true);
                    }
                    
                } catch (error) {
                    console.error('Submission error:', {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    });
                    showFeedback('Error submitting wallet: ' + error.message, true);
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