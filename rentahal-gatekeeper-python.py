# RENTAHAL Token Gatekeeper - Python Integration for webgui.py
# Add this code to your existing webgui.py to support the gatekeeper

from fastapi import APIRouter, Request
import time
import random
import json
from typing import Dict, Any, Optional

# Create a new router for gatekeeper functionality
gatekeeper_router = APIRouter()

# In-memory cache for system stats
system_stats = {
    "lastUpdated": time.time(),
    "activeNodes": 3,
    "queueDepth": 0,
    "avgLatency": 2.4,
    "status": "System online. Cortex status nominal. Tribute required for access."
}

# Wallet verification in-memory cache (would be a database in production)
wallet_verifications = {}

@gatekeeper_router.get("/api/sysop/stats")
async def get_system_stats():
    """
    Return current system stats for the gatekeeper initial screen
    """
    global system_stats
    
    # Update queue depth randomly to simulate activity
    if random.random() > 0.7:
        system_stats["queueDepth"] = random.randint(0, 5)
    
    # Randomize latency slightly
    latency_variation = random.uniform(-0.5, 0.5)
    system_stats["avgLatency"] = max(0.1, 2.4 + latency_variation)
    
    # Update timestamp
    system_stats["lastUpdated"] = time.time()
    
    return system_stats

@gatekeeper_router.post("/api/wallet/verify")
async def verify_wallet(request: Request):
    """
    Register a wallet verification attempt
    """
    try:
        data = await request.json()
        wallet_address = data.get("walletAddress")
        
        if not wallet_address:
            return {"success": False, "message": "Wallet address is required"}
        
        # Generate a verification ID
        verification_id = f"verify_{int(time.time())}_{random.randint(1000, 9999)}"
        
        # Store verification data
        wallet_verifications[verification_id] = {
            "walletAddress": wallet_address,
            "timestamp": time.time(),
            "status": "pending",
            "tributePaid": False
        }
        
        return {
            "success": True, 
            "verificationId": verification_id,
            "message": "Verification initiated"
        }
    except Exception as e:
        return {"success": False, "message": f"Error: {str(e)}"}

@gatekeeper_router.get("/api/wallet/status/{verification_id}")
async def wallet_status(verification_id: str):
    """
    Check status of a wallet verification
    """
    if verification_id not in wallet_verifications:
        return {"success": False, "message": "Verification ID not found"}
    
    verification = wallet_verifications[verification_id]
    
    # For demo purposes, randomly mark some verifications as paid after a delay
    if (verification["status"] == "pending" and 
        time.time() - verification["timestamp"] > 5 and
        random.random() > 0.6):
        verification["status"] = "verified"
        verification["tributePaid"] = True
    
    return {
        "success": True,
        "status": verification["status"],
        "tributePaid": verification["tributePaid"],
        "walletAddress": verification["walletAddress"]
    }

@gatekeeper_router.post("/api/tribute/confirm")
async def confirm_tribute(request: Request):
    """
    Mark a tribute as paid (this would verify with blockchain in production)
    """
    try:
        data = await request.json()
        verification_id = data.get("verificationId")
        transaction_hash = data.get("transactionHash", "mock_tx_hash")
        
        if verification_id not in wallet_verifications:
            return {"success": False, "message": "Verification ID not found"}
        
        # In production, this would verify the transaction on chain
        # For demo, we'll accept it
        wallet_verifications[verification_id]["status"] = "verified"
        wallet_verifications[verification_id]["tributePaid"] = True
        wallet_verifications[verification_id]["transactionHash"] = transaction_hash
        
        return {
            "success": True,
            "message": "Tribute confirmed",
            "verificationId": verification_id
        }
    except Exception as e:
        return {"success": False, "message": f"Error: {str(e)}"}

# Add middleware to check for tribute token before serving main pages
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
import base64

class GatekeeperMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip API endpoints
        if request.url.path.startswith("/api/") or request.url.path.startswith("/ws"):
            return await call_next(request)
            
        # Skip static files
        if request.url.path.startswith("/static/"):
            return await call_next(request)
            
        # Check for authentication token in cookies
        auth_cookie = request.cookies.get("rentahal_authenticated")
        
        # If authenticated, proceed normally
        if auth_cookie == "true":
            return await call_next(request)
            
        # Otherwise, inject the gatekeeper
        response = await call_next(request)
        
        # Only modify HTML responses
        if response.headers.get("content-type", "").startswith("text/html"):
            content = b""
            async for chunk in response.body_iterator:
                content += chunk
                
            # Decode the content
            html_content = content.decode("utf-8")
            
            # Inject our gatekeeper script
            gatekeeper_script = """
            <script src="/static/gatekeeper.js"></script>
            """
            
            # Insert script before closing body tag
            modified_html = html_content.replace("</body>", f"{gatekeeper_script}</body>")
            
            # Create new response with modified content
            return Response(
                content=modified_html, 
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )
            
        return response

# Function to integrate with your existing FastAPI app
def integrate_gatekeeper(app):
    """
    Integrate the gatekeeper functionality with your existing FastAPI app
    """
    # Add the gatekeeper router
    app.include_router(gatekeeper_router)
    
    # Add the gatekeeper middleware
    app.add_middleware(GatekeeperMiddleware)
    
    # Serve the gatekeeper JavaScript file
    app.mount("/static", StaticFiles(directory="static"), name="static")
    
    # Create the static directory if it doesn't exist
    import os
    os.makedirs("static", exist_ok=True)
    
    # Write the gatekeeper.js file to the static directory
    with open("static/gatekeeper.js", "w") as f:
        f