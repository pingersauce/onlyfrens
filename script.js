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

    if (submitButton && walletInput) {
        submitButton.addEventListener('click', () => {
            const walletAddress = walletInput.value.trim();
            
            // Basic Solana address validation
            if (walletAddress && walletAddress.length >= 32 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(walletAddress)) {
                // Visual feedback
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';
                
                // Simulate submission (replace with actual API call)
                setTimeout(() => {
                    console.log('Submitted Wallet Address:', walletAddress);
                    showFeedback('Wallet address submitted successfully!');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Submit';
                    walletInput.value = '';
                }, 1000);
            } else {
                showFeedback('Please enter a valid Solana wallet address.', true);
                walletInput.focus();
            }
        });

        // Add input validation on typing
        walletInput.addEventListener('input', () => {
            const value = walletInput.value.trim();
            if (value.length > 0) {
                submitButton.disabled = !(/^[1-9A-HJ-NP-Za-km-z]+$/.test(value));
            } else {
                submitButton.disabled = false;
            }
        });
    }
});