# 🚀 Zargham Chat - Advanced Messaging Platform

**Created by: Zargham**  
**Version: 2.0**

## ✨ Features

### 💬 Messaging Features (WhatsApp + Telegram Combined)
- ✅ Real-time messaging with WebSocket
- ✅ Message reactions (❤️, 👍, 😂, and more)
- ✅ Message editing
- ✅ Message deletion
- ✅ Typing indicators
- ✅ Read receipts (seen status)
- ✅ Message history
- ✅ System notifications (user joined/left)
- ✅ Emoji picker with 200+ emojis
- ✅ File sharing support

### 👥 User Features
- ✅ Custom usernames
- ✅ Avatar selection (8 default avatars)
- ✅ Online/Offline status
- ✅ User list with status indicators
- ✅ Last seen timestamps
- ✅ Active users count

### 🎨 UI/UX Features
- ✅ Modern, sleek design
- ✅ Dark/Light theme toggle
- ✅ Smooth animations
- ✅ Responsive layout
- ✅ WhatsApp-inspired chat bubbles
- ✅ Telegram-inspired sidebar
- ✅ Message timestamps
- ✅ Context menu (right-click on messages)
- ✅ Sound notifications
- ✅ Auto-scrolling to latest message
- ✅ Auto-resizing input textarea
- ✅ Beautiful gradient backgrounds

### 🛠️ Technical Features
- ✅ FastAPI backend
- ✅ WebSocket for real-time communication
- ✅ RESTful API for file uploads
- ✅ In-memory message storage
- ✅ Connection manager for user tracking
- ✅ Automatic reconnection
- ✅ Error handling

## 🚀 Installation

### Prerequisites
- Python 3.8 or higher

### Setup

1. Install dependencies:
```bash
py -m pip install -r requirements.txt
```

2. Run the server:
```bash
py script.py
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

## 📖 Usage

### Starting a Chat

1. Enter your name
2. Select an avatar
3. Click "Start Chatting"
4. Begin messaging!

### Features in Action

- **Send Messages**: Type in the input box and press Enter or click Send
- **Add Reactions**: Right-click on any message and choose a reaction
- **Delete Messages**: Right-click on your own messages and select Delete
- **Toggle Theme**: Click the moon/sun icon in the header
- **Share Files**: Click the paperclip icon to upload files
- **Use Emojis**: Click the emoji button next to the input
- **See Who's Online**: Check the sidebar for active users

## 🎯 Features Comparison

### WhatsApp Features
- ✅ Message bubbles with sender info
- ✅ Read receipts (blue checkmarks)
- ✅ Typing indicators
- ✅ Last seen status
- ✅ File sharing
- ✅ Emoji support

### Telegram Features
- ✅ Message reactions
- ✅ Message editing
- ✅ Message deletion
- ✅ User avatars
- ✅ Modern UI
- ✅ Smooth animations

## 🔧 Technical Architecture

### Backend (Python + FastAPI)
- **WebSocket Endpoint**: `/ws/{user_id}` - Real-time communication
- **REST API**: `/api/upload` - File uploads
- **Static Files**: `/uploads/{filename}` - Serve uploaded files
- **Main Page**: `/` - Serve HTML interface

### Frontend (HTML + CSS + JavaScript)
- **Vanilla JavaScript**: No frameworks required
- **CSS Variables**: Easy theme customization
- **WebSocket Client**: Real-time messaging
- **Font Awesome Icons**: Professional iconography

### Data Flow
1. User connects via WebSocket
2. Server assigns user ID and stores connection
3. Messages broadcast to all connected users
4. Real-time updates for reactions, deletions, etc.

## 🎨 Customization

### Change Colors
Edit CSS variables in the `:root` selector:
```css
--primary-color: #0088cc;
--secondary-color: #25d366;
```

### Add More Avatars
Add to the avatar selector in `index.html`:
```html
<div class="avatar-option" data-avatar="🎯">🎯</div>
```

### Add More Emojis
Add to the `emojis` array in JavaScript:
```javascript
const emojis = ['😀', '😃', ... ];
```

## 📝 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User authentication
- [ ] Private messaging
- [ ] Group chats
- [ ] Voice/Video calling
- [ ] Media preview
- [ ] Message search
- [ ] User profiles
- [ ] Chat backups
- [ ] Mobile app

## 👨‍💻 Creator

**Zargham**
- Advanced Messaging Platform
- Telegram + WhatsApp Features Combined
- Modern, Sleek Design
- Real-time Communication

## 📄 License

Created by Zargham - Free to use and modify

## 🙏 Credits

- **Creator**: Zargham
- **Framework**: FastAPI
- **Icons**: Font Awesome
- **Inspiration**: WhatsApp & Telegram

---

**Enjoy chatting with Zargham Chat! 💬**
