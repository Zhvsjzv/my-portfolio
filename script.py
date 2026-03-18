"""
Zargham Chat - Firebase Firestore Backend
Created by: Zargham
Version: 5.0
Features: Firebase Firestore Integration
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Initialize Firebase App
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)

# Initialize Firestore client
db = firestore.client()

def send_message(sender_email, chat_text):
    """
    Add a new message to the 'messages' collection in Firestore.
    
    Args:
        sender_email (str): The email of the message sender
        chat_text (str): The text content of the message
    
    Returns:
        str: The document ID of the newly created message
    """
    try:
        # Create a new document in the 'messages' collection
        doc_ref = db.collection('messages').document()
        
        # Prepare the message data
        message_data = {
            'sender_email': sender_email,
            'chat_text': chat_text,
            'timestamp': firestore.SERVER_TIMESTAMP
        }
        
        # Add the document to Firestore
        doc_ref.set(message_data)
        
        print(f"Message sent successfully! Document ID: {doc_ref.id}")
        return doc_ref.id
    
    except Exception as e:
        print(f"Error sending message: {e}")
        return None

# Test the connection and function
if __name__ == "__main__":
    print("=" * 50)
    print("Testing Firebase Firestore Connection...")
    print("=" * 50)
    
    # Test sending a message
    test_sender = "test@example.com"
    test_message = "Hello from Firebase Firestore!"
    
    result = send_message(test_sender, test_message)
    
    if result:
        print("\n✓ Connection successful!")
        print(f"✓ Function working correctly!")
        print(f"✓ Test message added to Firestore with ID: {result}")
    else:
        print("\n✗ Connection or function test failed!")
    
    print("=" * 50)
