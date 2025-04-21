// RENTAHAL Token Gatekeeper Bolt-On
// This script creates a gateway that must be passed before the main RENTAHAL interface is shown
// It checks for a connected wallet and requires a $9000 token transfer before proceeding

// Configuration
const config = {
    tokenAddress: "3eazihmAw8yNHhgoNaNr8aBGaBaoLcwZVCBDPnrSpump", // The $9000 token address on Solana
    realmAddress: "REALM_RECEIVING_ADDRESS_HERE", // Your treasury wallet address
    requiredTokens: 1, // Number of tokens required for access
    checkInterval: 5000, // Polling interval in ms
    maxRetries: 100, // Maximum number of balance check retries
    apiEndpoint: "/api/sysop/stats" // Endpoint for system status
};

// Create and inject the gatekeeper UI
function injectGatekeeper() {
    // Create the gatekeeper container
    const gatekeeper = document.createElement('div');
    gatekeeper.id = 'rentahal-gatekeeper';
    gatekeeper.style.position = 'fixed';
    gatekeeper.style.top = '0';
    gatekeeper.style.left = '0';
    gatekeeper.style.width = '100%';
    gatekeeper.style.height = '100%';
    gatekeeper.style.backgroundColor = '#000';
    gatekeeper.style.color = '#0f0';
    gatekeeper.style.fontFamily = 'monospace';
    gatekeeper.style.fontSize = '16px';
    gatekeeper.style.padding = '20px';
    gatekeeper.style.boxSizing = 'border-box';
    gatekeeper.style.zIndex = '10000';
    gatekeeper.style.display = 'flex';
    gatekeeper.style.flexDirection = 'column';
    gatekeeper.style.justifyContent = 'center';
    gatekeeper.style.alignItems = 'center';
    gatekeeper.style.textAlign = 'center';

    // Create the logo
    const logo = document.createElement('div');
    logo.innerHTML = `
        <pre style="color: #0f0; font-size: 24px; margin-bottom: 20px;">
 ____  _____ _   _ _____    _    _   _    _    _     
|  _ \\| ____| \\ | |_   _|  / \\  | | | |  / \\  | |    
| |_) |  _| |  \\| | | |   / _ \\ | |_| | / _ \\ | |    
|  _ <| |___| |\\  | | |  / ___ \\|  _  |/ ___ \\| |___ 
|_| \\_\\_____|_| \\_| |_| /_/   \\_\\_| |_/_/   \\_\\_____|
         THE FIRST BROWSER-BASED RTAIOS
        </pre>
    `;
    gatekeeper.appendChild(logo);

    // Create the message container
    const messageContainer = document.createElement('div');
    messageContainer.id = 'gatekeeper-message';
    messageContainer.style.margin = '20px 0';
    messageContainer.style.padding = '20px';
    messageContainer.style.border = '1px solid #0f0';
    messageContainer.style.borderRadius = '5px';
    messageContainer.style.width = '80%';
    messageContainer.style.maxWidth = '600px';
    gatekeeper.appendChild(messageContainer);

    // Create the action container
    const actionContainer = document.createElement('div');
    actionContainer.id = 'gatekeeper-action';
    actionContainer.style.margin = '20px 0';
    actionContainer.style.width = '80%';
    actionContainer.style.maxWidth = '600px';
    gatekeeper.appendChild(actionContainer);

    // Create the progress indicator
    const progressContainer = document.createElement('div');
    progressContainer.style.width = '80%';
    progressContainer.style.maxWidth = '600px';
    progressContainer.style.margin = '20px 0';
    
    const progressBar = document.createElement('div');
    progressBar.id = 'gatekeeper-progress-bar';
    progressBar.style.height = '4px';
    progressBar.style.width = '0%';
    progressBar.style.backgroundColor = '#0f0';
    progressBar.style.transition = 'width 0.5s ease-in-out';
    
    const progressText = document.createElement('div');
    progressText.id = 'gatekeeper-progress-text';
    progressText.style.marginTop = '10px';
    progressText.style.fontSize = '14px';
    
    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(progressText);
    gatekeeper.appendChild(progressContainer);

    // Add to the document body
    document.body.appendChild(gatekeeper);

    // Hide the main content
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.style.display = 'none';
    } else {
        // If no main tag, hide everything else
        Array.from(document.body.children).forEach(child => {
            if (child !== gatekeeper) {
                child.style.display = 'none';
            }
        });
    }

    return gatekeeper;
}

