import React, { useState, useEffect, useRef } from 'react';
import { fetchMessages, sendMessage } from '../utils/api';
import './OrderChat.css';

const API_BASE_URL = 'http://localhost:5000';

const OrderChat = ({ orderId, currentUserId, isAdmin = false }) => {
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const currentOrderIdRef = useRef(orderId);
  
  // Загрузка сохраненного текста из localStorage
  const savedText = localStorage.getItem(`chat_text_${orderId}`);
  const [newText, setNewText] = useState(savedText || '');
  
  console.log('OrderChat: Component mounted with props:', { orderId, currentUserId, isAdmin });

  // Обновляем ref, когда orderId меняется
  useEffect(() => {
    currentOrderIdRef.current = orderId;
    console.log('OrderChat: orderId updated to:', orderId);
  }, [orderId]);

  // Загрузка сообщений
  useEffect(() => {
    console.log('OrderChat: useEffect triggered with orderId:', orderId, 'currentUserId:', currentUserId);
    
    if (!orderId || !currentUserId) {
      console.log('OrderChat: Missing orderId or currentUserId');
      return;
    }

    console.log('OrderChat: Loading messages for order:', orderId);
    const loadMessages = async () => {
      try {
        const msgs = await fetchMessages(orderId);
        console.log('OrderChat: Loaded messages:', msgs.length);
        setMessages(Array.isArray(msgs) ? msgs : []);
        if (msgs.length > 0) {
          setLastMessageId(msgs[msgs.length - 1].id);
        }
      } catch (err) {
        console.error('OrderChat: Error loading messages:', err);
        setError('Ошибка загрузки сообщений');
        setMessages([]);
      }
    };
    
    loadMessages();
  }, [orderId, currentUserId]);

  // Polling для обновления сообщений - используем ref для lastMessageId чтобы не пересоздавать эффект
  const lastMessageIdRef = useRef(lastMessageId);
  
  useEffect(() => {
    lastMessageIdRef.current = lastMessageId;
  }, [lastMessageId]);

  useEffect(() => {
    if (!orderId || !currentUserId) {
      return;
    }

    // Запускаем polling каждые 3 секунды
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const msgs = await fetchMessages(orderId);
        
        // Проверяем, есть ли новые сообщения
        if (msgs && Array.isArray(msgs) && msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          
          if (lastMsg.id !== lastMessageIdRef.current) {
            setMessages(msgs);
            setLastMessageId(lastMsg.id);
            scrollToBottom();
          }
        }
      } catch (err) {
        console.error('OrderChat: Error polling messages:', err);
      }
    }, 3000);

    // Очищаем интервал при размонтировании
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [orderId, currentUserId]);

  // Автоскролл
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Очистка localStorage при размонтировании компонента
  useEffect(() => {
    return () => {
      localStorage.removeItem(`chat_text_${orderId}`);
    };
  }, [orderId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Обработка выбора файла
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверка типа файла
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      setError('Неподдерживаемый формат файла. Используйте фото или видео.');
      return;
    }

    // Проверка размера (5MB для фото, 20MB для видео)
    const maxSize = file.type.startsWith('video') ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Файл слишком большой. Максимум 5MB для фото, 20MB для видео.');
      return;
    }

    // Создание превью
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
    setError(null);
  };

  // Удаление файла
  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // Отправка сообщения
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (isSending) return; // Предотвращаем повторную отправку
    
    if (!newText.trim() && !selectedFile) {
      return;
    }

    if (!orderId || !currentUserId) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      console.log('OrderChat: Sending message for order:', orderId);
      
      // Сохраняем текущие значения для использования в async
      const currentFile = selectedFile;
      const currentText = newText.trim();
      
      if (currentFile) {
        await sendMessage(
          orderId,
          currentUserId,
          isAdmin ? 'admin' : 'customer',
          currentText,
          currentFile
        );
      } else {
        await sendMessage(
          orderId,
          currentUserId,
          isAdmin ? 'admin' : 'customer',
          currentText
        );
      }
      
      // Очистка - сохраняем текст в localStorage для восстановления после перезагрузки
      if (currentText) {
        localStorage.setItem(`chat_text_${orderId}`, currentText);
      } else {
        localStorage.removeItem(`chat_text_${orderId}`);
      }
      
      // Очистка состояния - принудительный сброс
      setNewText('');
      // Используем setTimeout для гарантии, что URL будет очищен
      setTimeout(() => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
      }, 0);
    } catch (err) {
      console.error('OrderChat: Error sending message:', err);
      setError('Ошибка отправки сообщения');
      // Принудительный сброс состояния в случае ошибки
      setTimeout(() => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
      }, 0);
    } finally {
      // Гарантированный сброс isSending
      setIsSending(false);
    }
  };

  // Получение имени отправителя
  const getSenderName = (senderType) => {
    return senderType === 'admin' ? 'Продавец' : 'Вы';
  };

  // Получение класса для сообщения
  const getMessageClass = (senderType) => {
    return senderType === 'admin' ? 'message admin' : 'message customer';
  };

  console.log('OrderChat: Rendering with messages.length:', messages?.length, 'error:', error);

  return (
    <div className="order-chat">
      {error && (
        <div className="chat-error">
          <p>{error}</p>
        </div>
      )}

      <div className="chat-messages">
        {!Array.isArray(messages) || messages.length === 0 ? (
          <div className="empty-chat">
            <p>Нет сообщений. Начните диалог!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={getMessageClass(message.senderType)}>
              <div className="message-header">
                <span className="sender-name">{getSenderName(message.senderType)}</span>
                <span className="message-time">
                  {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              {message.text && (
                <div className="message-text">{message.text}</div>
              )}
              
              {message.mediaUrl && message.mediaType && (
                <div className="message-media">
                  {message.mediaType === 'image' ? (
                    <div className="media-container">
                      <img 
                        src={`${API_BASE_URL}${message.mediaUrl}`} 
                        alt="Media" 
                        className="media-image"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(`${API_BASE_URL}${message.mediaUrl}`, '_blank');
                        }}
                      />
                    </div>
                  ) : (
                    <div className="media-container">
                      <video 
                        controls 
                        className="media-video"
                        src={`${API_BASE_URL}${message.mediaUrl}`}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода - всегда видно */}
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="input-group">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Введите сообщение..."
            disabled={isSending}
          />
          
          <button 
            type="submit" 
            className="send-btn"
            disabled={!newText.trim() && !selectedFile || isSending}
          >
            {isSending ? '...' : '➤'}
          </button>
        </div>
        
        {/* Кнопка для выбора файла - всегда видна */}
        <div className="file-input-wrapper">
          <input
            type="file"
            id="fileInput"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <label htmlFor="fileInput" className="file-btn">
            📎 Выбрать файл
          </label>
          
          {previewUrl && (
            <div className="file-preview">
              <img src={previewUrl} alt="Preview" />
              <button type="button" className="remove-file-btn" onClick={handleRemoveFile}>
                ✕
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default OrderChat;