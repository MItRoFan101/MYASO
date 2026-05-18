import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { fetchMessages, sendMessage } from '../utils/api';
import { getOrders } from '../utils/db';
import { useNavigate } from 'react-router-dom';
import './ChatWidget.css';

const API_BASE_URL = 'http://localhost:5000';

const ChatWidget = ({ location, isOpen: externalIsOpen, onOpenChange: externalOnOpenChange }) => {
  const navigate = useNavigate();
  const pathParts = location.pathname.split('/');
  const orderIdFromUrl = pathParts[pathParts.length - 1];

  // Вычисляем orderId через useMemo (должен быть до хуков)
  const computedOrderId = useMemo(() => {
    // Приоритет: orderId из URL для страницы /order/:id
    const match = location.pathname.match(/\/order\/(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
    // Иначе проверяем localStorage
    const savedOrderId = localStorage.getItem('currentOrderId');
    return savedOrderId ? parseInt(savedOrderId) : null;
  }, [location.pathname]);

  // Если нет заказа - не показываем чат (должно быть до хуков)
  if (!computedOrderId) {
    return null;
  }

  // Используем внешний isOpen, если передан, иначе внутренний state
  // Если orderId есть в localStorage, открываем чат автоматически
  const [internalIsOpen, setInternalIsOpen] = useState(!!computedOrderId);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnOpenChange || setInternalIsOpen;
  const [messages, setMessages] = useState([]);
  const [newText, setNewText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userChats, setUserChats] = useState([]);
  const [selectedUserChat, setSelectedUserChat] = useState(null);

  // Получаем orderId и пользователя
  useEffect(() => {
    const savedOrderId = localStorage.getItem('currentOrderId');
    const user = localStorage.getItem('currentUser');
    
    console.log('ChatWidget: pathname', location.pathname);
    
    // Приоритет: orderId из URL для страницы /order/:id
    const match = location.pathname.match(/\/order\/(\d+)/);
    if (match && match[1]) {
      setCurrentOrderId(parseInt(match[1]));
    } else if (orderIdFromUrl && !isNaN(parseInt(orderIdFromUrl))) {
      setCurrentOrderId(parseInt(orderIdFromUrl));
    } else if (savedOrderId) {
      setCurrentOrderId(parseInt(savedOrderId));
    } else {
      setCurrentOrderId(null);
    }
    
    if (user) {
      setCurrentUserId(JSON.parse(user).id);
    } else {
      const tempUser = { id: Date.now(), name: 'Покупатель' };
      localStorage.setItem('currentUser', JSON.stringify(tempUser));
      setCurrentUserId(tempUser.id);
    }
  }, [location.pathname, orderIdFromUrl, navigate]);

  // Группировка заказов по пользователям
  const groupOrdersByUser = (orders) => {
    const userGroups = {};
    orders.forEach(order => {
      const userKey = `${order.customer.name}-${order.customer.phone}`;
      if (!userGroups[userKey]) {
        userGroups[userKey] = {
          name: order.customer.name,
          phone: order.customer.phone,
          orders: []
        };
      }
      userGroups[userKey].orders.push(order);
    });
    return Object.values(userGroups);
  };

  // Загрузка заказов для переключателя чатов
  useEffect(() => {
    const loadUserOrders = async () => {
      try {
        const orders = await getOrders();
        const userGroups = groupOrdersByUser(orders);
        
        // Находим текущего пользователя
        const user = localStorage.getItem('currentUser');
        if (user) {
          const userData = JSON.parse(user);
          // Ищем группу, где пользователь совпадает
          const userGroup = userGroups.find(group => 
            group.name === userData.name && group.phone === userData.phone
          );
          
          if (userGroup && userGroup.orders.length > 1) {
            setUserChats(userGroup.orders);
            // Если текущий заказ есть в списке, выберем его
            if (currentOrderId) {
              const hasCurrentOrder = userGroup.orders.some(o => o.id === currentOrderId);
              if (!hasCurrentOrder) {
                setSelectedUserChat(userGroup.orders[0].id);
              } else {
                setSelectedUserChat(currentOrderId);
              }
            } else {
              setSelectedUserChat(userGroup.orders[0].id);
            }
          } else {
            setUserChats([]);
            setSelectedUserChat(null);
          }
        }
      } catch (error) {
        console.error('Error loading user orders:', error);
      }
    };
    
    loadUserOrders();
  }, [currentOrderId]);

  // Загрузка сообщений
  useEffect(() => {
    if (!currentOrderId || !currentUserId) return;
    
    const loadMessages = async () => {
      try {
        const msgs = await fetchMessages(currentOrderId);
        setMessages(msgs);
        if (msgs.length > 0) setLastMessageId(msgs[msgs.length - 1].id);
      } catch (err) {
        setError('Ошибка загрузки сообщений');
      }
    };
    
    loadMessages();
  }, [currentOrderId, currentUserId]);

  // Polling for messages
  useEffect(() => {
    if (!currentOrderId || !currentUserId) return;
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const msgs = await fetchMessages(currentOrderId);
        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg.id !== lastMessageId) {
            setMessages(msgs);
            setLastMessageId(lastMsg.id);
            scrollToBottom();
            // Автоматически открываем чат, если пришло сообщение от продавца (admin)
            // и чат сейчас закрыт
            if (lastMsg.senderType === 'admin' && !isOpen) {
              setIsOpen(true);
            }
          }
        }
      } catch (err) {}
    }, 3000);
    return () => clearInterval(pollingIntervalRef.current);
  }, [currentOrderId, currentUserId, lastMessageId, isOpen]);

  // Polling for order status
  useEffect(() => {
    if (!currentOrderId || !currentUserId) return;
    
    const statusInterval = setInterval(async () => {
      try {
        const order = await fetchOrder(currentOrderId);
        if (order && order.status) {
          // Проверяем, изменился ли статус
          const userChatsCopy = [...userChats];
          const hasOrder = userChatsCopy.some(o => o.id === currentOrderId);
          
          if (hasOrder) {
            // Обновляем статус в списке заказов
            const updatedChats = userChatsCopy.map(o => 
              o.id === currentOrderId ? { ...o, status: order.status } : o
            );
            setUserChats(updatedChats);
            
            // Если текущий выбранный заказ изменил статус, обновляем UI
            if (selectedUserChat === currentOrderId) {
              setSelectedUserChat(currentOrderId);
            }
          }
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    }, 5000); // Проверяем статус каждые 5 секунд
    
    return () => clearInterval(statusInterval);
  }, [currentOrderId, currentUserId, userChats, selectedUserChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Предотвращаем прокрутку страницы при открытии чата
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
    if (!currentOrderId || !currentUserId) return;

    setIsSending(true);
    try {
      if (selectedFile) {
        await sendMessage(
          currentOrderId,
          currentUserId,
          'customer',
          newText.trim(),
          selectedFile
        );
      } else {
        await sendMessage(currentOrderId, currentUserId, 'customer', newText.trim());
      }
      setNewText('');
      // Используем setTimeout для гарантии, что URL будет очищен
      setTimeout(() => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
      }, 0);
      setIsSending(false);
    } catch (err) {
      setError('Ошибка отправки сообщения');
      // Принудительный сброс состояния в случае ошибки
      setTimeout(() => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
      }, 0);
      setIsSending(false);
    }
  };

  const getSenderName = (type) => type === 'admin' ? 'Продавец' : 'Вы';
  const getMessageClass = (type) => type === 'admin' ? 'message admin' : 'message customer';

  const handleSwitchUserChat = (orderId) => {
    setSelectedUserChat(orderId);
    setCurrentOrderId(orderId);
    localStorage.setItem('currentOrderId', orderId);
    setIsOpen(true);
  };

  // Если нет заказа – не показываем чат
  if (!currentOrderId) return null;

  // Рендер модального окна через портал
  return (
    <>
      {isOpen && createPortal(
        <div className="chat-widget-content">
          <div className="chat-widget-header">
            <h3>Чат с продавцом</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          {error && <div className="chat-error">{error}</div>}
          <div className="chat-widget-messages">
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
        </div>,
        document.body
      )}
    </>
  );
};

export default ChatWidget;