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
    const API_URL = 'https://script.google.com/macros/s/AKfycbyW4Q9R7bmrIGWA4oxv8cV9KvVNxx5vReN0Syk-fjELgP8h82-NhkUTz9LrHczP8saw/exec';

    if (submitButton && walletInput) {
        submitButton.addEventListener('click', async () => {
            const walletAddress = walletInput.value.trim();
            
            if (walletAddress) {
                try {
                    // Visual feedback
                    submitButton.disabled = true;
                    submitButton.textContent = 'Testing...';
                    
                    console.log('Testing connection to:', API_URL);
                    console.log('Current origin:', window.location.origin);
                    
                    // First try a simple GET request
                    console.log('Testing GET request...');
                    try {
                        const getResponse = await fetch(API_URL);
                        console.log('GET Response status:', getResponse.status);
                        const getData = await getResponse.json();
                        console.log('GET Response data:', getData);
                    } catch (getError) {
                        console.error('GET request failed:', getError);
                    }
                    
                    // Then try the POST request
                    console.log('Testing POST request...');
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Origin': window.location.origin
                        },
                        body: JSON.stringify({
                            test: true,
                            walletAddress: walletAddress,
                            origin: window.location.origin
                        })
                    });
                    
                    console.log('POST Response status:', response.status);
                    console.log('POST Response headers:', Object.fromEntries(response.headers.entries()));
                    
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
                        showFeedback('Connection test successful!');
                    } else {
                        showFeedback('Test failed: ' + (data.message || 'Unknown error'), true);
                    }
                    
                } catch (error) {
                    console.error('Test error:', {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    });
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