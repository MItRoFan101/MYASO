import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOrder, fetchMessages, sendMessage } from '../utils/api';
import OrderChat from '../components/OrderChat';
import './Order.css';

const Order = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Order ID from URL:', orderId);
    
    // Получаем текущего пользователя из localStorage
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUserId(JSON.parse(user).id);
    }

    // Проверяем, является ли пользователь администратором
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    setIsAdmin(adminLoggedIn);

    // Загружаем заказ через API
    const loadOrder = async () => {
      try {
        const orderData = await fetchOrder(orderId);
        console.log('Order data:', orderData);
        setOrder(orderData);
      } catch (error) {
        console.error('Error loading order:', error);
        // Заказ не найден - сразу перенаправляем на главную
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId, navigate]);

  const handleSendMessage = (orderId, senderId, senderType, text) => {
    sendMessage(orderId, senderId, senderType, text);
  };

  if (isLoading) {
    return (
      <div className="order-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка заказа...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    // Заказ не найден - сразу перенаправляем на главную
    return null;
  }

  return (
    <div className="order-page">
      <div className="order-container">
        {/* === ДЕТАЛИ ЗАКАЗА === */}
        <div className="order-details">
          <h1>📋 Детали заказа #{order.id}</h1>
          
          <div className="order-info-grid">
            <div className="order-info-item">
              <span className="info-label">Статус:</span>
              <span className={`order-status order-${order.status}`}>
                {order.status === 'pending' && '⏳ В обработке'}
                {order.status === 'completed' && '✅ Выполнен'}
                {order.status === 'cancelled' && '❌ Отменен'}
              </span>
            </div>
            
            <div className="order-info-item">
              <span className="info-label">Дата создания:</span>
              <span className="info-value">
                {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            <div className="order-info-item">
              <span className="info-label">Тип доставки:</span>
              <span className="info-value">
                {order.customer.deliveryType === 'pickup' ? '🚗 Самовывоз' : '🚚 Доставка'}
              </span>
            </div>

            <div className="order-info-item">
              <span className="info-label">Итого:</span>
              <span className="info-value total-price">{order.total} ₽</span>
            </div>
          </div>

          {/* === КОНТАКТНАЯ ИНФОРМАЦИЯ === */}
          <div className="contact-section">
            <h2>👤 Контактная информация</h2>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-label">Имя:</span>
                <span className="contact-value">{order.customer.name}</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Телефон:</span>
                <span className="contact-value">{order.customer.phone}</span>
              </div>
              {order.customer.address && (
                <div className="contact-item">
                  <span className="contact-label">Адрес:</span>
                  <span className="contact-value">{order.customer.address}</span>
                </div>
              )}
              {order.customer.comment && (
                <div className="contact-item">
                  <span className="contact-label">Комментарий:</span>
                  <span className="contact-value">{order.customer.comment}</span>
                </div>
              )}
            </div>
          </div>

          {/* === ТОВАРЫ В ЗАКАЗЕ === */}
          <div className="items-section">
            <h2>📦 Товары в заказе</h2>
            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p>Количество: {item.quantity} шт.</p>
                    <p>Цена: {item.price} ₽</p>
                  </div>
                  <div className="item-total">
                    {item.price * item.quantity} ₽
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === ЧАТ С ПРОДАВЦОМ === */}
        <div className="chat-section">
          <OrderChat
            orderId={order.id}
            currentUserId={currentUserId || 'guest'}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
};

export default Order;