// Utility function to update the gatekeeper message
function updateMessage(message) {
    const messageContainer = document.getElementById('gatekeeper-message');
    if (messageContainer) {
        messageContainer.innerHTML = `<p>${message}</p>`;
    }
}

// Utility function to update the action container
function updateAction(content) {
    const actionContainer = document.getElementById('gatekeeper-action');
    if (actionContainer) {
        actionContainer.innerHTML = content;
    }
}

// Utility function to update progress
function updateProgress(percent, text) {
    const progressBar = document.getElementById('gatekeeper-progress-bar');
    const progressText = document.getElementById('gatekeeper-progress-text');
    
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
    
    if (progressText) {
        progressText.innerText = text;
    }
}

// Step 1: Show initial system status
async function showSystemStatus() {
    updateProgress(20, 'Initializing system...');
    updateMessage('<span style="color: #888">Connecting to RENTAHAL network...</span>');
    
    try {
        // Try to fetch system status from the API
        const response = await fetch(config.apiEndpoint);
        const data = await response.json();
        
        updateMessage(`
            <h2>RENTAHAL System Status</h2>
            <p>${data.status || 'System online. Waiting for authorization.'}</p>
            <p>Active nodes: ${data.activeNodes || 'Calculating...'}</p>
            <p>Current queue: ${data.queueDepth || '0'} queries</p>
            <p>Average latency: ${data.avgLatency || '0.0'}s</p>
        `);
    } catch (error) {
        // If API fetch fails, show a default message
        updateMessage(`
            <h2>RENTAHAL System Status</h2>
            <p>System online. Waiting for authorization.</p>
            <p>Active nodes: 3-node RTX array</p>
            <p>Current queue: 0 queries</p>
            <p>Wallet verification required to proceed.</p>
        `);
    }
    
    updateProgress(40, 'System initialized. Waiting for wallet connection...');
    
    // Show the wallet connection button
    updateAction(`
        <button id="connect-wallet-btn" style="
            background-color: #0f0;
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-family: monospace;
            font-weight: bold;
            font-size: 16px;
        ">Connect Wallet</button>
        <p style="margin-top: 10px; font-size: 14px;">
            $9000 token required for access to RENTAHAL.
        </p>
    `);
    
    // Add event listener to the wallet connection button
    document.getElementById('connect-wallet-btn').addEventListener('click', connectWallet);
}

// Step 2: Connect Wallet
async function connectWallet() {
    updateMessage('<span style="color: #ffff00">Connecting to wallet...</span>');
    updateProgress(50, 'Establishing wallet connection...');
    
    // Remove the connect button
    updateAction('<span style="color: #888">Connecting...</span>');
    
    try {
        // Check if Phantom wallet is available
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect();
                const publicKey = response.publicKey.toString();
                
                updateMessage(`
                    <h2>Wallet Connected</h2>
                    <p>Address: ${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 4)}</p>
                `);
                
                updateProgress(60, 'Wallet connected. Checking token balance...');
                
                // Proceed to check token balance
                checkTokenBalance(publicKey);
            } catch (err) {
                updateMessage(`
                    <h2>Wallet Connection Error</h2>
                    <p>${err.message || 'Failed to connect to wallet'}</p>
                `);
                
                // Show the connect button again
                updateAction(`
                    <button id="connect-wallet-btn" style="
                        background-color: #0f0;
                        color: #000;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-family: monospace;
                        font-weight: bold;
                        font-size: 16px;
                    ">Retry Connection</button>
                `);
                
                document.getElementById('connect-wallet-btn').addEventListener('click', connectWallet);
                updateProgress(40, 'Connection failed. Please retry...');
            }
        } else {
            updateMessage(`
                <h2>Wallet Not Detected</h2>
                <p>Phantom wallet extension is required.</p>
                <p><a href="https://phantom.app/" target="_blank" style="color: #0f0;">Click here to install Phantom</a></p>
            `);
            
            updateAction(`
                <button id="check-again-btn" style="
                    background-color: #0f0;
                    color: #000;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-family: monospace;
                    font-weight: bold;
                    font-size: 16px;
                ">Check Again</button>
            `);
            
            document.getElementById('check-again-btn').addEventListener('click', connectWallet);
            updateProgress(30, 'Wallet not detected. Installation required...');
        }
    } catch (error) {
        updateMessage(`
            <h2>Connection Error</h2>
            <p>${error.message || 'An unknown error occurred'}</p>
        `);
        
        updateAction(`
            <button id="retry-connection-btn" style="
                background-color: #0f0;
                color: #000;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-family: monospace;
                font-weight: bold;
                font-size: 16px;
            ">Retry Connection</button>
        `);
        
        document.getElementById('retry-connection-btn').addEventListener('click', connectWallet);
        updateProgress(40, 'Connection error. Please retry...');
    }
}

