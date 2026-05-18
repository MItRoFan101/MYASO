import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchMessages, sendMessage, deleteMessage } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import './ChatWidget.css';

const API_BASE_URL = 'http://localhost:5000';

const AdminChatWidget = ({ orderId, currentUserId, isAdmin = true, isOpen: parentIsOpen, onOpenChange, userChats = [], selectedUserChat = null, onOrderChange }) => {
  const navigate = useNavigate();
  const pathParts = window.location.pathname.split('/');
  const orderIdFromUrl = pathParts[pathParts.length - 1];

  const computedOrderId = useMemo(() => {
    if (orderId) return orderId;
    const match = window.location.pathname.match(/\/admin\/order\/(\d+)/);
    if (match && match[1]) return parseInt(match[1]);
    const savedOrderId = localStorage.getItem('currentOrderId');
    return savedOrderId ? parseInt(savedOrderId) : null;
  }, [orderId, window.location.pathname]);

  if (!computedOrderId) return null;

  const [isOpen, setIsOpen] = useState(parentIsOpen || false);
  const [messages, setMessages] = useState([]);
  const [newText, setNewText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserIdState, setCurrentUserIdState] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    if (parentIsOpen !== undefined) {
      setIsOpen(parentIsOpen);
    }
  }, [parentIsOpen]);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUserIdState(JSON.parse(user).id);
    } else {
      const tempUser = { id: 1, name: 'Администратор' };
      localStorage.setItem('currentUser', JSON.stringify(tempUser));
      setCurrentUserIdState(tempUser.id);
    }
  }, []);

  useEffect(() => {
    if (!computedOrderId || !currentUserIdState) return;
    
    const loadMessages = async () => {
      try {
        const msgs = await fetchMessages(computedOrderId);
        setMessages(msgs);
        if (msgs.length > 0) setLastMessageId(msgs[msgs.length - 1].id);
      } catch (err) {
        setError('Ошибка загрузки сообщений');
      }
    };
    
    loadMessages();
  }, [computedOrderId, currentUserIdState]);

  const lastMessageIdRef = useRef(lastMessageId);
  
  useEffect(() => {
    lastMessageIdRef.current = lastMessageId;
  }, [lastMessageId]);

  useEffect(() => {
    if (!computedOrderId || !currentUserIdState) return;
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const msgs = await fetchMessages(computedOrderId);
        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg.id !== lastMessageIdRef.current) {
            setMessages(msgs);
            setLastMessageId(lastMsg.id);
            scrollToBottom();
            if (lastMsg.senderType === 'customer' && !isOpen) {
              setIsOpen(true);
            }
          }
        }
      } catch (err) {}
    }, 3000);
    return () => clearInterval(pollingIntervalRef.current);
  }, [computedOrderId, currentUserIdState, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  };

  const handleScroll = (e) => {
    const container = messagesContainerRef.current;
    if (container) {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const percentage = scrollTop / (scrollHeight - clientHeight);
      setScrollPosition(percentage);
    }
  };

  const handleSliderChange = (e) => {
    const container = messagesContainerRef.current;
    if (container) {
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const newScrollTop = e.target.value * (scrollHeight - clientHeight);
      container.scrollTop = newScrollTop;
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartScroll(messagesContainerRef.current?.scrollTop || 0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    const container = messagesContainerRef.current;
    if (container) {
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const maxScroll = scrollHeight - clientHeight;
      const newScrollTop = startScroll + deltaY;
      container.scrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      setError('Неподдерживаемый формат');
      return;
    }
    const maxSize = file.type.startsWith('video') ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Файл слишком большой');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
    setError(null);
  };

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newText.trim() && !selectedFile) return;
    if (!computedOrderId || !currentUserIdState) return;

    setIsSending(true);
    try {
      if (selectedFile) {
        await sendMessage(computedOrderId, currentUserIdState, 'admin', newText.trim(), selectedFile);
      } else {
        await sendMessage(computedOrderId, currentUserIdState, 'admin', newText.trim());
      }
      setNewText('');
      setTimeout(() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
      }, 0);
      setIsSending(false);
    } catch (err) {
      setError('Ошибка отправки сообщения');
      setTimeout(() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
      }, 0);
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onOpenChange) onOpenChange(false);
  };

  const handleSwitchUserChat = (orderId) => {
    if (onOrderChange) onOrderChange(orderId);
    if (onOpenChange) onOpenChange(true);
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Удалить это сообщение?')) {
      try {
        await deleteMessage(computedOrderId, messageId);
        // Обновляем список сообщений
        const msgs = await fetchMessages(computedOrderId);
        setMessages(msgs);
      } catch (err) {
        console.error('Error deleting message:', err);
        alert('Ошибка при удалении сообщения');
      }
    }
  };

  const getSenderName = (type) => type === 'admin' ? 'Продавец' : 'Вы';
  const getMessageClass = (type) => type === 'admin' ? 'message admin' : 'message customer';

  if (!computedOrderId) return null;

  return (
    <div className="chat-widget-content">
      <div className="chat-widget-header">
        <h3>Чат с заказом #{computedOrderId}</h3>
        <button className="close-btn" onClick={handleClose}>✕</button>
      </div>
      {error && <div className="chat-error">{error}</div>}
      <div 
        className="chat-widget-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>👋 Привет! Чем могу помочь?</p>
            <p style={{fontSize: '11px', color: '#999'}}>Напишите сообщение или прикрепите фото/видео</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={getMessageClass(msg.senderType)}>
              <div className="message-header">
                <span className="sender-name">{getSenderName(msg.senderType)}</span>
                <span className="message-time">{new Date(msg.createdAt).toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit'})}</span>
                {msg.senderType === 'admin' && (
                  <button 
                    className="delete-message-btn" 
                    onClick={() => handleDeleteMessage(msg.id)}
                    title="Удалить сообщение"
                  >
                    🗑️
                  </button>
                )}
              </div>
              {msg.text && <div className="message-text">{msg.text}</div>}
              {msg.mediaUrl && msg.mediaType === 'image' && (
                <img 
                  src={`${API_BASE_URL}${msg.mediaUrl}`} 
                  style={{maxWidth:'200px', cursor:'pointer'}} 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(`${API_BASE_URL}${msg.mediaUrl}`, '_blank');
                  }} 
                  alt="" 
                />
              )}
              {msg.mediaUrl && msg.mediaType === 'video' && (
                <video controls src={`${API_BASE_URL}${msg.mediaUrl}`} style={{maxWidth:'200px'}} />
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Slider control */}
      <div className="chat-controls">
        <div className="slider-container">
          <input 
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={scrollPosition}
            onChange={handleSliderChange}
            className="slider-input"
          />
        </div>
      </div>
      
      <form className="chat-widget-input-form" onSubmit={handleSendMessage}>
        <div className="input-group">
          <input 
            type="text" 
            value={newText} 
            onChange={(e) => setNewText(e.target.value)} 
            placeholder="Напишите сообщение..." 
            disabled={isSending}
          />
          <button type="submit" className="send-btn" disabled={(!newText.trim() && !selectedFile) || isSending}>{isSending ? '...' : '➤'}</button>
        </div>
        <div className="file-input-wrapper">
          <input type="file" id="fileInput" accept="image/*,video/*" onChange={handleFileSelect} style={{display:'none'}} />
          <label htmlFor="fileInput" className="file-btn">📎 Фото/Видео</label>
          {previewUrl && (
            <div className="file-preview">
              <img src={previewUrl} alt="Preview" />
              <button type="button" className="remove-file-btn" onClick={handleRemoveFile}>✕</button>
            </div>
          )}
        </div>
      </form>

      {/* Переключатель чатов одного пользователя */}
      {userChats.length > 1 && (
        <div className="user-chat-switcher">
          <div className="switcher-header">
            <h4>💬 Чаты пользователя: {userChats[0].customer.name}</h4>
            <button onClick={() => { setUserChats([]); setSelectedUserChat(null); }} className="close-switcher-btn">
              ✕
            </button>
          </div>
          <div className="switcher-list">
            {userChats.map((order) => (
              <button
                key={order.id}
                onClick={() => handleSwitchUserChat(order.id)}
                className={`switcher-item ${selectedUserChat === order.id ? 'active' : ''}`}
              >
                <span>Заказ #{order.id}</span>
                <span className="order-status order-${order.status}">
                  {order.status === 'pending' && '⏳ В обработке'}
                  {order.status === 'completed' && '✅ Выполнен'}
                  {order.status === 'cancelled' && '❌ Отменен'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatWidget;
