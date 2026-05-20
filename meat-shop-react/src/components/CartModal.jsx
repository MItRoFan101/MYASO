import React, { useState, useEffect } from 'react';
import { getProducts, getOrderById } from '../utils/db';
import { createOrder } from '../utils/api';
import './CartModal.css';

const CartModal = ({ isOpen, onClose, cart, onAddToCart, onUpdateCart, navigate }) => {
  const [deliveryType, setDeliveryType] = useState('pickup'); // 'pickup' or 'delivery'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerComment, setCustomerComment] = useState('');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDeliveryType('pickup');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerComment('');
    }
  }, [isOpen]);

  const handleQuantityChange = (index, delta) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    onUpdateCart(newCart);
  };

  const handleRemoveFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    onUpdateCart(newCart);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Корзина пуста!');
      return;
    }
    if (!customerName || !customerPhone) {
      alert('Пожалуйста, заполните имя и телефон');
      return;
    }
    if (deliveryType === 'delivery' && !customerAddress) {
      alert('Пожалуйста, укажите адрес доставки');
      return;
    }
    // Получаем текущего пользователя из localStorage
    const currentUser = localStorage.getItem('currentUser');
    const userId = currentUser ? JSON.parse(currentUser).id : 1;
    
    const order = {
      id: Date.now(),
      customer: { 
        id: userId,
        name: customerName, 
        phone: customerPhone, 
        address: customerAddress, 
        comment: customerComment,
        deliveryType: deliveryType
      },
      items: cart,
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    };
    console.log('Новый заказ:', order);
    console.log('Order ID:', order.id);
    
    // Отправляем заказ на сервер
    try {
      const savedOrder = await createOrder(order);
      console.log('Order saved on server:', savedOrder);
      
      // Сохраняем orderId в localStorage для виджета чата
      localStorage.setItem('currentOrderId', savedOrder.id.toString());
      console.log('Saved currentOrderId to localStorage:', savedOrder.id);
      
      // Показываем уведомление о заказе
      alert(`${customerName}, ваш заказ на сумму ${order.total} ₽ принят! Мы скоро свяжемся с вами.`);
      // Показываем всплывающее уведомление
      showOrderNotification();
      onUpdateCart([]);
      onClose();
      // Перенаправляем на страницу заказа
      navigate(`/order/${savedOrder.id}`);
      console.log('Order placed successfully, redirecting to order page');
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Ошибка при оформлении заказа. Пожалуйста, попробуйте снова.');
    }
  };
  
  // Функция для показа уведомления
  const showOrderNotification = () => {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 2000;
      font-family: 'Open Sans', sans-serif;
      font-size: 14px;
      animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">✅</span>
        <div>
          <div style="font-weight: 600; margin-bottom: 2px;">Заказ оформлен!</div>
          <div style="font-size: 12px; opacity: 0.9;">С вами скоро свяжется продавец</div>
        </div>
      </div>
    `;
    
    // Добавляем стили анимации
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 5 секунд
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className={`cart-modal ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="cart-content" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>🛒 Корзина</h2>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>
        <div className="cart-items">
          {cart.length === 0 ? (
            <p>Корзина пуста</p>
          ) : (
              cart.map((item, index) => (
                <div key={index} className="cart-item">
                  <span>{item.name} — {item.weight} г — {item.price * item.quantity} ₽</span>
                  <div className="quantity-controls">
                    <button onClick={() => handleQuantityChange(index, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(index, 1)}>+</button>
                  </div>
                  <button onClick={() => handleRemoveFromCart(index)}>Удалить</button>
                </div>
              ))
          )}
        </div>
        <div className="cart-footer">
          <div className="cart-total">Итого: <span>{total}</span> ₽</div>
          
          {/* Выбор типа доставки */}
          <div className="delivery-type-selector">
            <label className={`delivery-option ${deliveryType === 'pickup' ? 'active' : ''}`}>
              <input
                type="radio"
                name="deliveryType"
                value="pickup"
                checked={deliveryType === 'pickup'}
                onChange={() => setDeliveryType('pickup')}
              />
              <span>🚗 Самовывоз</span>
            </label>
            <label className={`delivery-option ${deliveryType === 'delivery' ? 'active' : ''}`}>
              <input
                type="radio"
                name="deliveryType"
                value="delivery"
                checked={deliveryType === 'delivery'}
                onChange={() => setDeliveryType('delivery')}
              />
              <span>🚚 Доставка</span>
            </label>
          </div>

          <form className="checkout-form" onSubmit={handleCheckout}>
            <input
              type="text"
              id="customer-name"
              placeholder="Ваше имя *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <input
              type="tel"
              id="customer-phone"
              placeholder="Ваш телефон *"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
            {deliveryType === 'delivery' && (
              <input
                type="text"
                id="customer-address"
                placeholder="Адрес доставки *"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                required
              />
            )}
            <textarea
              id="customer-comment"
              placeholder="Комментарий к заказу (необязательно)"
              rows="2"
              value={customerComment}
              onChange={(e) => setCustomerComment(e.target.value)}
            />
            <button type="submit" className="checkout-btn">Оформить заказ</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CartModal;