// Step 3: Check Token Balance
async function checkTokenBalance(walletAddress, retryCount = 0) {
    try {
        // For demo purposes, we'll use a mock function
        // In production, this would call the Solana RPC API
        const balance = await getTokenBalance(walletAddress, config.tokenAddress);
        
        if (balance >= config.requiredTokens) {
            updateMessage(`
                <h2>Token Balance Verified</h2>
                <p>You have ${balance} $9000 tokens.</p>
                <p>Required: ${config.requiredTokens} token</p>
            `);
            
            updateProgress(70, 'Token balance verified. Tribute required...');
            
            // Proceed to request tribute
            requestTribute(walletAddress);
        } else {
            updateMessage(`
                <h2>Insufficient Token Balance</h2>
                <p>You have ${balance} $9000 tokens.</p>
                <p>Required: ${config.requiredTokens} token</p>
                <p>Please acquire $9000 tokens to access RENTAHAL.</p>
            `);
            
            updateAction(`
                <a href="https://pump.fun/coin/${config.tokenAddress}" target="_blank" style="
                    display: inline-block;
                    background-color: #0f0;
                    color: #000;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-family: monospace;
                    font-weight: bold;
                    font-size: 16px;
                    text-decoration: none;
                    margin-bottom: 10px;
                ">Get $9000 Tokens</a>
                <br>
                <button id="check-balance-btn" style="
                    background-color: #333;
                    color: #0f0;
                    border: 1px solid #0f0;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-family: monospace;
                    font-weight: bold;
                    font-size: 16px;
                ">Check Balance Again</button>
            `);
            
            document.getElementById('check-balance-btn').addEventListener('click', () => {
                checkTokenBalance(walletAddress, retryCount + 1);
            });
            
            // If we've been checking for a while, update the progress indicator
            const progressPercentage = Math.min(60, 40 + (retryCount / config.maxRetries) * 20);
            updateProgress(progressPercentage, `Waiting for tokens... (${retryCount}/${config.maxRetries})`);
            
            // Auto-retry if we haven't exceeded max retries
            if (retryCount < config.maxRetries) {
                setTimeout(() => {
                    checkTokenBalance(walletAddress, retryCount + 1);
                }, config.checkInterval);
            }
        }
    } catch (error) {
        updateMessage(`
            <h2>Balance Check Error</h2>
            <p>${error.message || 'Failed to check token balance'}</p>
        `);
        
        updateAction(`
            <button id="retry-balance-btn" style="
                background-color: #0f0;
                color: #000;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-family: monospace;
                font-weight: bold;
                font-size: 16px;
            ">Retry Balance Check</button>
        `);
        
        document.getElementById('retry-balance-btn').addEventListener('click', () => {
            checkTokenBalance(walletAddress);
        });
        
        updateProgress(50, 'Balance check failed. Please retry...');
    }
}

// Step 4: Request Tribute
async function requestTribute(walletAddress) {
    updateMessage(`
        <h2>Tribute Required</h2>
        <p>Please transfer 1 $9000 token to the RENTAHAL Realm.</p>
        <p>This is a one-time tribute for session access.</p>
    `);
    
    updateAction(`
        <button id="send-tribute-btn" style="
            background-color: #0f0;
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-family: monospace;
            font-weight: bold;
            font-size: 16px;
        ">Send Tribute</button>
        <p style="margin-top: 10px; font-size: 14px;">
            Recipient: ${config.realmAddress.substring(0, 6)}...${config.realmAddress.substring(config.realmAddress.length - 4)}
        </p>
    `);
    
    document.getElementById('send-tribute-btn').addEventListener('click', () => {
        sendTribute(walletAddress);
    });
    
    updateProgress(80, 'Awaiting tribute payment...');
}

