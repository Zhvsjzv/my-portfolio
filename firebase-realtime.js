// ========================================
// Firebase Real-time Messages Listener
// ========================================

// Import Firebase SDK modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase Configuration
// Get these values from Firebase Console > Project Settings > Your apps
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "zargham-2887f.firebaseapp.com",
    projectId: "zargham-2887f",
    storageBucket: "zargham-2887f.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Reference to the chat-box div
const chatBox = document.getElementById('chat-box');

/**
 * Format timestamp for display
 * @param {Object} timestamp - Firestore timestamp object
 * @returns {String} Formatted time string
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now - date;
    
    // If less than 1 minute
    if (diff < 60000) return 'Just now';
    
    // If less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // If today
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // Otherwise show date and time
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Create HTML element for a message
 * @param {Object} messageData - Message data from Firestore
 * @returns {HTMLElement} Message div element
 */
function displayMessage(messageData) {
    // Create message container
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    // Create sender element
    const senderDiv = document.createElement('div');
    senderDiv.className = 'message-sender';
    senderDiv.textContent = messageData.sender_email || 'Anonymous';
    
    // Create text element
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = messageData.chat_text || '';
    
    // Create timestamp element
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = formatTimestamp(messageData.timestamp);
    
    // Append all elements to message container
    messageDiv.appendChild(senderDiv);
    messageDiv.appendChild(textDiv);
    messageDiv.appendChild(timeDiv);
    
    return messageDiv;
}

/**
 * Initialize real-time message listener
 */
function initRealtimeMessages() {
    try {
        // Create a query to get messages ordered by timestamp (ascending)
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        // Listen to real-time updates using onSnapshot
        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                // Clear the chat box first
                chatBox.innerHTML = '';
                
                // Check if there are any messages
                if (snapshot.empty) {
                    chatBox.innerHTML = `
                        <div class="empty-state">
                            <i>💬</i>
                            <p>No messages yet. Be the first to send one!</p>
                        </div>
                    `;
                    return;
                }
                
                // Loop through each document and display it
                snapshot.forEach((doc) => {
                    const messageData = doc.data();
                    const messageElement = displayMessage(messageData);
                    chatBox.appendChild(messageElement);
                });
                
                // Auto-scroll to bottom to show latest messages
                chatBox.scrollTop = chatBox.scrollHeight;
                
                console.log(`✓ Loaded ${snapshot.size} message(s)`);
            },
            (error) => {
                console.error('Error fetching messages:', error);
                chatBox.innerHTML = `
                    <div class="empty-state">
                        <p style="color: red;">Error loading messages: ${error.message}</p>
                    </div>
                `;
            }
        );
        
        // Optional: Return unsubscribe function for cleanup
        return unsubscribe;
        
    } catch (error) {
        console.error('Error setting up real-time listener:', error);
        chatBox.innerHTML = `
            <div class="empty-state">
                <p style="color: red;">Error: ${error.message}</p>
            </div>
        `;
    }
}

// Initialize the real-time listener when the page loads
initRealtimeMessages();
