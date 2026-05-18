import React, { useState, useEffect } from 'react';
import { getProducts, saveProducts, addProduct, updateProduct, deleteProduct, getOrders, saveOrder, getOrderById, adminLogin, adminLogout, isAdminLoggedIn, getMessagesByOrder, sendMessage } from '../utils/db';
import { exportToExcel, exportToWord, exportToPDF, importFromExcel, importFromWord, importFromPDF } from '../utils/export';
import AdminChatWidget from './AdminChatWidget';
import OrderChat from './OrderChat';
import './AdminPanel.css';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showLogin, setShowLogin] = useState(true);
  const [loginPassword, setLoginPassword] = useState('');

  // Товары
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', image: '' });

  // Заказы
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [importedOrders, setImportedOrders] = useState([]);

  useEffect(() => {
    if (isAdminLoggedIn()) {
      setIsAuthenticated(true);
      setShowLogin(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
      loadOrders();
    }
  }, [isAuthenticated, activeTab]);

  const loadProducts = () => {
    setProducts(getProducts());
  };

  const loadOrders = () => {
    setOrders(getOrders());
  };

  // Аутентификация
  const handleLogin = (e) => {
    e.preventDefault();
    if (adminLogin(loginPassword)) {
      setIsAuthenticated(true);
      setShowLogin(false);
      setLoginPassword('');
    } else {
      alert('Неверный пароль! Пароль: admin123');
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
    setShowLogin(true);
    setSelectedOrder(null);
  };

  // Товары
  const handleAddProduct = (e) => {
    e.preventDefault();
    if (newProduct.name && newProduct.price) {
      addProduct(newProduct);
      setNewProduct({ name: '', price: '', image: '' });
      loadProducts();
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditForm({ name: product.name, price: product.price, image: product.image });
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    if (editingProduct && editForm.name && editForm.price) {
      updateProduct(editingProduct.id, editForm);
      setEditingProduct(null);
      setEditForm({ name: '', price: '', image: '' });
      loadProducts();
    }
  };

  const handleDeleteProduct = (id) => {
    if (confirm('Удалить этот товар?')) {
      deleteProduct(id);
      loadProducts();
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditForm({ name: '', price: '', image: '' });
  };

  // Заказы
  const handleViewOrder = (orderId) => {
    const order = getOrderById(orderId);
    setSelectedOrder(order);
  };

  const handleCompleteOrder = (orderId) => {
    const order = getOrderById(orderId);
    if (order) {
      order.status = 'completed';
      saveOrder(order);
      loadOrders();
      setSelectedOrder(null);
    }
  };

  const handleCancelOrder = (orderId) => {
    const order = getOrderById(orderId);
    if (order) {
      order.status = 'cancelled';
      saveOrder(order);
      loadOrders();
      setSelectedOrder(null);
    }
  };

  const handleOpenChat = (orderId) => {
    setSelectedOrder(getOrderById(orderId));
    setShowChatModal(true);
  };

  const handleCloseChat = () => {
    setShowChatModal(false);
    setSelectedOrder(null);
  };

  // Импорт заказов
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    importFromExcel(file)
      .then((orders) => {
        orders.forEach(order => saveOrder(order));
        setImportedOrders(orders);
        loadOrders();
        alert(`Успешно импортировано ${orders.length} заказов!`);
      })
      .catch((error) => {
        console.error('Ошибка импорта Excel:', error);
        alert('Ошибка при импорте Excel. Проверьте формат файла.');
      });
  };

  const handleImportWord = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    importFromWord(file)
      .then((orders) => {
        orders.forEach(order => saveOrder(order));
        setImportedOrders(orders);
        loadOrders();
        alert(`Успешно импортировано ${orders.length} заказов!`);
      })
      .catch((error) => {
        console.error('Ошибка импорта Word:', error);
        alert('Ошибка при импорте Word. Проверьте формат файла.');
      });
  };

  const handleImportPDF = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    importFromPDF(file)
      .then((orders) => {
        orders.forEach(order => saveOrder(order));
        setImportedOrders(orders);
        loadOrders();
        alert(`Успешно импортировано ${orders.length} заказов!`);
      })
      .catch((error) => {
        console.error('Ошибка импорта PDF:', error);
        alert('Ошибка при импорте PDF. Проверьте формат файла.');
      });
  };

  if (showLogin) {
    return (
      <div className="admin-login">
        <div className="login-box">
          <h2>🔐 Вход в админ-панель</h2>
          <p>Пароль: <strong>admin123</strong></p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Введите пароль"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            <button type="submit">Войти</button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>🛠 Админ-панель</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={() => { 
              if (orders.length === 0) {
                alert('Нет заказов для экспорта');
                return;
              }
              exportToExcel(orders);
            }} 
            className="export-btn excel-btn" 
            title="Экспорт в Excel"
            disabled={orders.length === 0}
          >
            📊 Excel
          </button>
          <button 
            onClick={() => { 
              if (orders.length === 0) {
                alert('Нет заказов для экспорта');
                return;
              }
              exportToWord(orders);
            }} 
            className="export-btn word-btn" 
            title="Экспорт в Word"
            disabled={orders.length === 0}
          >
            📝 Word
          </button>
          <button 
            onClick={() => { 
              if (orders.length === 0) {
                alert('Нет заказов для экспорта');
                return;
              }
              exportToPDF(orders);
            }} 
            className="export-btn pdf-btn" 
            title="Экспорт в PDF"
            disabled={orders.length === 0}
          >
            📄 PDF
          </button>
          <button onClick={loadOrders} className="refresh-btn" title="Обновить заказы">
            🔄 Обновить
          </button>
          <div style={{ width: '1px', height: '24px', background: '#ddd', margin: '0 5px' }}></div>
          <label className="import-btn excel-btn" title="Импорт из Excel">
            📥 Excel
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleImportExcel} 
              style={{ display: 'none' }}
            />
          </label>
          <label className="import-btn word-btn" title="Импорт из Word">
            📥 Word
            <input 
              type="file" 
              accept=".docx" 
              onChange={handleImportWord} 
              style={{ display: 'none' }}
            />
          </label>
          <label className="import-btn pdf-btn" title="Импорт из PDF">
            📥 PDF
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleImportPDF} 
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={handleLogout} className="logout-btn">Выйти</button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Товары
        </button>
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Заказы ({orders.length})
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="admin-content">
          {/* Форма добавления */}
          <div className="product-form">
            <h3>➕ Добавить товар</h3>
            <form onSubmit={handleAddProduct}>
              <input
                type="text"
                placeholder="Название товара"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Цена (₽)"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Имя файла изображения (например, beef.jpg)"
                value={newProduct.image}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
              />
              <button type="submit">Добавить</button>
            </form>
          </div>

          {/* Список товаров */}
          <div className="products-list">
            <h3>Список товаров</h3>
            {products.map((product) => (
              <div key={product.id} className="product-item">
                {editingProduct && editingProduct.id === product.id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      value={editForm.image}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                    />
                    <div className="edit-buttons">
                      <button onClick={handleUpdateProduct}>Сохранить</button>
                      <button onClick={cancelEdit}>Отмена</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="product-info">
                      <img src={product.image} alt={product.name} />
                      <div>
                        <h4>{product.name}</h4>
                        <p>{product.price} ₽</p>
                      </div>
                    </div>
                    <div className="product-actions">
                      <button onClick={() => handleEditProduct(product)}>✏️ Редактировать</button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="delete-btn">🗑 Удалить</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="admin-content">
          <div className="orders-header">
            <h3>📋 Список заказов</h3>
          </div>
          {orders.length === 0 ? (
            <p>Нет заказов</p>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-item">
                  <div className="order-header">
                    <span>Заказ #{order.id}</span>
                    <span className={`status ${order.status}`}>{order.status}</span>
                  </div>
                  <div className="order-info">
                    <p><strong>Клиент:</strong> {order.customer.name}</p>
                    <p><strong>Телефон:</strong> {order.customer.phone}</p>
                    <p><strong>Тип:</strong> {order.customer.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка'}</p>
                    {order.customer.address && <p><strong>Адрес:</strong> {order.customer.address}</p>}
                    {order.customer.comment && <p><strong>Комментарий:</strong> {order.customer.comment}</p>}
                    <p><strong>Сумма:</strong> {order.total} ₽</p>
                  </div>
                  <div className="order-items">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item-row">
                        <span>{item.name} x{item.quantity}</span>
                        <span>{item.price * item.quantity} ₽</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-actions">
                    {order.status === 'pending' && (
                      <>
                        <button onClick={() => handleCompleteOrder(order.id)} className="complete-btn">✅ Выполнить</button>
                        <button onClick={() => handleCancelOrder(order.id)} className="cancel-btn">❌ Отменить</button>
                      </>
                    )}
                    <button onClick={() => handleViewOrder(order.id)}>👁 Подробнее</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Модальное окно просмотра заказа */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Заказ #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="order-details">
                <p><strong>Клиент:</strong> {selectedOrder.customer.name}</p>
                <p><strong>Телефон:</strong> {selectedOrder.customer.phone}</p>
                <p><strong>Тип:</strong> {selectedOrder.customer.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка'}</p>
                {selectedOrder.customer.address && <p><strong>Адрес:</strong> {selectedOrder.customer.address}</p>}
                {selectedOrder.customer.comment && <p><strong>Комментарий:</strong> {selectedOrder.customer.comment}</p>}
                <p><strong>Сумма:</strong> {selectedOrder.total} ₽</p>
                <p><strong>Статус:</strong> {selectedOrder.status}</p>
              </div>
              <div className="order-items">
                <h4>Товары:</h4>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="order-item-row">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{item.price * item.quantity} ₽</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedOrder(null)}>Закрыть</button>
              <button onClick={() => handleOpenChat(selectedOrder.id)} className="open-chat-btn">
                💬 Открыть чат
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно чата */}
      {showChatModal && selectedOrder && (
        <div className="chat-modal-overlay" onClick={handleCloseChat}>
          <div className="chat-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal-header">
              <h3>💬 Чат с заказом #{selectedOrder.id}</h3>
              <button onClick={handleCloseChat} className="chat-modal-close">✕</button>
            </div>
            <div className="chat-modal-body">
              <OrderChat
                orderId={selectedOrder.id}
                currentUserId={1} // Admin user ID
                isAdmin={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;