// Step 5: Send Tribute
async function sendTribute(walletAddress) {
    try {
        updateMessage('<span style="color: #ffff00">Initiating token transfer...</span>');
        updateAction('<span style="color: #888">Processing...</span>');
        
        // For demo purposes, we'll use a mock function
        // In production, this would use the Solana SPL token transfer
        const success = await mockTokenTransfer(walletAddress, config.realmAddress, config.requiredTokens);
        
        if (success) {
            updateMessage(`
                <h2>Tribute Received</h2>
                <p>Your $9000 token tribute has been accepted.</p>
                <p>Unlocking RENTAHAL interface...</p>
            `);
            
            updateProgress(90, 'Tribute accepted. Unlocking interface...');
            
            // Simulate a loading delay before unlocking
            setTimeout(() => {
                unlockInterface();
            }, 2000);
        } else {
            updateMessage(`
                <h2>Transfer Failed</h2>
                <p>Failed to send $9000 token tribute.</p>
                <p>Please try again.</p>
            `);
            
            updateAction(`
                <button id="retry-tribute-btn" style="
                    background-color: #0f0;
                    color: #000;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-family: monospace;
                    font-weight: bold;
                    font-size: 16px;
                ">Retry Transfer</button>
            `);
            
            document.getElementById('retry-tribute-btn').addEventListener('click', () => {
                sendTribute(walletAddress);
            });
            
            updateProgress(75, 'Transfer failed. Please retry...');
        }
    } catch (error) {
        updateMessage(`
            <h2>Transfer Error</h2>
            <p>${error.message || 'An error occurred during token transfer'}</p>
        `);
        
        updateAction(`
            <button id="retry-tribute-btn" style="
                background-color: #0f0;
                color: #000;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-family: monospace;
                font-weight: bold;
                font-size: 16px;
            ">Retry Transfer</button>
        `);
        
        document.getElementById('retry-tribute-btn').addEventListener('click', () => {
            sendTribute(walletAddress);
        });
        
        updateProgress(75, 'Transfer error. Please retry...');
    }
}

// Step 6: Unlock Interface
function unlockInterface() {
    updateProgress(100, 'Access granted. Welcome to RENTAHAL.');
    
    // Show an access granted message
    updateMessage(`
        <h2>Access Granted</h2>
        <p>Welcome to RENTAHAL.</p>
        <p>The Multi-Tronic Operating Realm awaits.</p>
    `);
    
    updateAction(`
        <button id="enter-realm-btn" style="
            background-color: #0f0;
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-family: monospace;
            font-weight: bold;
            font-size: 16px;
        ">Enter the Realm</button>
    `);
    
    document.getElementById('enter-realm-btn').addEventListener('click', () => {
        // Save the authentication state in session storage
        sessionStorage.setItem('rentahal_authenticated', 'true');
        
        // Remove the gatekeeper
        const gatekeeper = document.getElementById('rentahal-gatekeeper');
        gatekeeper.style.transition = 'opacity 1s ease-out';
        gatekeeper.style.opacity = '0';
        
        setTimeout(() => {
            gatekeeper.remove();
            
            // Show the main content
            const mainContent = document.querySelector('main');
            if (mainContent) {
                mainContent.style.display = 'block';
            } else {
                // If no main tag, show everything else
                Array.from(document.body.children).forEach(child => {
                    child.style.display = '';
                });
            }
            
            // Dispatch an event that the main app can listen for
            const event = new CustomEvent('rentahal:authenticated', {
                detail: {
                    walletAddress: window.solana?.publicKey?.toString() || 'unknown',
                    timestamp: Date.now()
                }
            });
            document.dispatchEvent(event);
        }, 1000);
    });
}

// Mock function for token balance (replace with actual Solana API call)
async function getTokenBalance(walletAddress, tokenAddress) {
    // In a real implementation, this would call the Solana RPC API
    // For demo purposes, we'll return a random balance
    console.log(`Checking balance for wallet ${walletAddress} and token ${tokenAddress}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo, randomly return 0 or 1 tokens (1/3 chance of having tokens)
    return Math.random() > 0.66 ? 1 : 0;
}

// Mock function for token transfer (replace with actual Solana API call)
async function mockTokenTransfer(fromAddress, toAddress, amount) {
    console.log(`Transferring ${amount} tokens from ${fromAddress} to ${toAddress}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo, 80% chance of success
    const success = Math.random() > 0.2;
    return success;
}

// Main initialization function
function initGatekeeper() {
    console.log('Initializing RENTAHAL Gatekeeper');
    
    // Check if already authenticated
    if (sessionStorage.getItem('rentahal_authenticated') === 'true') {
        console.log('Already authenticated, skipping gatekeeper');
        return;
    }
    
    // Inject the gatekeeper UI
    injectGatekeeper();
    
    // Start the gatekeeper flow
    showSystemStatus();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initGatekeeper);

// Export for direct script usage
window.RENTAHAL_GATEKEEPER = {
    init: initGatekeeper,
    config: config
};
