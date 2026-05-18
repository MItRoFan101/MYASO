import React, { useState, useEffect } from 'react';
import { fetchUserOrders, fetchMessages } from '../utils/api';
import OrderChat from './OrderChat';
import './UserOrdersWidget.css';
import { useNavigate } from 'react-router-dom';

const UserOrdersWidget = ({ currentUserId, isOpen: externalIsOpen, onOpenChange: externalOnOpenChange }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnOpenChange || setInternalIsOpen;

  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    const loadOrders = async () => {
      try {
        console.log('Loading orders for user:', currentUserId);
        const userOrders = await fetchUserOrders(currentUserId);
        console.log('User orders:', userOrders);
        setOrders(userOrders);
      } catch (err) {
        console.error('Error loading orders:', err);
        setError('Ошибка загрузки заказов');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [currentUserId]);

  const handleOrderClick = async (orderId) => {
    try {
      console.log('Loading messages for order:', orderId);
      const messages = await fetchMessages(orderId);
      setSelectedOrder({
        ...orders.find(o => o.id === orderId),
        messages
      });
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Ошибка загрузки сообщений');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'В обработке';
      case 'completed':
        return 'Выполнен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const handleOpenChat = (orderId) => {
    // Сохраняем orderId в localStorage для ChatWidget
    localStorage.setItem('currentOrderId', orderId);
    setIsOpen(true);
  };

  if (isLoading) {
    return (
      <div className={`user-orders-widget ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="widget-header">
          <h2>📋 Мои заказы</h2>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-orders-widget">
        <div className="widget-header">
          <h2>📋 Мои заказы</h2>
        </div>
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="user-orders-widget">
        <div className="widget-header">
          <h2>📋 Мои заказы</h2>
        </div>
        <div className="empty-orders">
          <p>У вас пока нет заказов</p>
          <p>Добавьте товары в корзину и оформите заказ!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-orders-widget">
      <div className="widget-header">
        <h2>📋 Мои заказы</h2>
        <div className="widget-header-actions">
          <span className="orders-count">{orders.length}</span>
          <button 
            className="collapse-btn" 
            onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
            title={isCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="orders-list">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`order-item ${selectedOrder?.id === order.id ? 'selected' : ''}`}
            onClick={() => handleOrderClick(order.id)}
          >
            <div className="order-header">
              <span className="order-number">Заказ #{order.id}</span>
              <span className={`order-status order-${order.status}`}>
                {getStatusIcon(order.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Modal for order details and chat */}
      {selectedOrder && (
        <div className="order-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Заказ #{selectedOrder.id}</h2>
              <button className="close-modal-btn" onClick={() => setSelectedOrder(null)}>
                ✕
              </button>
            </div>

            <div className="modal-content">
              {/* Order Details */}
              <div className="order-details">
                <h3>Детали заказа</h3>
                <div className="order-info-grid">
                  <div className="order-info-item">
                    <span className="info-label">Статус:</span>
                    <span className={`order-status order-${selectedOrder.status}`}>
                      {getStatusIcon(selectedOrder.status)} {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  
                  <div className="order-info-item">
                    <span className="info-label">Дата создания:</span>
                    <span className="info-value">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('ru-RU', {
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
                      {selectedOrder.customer.deliveryType === 'pickup' ? '🚗 Самовывоз' : '🚚 Доставка'}
                    </span>
                  </div>

                  <div className="order-info-item">
                    <span className="info-label">Итого:</span>
                    <span className="info-value total-price">{selectedOrder.total} ₽</span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="contact-section">
                  <h3>👤 Контактная информация</h3>
                  <div className="contact-info">
                    <div className="contact-item">
                      <span className="contact-label">Имя:</span>
                      <span className="contact-value">{selectedOrder.customer.name}</span>
                    </div>
                    <div className="contact-item">
                      <span className="contact-label">Телефон:</span>
                      <span className="contact-value">{selectedOrder.customer.phone}</span>
                    </div>
                    {selectedOrder.customer.address && (
                      <div className="contact-item">
                        <span className="contact-label">Адрес:</span>
                        <span className="contact-value">{selectedOrder.customer.address}</span>
                      </div>
                    )}
                    {selectedOrder.customer.comment && (
                      <div className="contact-item">
                        <span className="contact-label">Комментарий:</span>
                        <span className="contact-value">{selectedOrder.customer.comment}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="items-section">
                  <h3>📦 Товары в заказе</h3>
                  <div className="items-list">
                    {selectedOrder.items.map((item, index) => (
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

              {/* Chat Section */}
              <div className="chat-section">
                <OrderChat 
                  orderId={selectedOrder.id}
                  currentUserId={currentUserId}
                  isAdmin={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOrdersWidget;