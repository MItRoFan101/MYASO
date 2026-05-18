import React, { useState, useEffect, useRef } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, getOrders, updateOrderStatus, getNews, addNews, updateNews, deleteNews, getOrdersWithChats } from '../utils/db';
import { verifyPassword, endSession } from '../utils/security';
import { fetchOrders, fetchMessages, sendMessage, deleteOrder } from '../utils/api';
import { exportToExcel, exportToWord, exportToPDF, importFromExcel, importFromWord, importFromPDF } from '../utils/export';
import AdminChatWidget from '../components/AdminChatWidget';
import './Admin.css';

const Admin = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    image: '',
    weightOptions: [100, 200, 300, 500, 1000]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const hasLoadedRef = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [newsImagePreview, setNewsImagePreview] = useState(null);
  const [news, setNews] = useState([]);
  const [isEditingNews, setIsEditingNews] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newNews, setNewNews] = useState({
    title: '',
    content: '',
    image: ''
  });
  const [ordersWithChats, setOrdersWithChats] = useState([]);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(1);
  const selectedOrderRef = useRef(null);
  const [userChats, setUserChats] = useState([]);
  const [selectedUserChat, setSelectedUserChat] = useState(null);

  // Beautiful status options for admin panel
  const statusOptions = [
    { value: 'pending', label: 'В обработке', icon: '⏳', color: '#f39c12', gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' },
    { value: 'completed', label: 'Выполнен', icon: '✅', color: '#27ae60', gradient: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' },
    { value: 'cancelled', label: 'Отменен', icon: '❌', color: '#e74c3c', gradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }
  ];

  // Проверка авторизации при загрузке
  useEffect(() => {
    if (hasLoadedRef.current) return;
    
    const session = localStorage.getItem('admin_session');
    if (!session) {
      console.log('Сессия не найдена');
      return;
    }
    
    try {
      const sessionData = JSON.parse(session);
      if (Date.now() > sessionData.expiresAt) {
        console.log('Сессия истекла');
        localStorage.removeItem('admin_session');
        return;
      }
      
      const products = getProducts();
      const orders = getOrders();
      console.log('Загруженные товары:', products);
      console.log('Загруженные заказы:', orders);
      console.log('Количество товаров:', products.length);
      
      setProducts(products);
      setOrders(orders);
      setIsLoaded(true);
      hasLoadedRef.current = true;
    } catch (e) {
      console.error('Ошибка при загрузке:', e);
      localStorage.removeItem('admin_session');
      return;
    }
  }, []);

  // Обновление данных при изменении сессии (только один раз после загрузки)
  useEffect(() => {
    if (isLoaded) {
      const loadOrders = async () => {
        try {
          const orders = await fetchOrders();
          console.log('Обновленные заказы:', orders);
          setOrders(orders);
        } catch (error) {
          console.error('Error loading orders:', error);
        }
      };
      
      loadOrders();
    }
  }, [isLoaded]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await verifyPassword(password);
      
      if (result.success) {
        setIsAuthenticated(true);
        setPassword('');
      } else if (result.blocked) {
        setError('Слишком много неудачных попыток. Попробуйте позже.');
      } else {
        const attempts = result.attemptsRemaining;
        if (attempts > 0) {
          setError(`Неверный пароль. Осталось попыток: ${attempts}`);
        } else {
          setError('Слишком много попыток. Попробуйте позже.');
        }
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    const product = {
      id: Date.now(),
      name: newProduct.name,
      price: parseInt(newProduct.price),
      image: imagePreview || 'beef.jpg',
      weightOptions: newProduct.weightOptions
    };

    addProduct(product);
    setProducts(getProducts());
    setNewProduct({ name: '', price: '', image: '', weightOptions: [100, 200, 300, 500, 1000] });
    setImagePreview(null);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsEditing(true);
    setImagePreview(null);
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    updateProduct(editingProduct.id, {
      name: editingProduct.name,
      price: parseInt(editingProduct.price),
      image: imagePreview || editingProduct.image,
      weightOptions: editingProduct.weightOptions || [100, 200, 300, 500, 1000]
    });

    setProducts(getProducts());
    setIsEditing(false);
    setEditingProduct(null);
    setImagePreview(null);
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('Удалить этот товар?')) {
      deleteProduct(id);
      setProducts(getProducts());
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      console.log('Updating order status:', orderId, status);
      const updatedOrder = await updateOrderStatus(orderId, status);
      console.log('Order updated:', updatedOrder);
      
      if (updatedOrder) {
        // Обновляем список заказов с сервера
        const orders = await fetchOrders();
        setOrders(orders);
        setOrdersWithChats(getOrdersWithChats());
        console.log('Orders updated successfully');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Ошибка при обновлении статуса заказа');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.')) {
      try {
        await deleteOrder(orderId);
        const orders = await fetchOrders();
        setOrders(orders);
        setOrdersWithChats(getOrdersWithChats());
        alert('Заказ удален');
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Ошибка при удалении заказа');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Проверка типа файла
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите изображение');
        return;
      }
      
      // Проверка размера файла (макс 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Файл слишком большой. Максимальный размер: 5MB');
        return;
      }
      
      // Создание preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
  };

  const handleAddNews = (e) => {
    e.preventDefault();
    if (!newNews.title || !newNews.content) return;

    addNews({
      title: newNews.title,
      content: newNews.content,
      image: newsImagePreview || 'beef.jpg'
    });

    setNews(getNews());
    setNewNews({ title: '', content: '', image: '' });
    setNewsImagePreview(null);
  };

  const handleEditNews = (newsItem) => {
    setEditingNews(newsItem);
    setIsEditingNews(true);
    setNewsImagePreview(null);
  };

  const handleUpdateNews = (e) => {
    e.preventDefault();
    if (!editingNews) return;

    updateNews(editingNews.id, {
      title: editingNews.title,
      content: editingNews.content,
      image: newsImagePreview || editingNews.image
    });

    setNews(getNews());
    setIsEditingNews(false);
    setEditingNews(null);
    setNewsImagePreview(null);
  };

  const handleDeleteNews = (id) => {
    if (window.confirm('Удалить эту новость?')) {
      deleteNews(id);
      setNews(getNews());
    }
  };

  const openChat = (orderId) => {
    console.log('Admin: Opening chat for order:', orderId);
    setSelectedOrderForChat(orderId);
    setIsChatOpen(true);
  };

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

  const handleUserChatClick = (userGroup) => {
    if (userGroup.orders.length > 1) {
      // Если у пользователя несколько заказов, показываем список чатов
      setUserChats(userGroup.orders);
      setSelectedUserChat(userGroup.orders[0].id);
    } else {
      // Если один заказ, открываем чат
      openChat(userGroup.orders[0].id);
    }
  };

  const handleSwitchUserChat = (orderId) => {
    setSelectedUserChat(orderId);
  };

  const handleRefreshOrders = async () => {
    try {
      const orders = await fetchOrders();
      setOrders(orders);
      setOrdersWithChats(getOrdersWithChats());
      alert('Заказы обновлены');
    } catch (error) {
      console.error('Error refreshing orders:', error);
      alert('Ошибка при обновлении заказов');
    }
  };

  // Импорт заказов
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    importFromExcel(file)
      .then((orders) => {
        orders.forEach(order => saveOrder(order));
        setOrders(getOrders());
        setOrdersWithChats(getOrdersWithChats());
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
        setOrders(getOrders());
        setOrdersWithChats(getOrdersWithChats());
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
        setOrders(getOrders());
        setOrdersWithChats(getOrdersWithChats());
        alert(`Успешно импортировано ${orders.length} заказов!`);
      })
      .catch((error) => {
        console.error('Ошибка импорта PDF:', error);
        alert('Ошибка при импорте PDF. Проверьте формат файла.');
      });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Загрузка новостей
  useEffect(() => {
    setNews(getNews());
  }, []);

  // Загрузка заказов с чатами
  useEffect(() => {
    setOrdersWithChats(getOrdersWithChats());
  }, []);

  // Обновление заказов после очистки данных
  useEffect(() => {
    if (!isLoaded) return;
    
    const loadOrders = async () => {
      try {
        const orders = await fetchOrders();
        setOrders(orders);
        setOrdersWithChats(getOrdersWithChats());
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    };
    
    loadOrders();
  }, [isLoaded]);

  // Проверка сессии при рендеринге
  const session = localStorage.getItem('admin_session');
  if (!session) {
    return (
      <div className="admin-login-overlay">
        <div className="admin-login-content">
          <div className="admin-login-header">
            <h2>🔐 Вход для сотрудников</h2>
          </div>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Введите пароль"
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Проверка...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  try {
    const sessionData = JSON.parse(session);
    if (Date.now() > sessionData.expiresAt) {
      localStorage.removeItem('admin_session');
      return (
        <div className="admin-login-overlay">
          <div className="admin-login-content">
            <div className="admin-login-header">
              <h2>🔐 Вход для сотрудников</h2>
            </div>
            <form className="admin-login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="password">Пароль</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Введите пароль"
                  required
                  disabled={isLoading}
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? 'Проверка...' : 'Войти'}
              </button>
            </form>
          </div>
        </div>
      );
    }
  } catch (e) {
    localStorage.removeItem('admin_session');
    return (
      <div className="admin-login-overlay">
        <div className="admin-login-content">
          <div className="admin-login-header">
            <h2>🔐 Вход для сотрудников</h2>
          </div>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Введите пароль"
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Проверка...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🔐 Панель администратора</h1>
        <div className="header-actions">
          <button onClick={() => { endSession(); window.location.href = '/'; }} className="back-btn">
            ← На главную
          </button>
          <button onClick={() => { endSession(); window.location.href = '/'; }} className="logout-btn">
            🚪 Выход
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* === УПРАВЛЕНИЕ НОВОСТЯМИ === */}
        <div className="admin-section">
          <h2>📰 Новости</h2>
          
          {/* Форма добавления/редактирования */}
          <div className="product-form">
            {isEditingNews ? (
              <form onSubmit={handleUpdateNews}>
                <h3>Редактирование: {editingNews.title}</h3>
                <input
                  type="text"
                  value={editingNews.title}
                  onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                  placeholder="Заголовок"
                  required
                />
                <textarea
                  value={editingNews.content}
                  onChange={(e) => setEditingNews({ ...editingNews, content: e.target.value })}
                  placeholder="Содержание новости"
                  rows={4}
                  required
                />
                
                {/* Drag-and-drop зона для изображения */}
                <div 
                  className={`image-upload-zone ${newsImagePreview ? 'has-image' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {newsImagePreview ? (
                    <div className="image-preview-container">
                      <img src={newsImagePreview} alt="Preview" />
                      <button type="button" onClick={() => setNewsImagePreview(null)} className="remove-image-btn">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <div className="upload-icon">📷</div>
                      <p>Перетащите изображение сюда</p>
                      <p>или</p>
                      <label className="upload-label">
                        Выберите файл
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setNewsImagePreview(event.target.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="save-btn">Сохранить</button>
                  <button type="button" onClick={() => { setIsEditingNews(false); setEditingNews(null); setNewsImagePreview(null); }} className="cancel-btn">
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddNews}>
                <h3>Добавить новость</h3>
                <input
                  type="text"
                  value={newNews.title}
                  onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                  placeholder="Заголовок"
                  required
                />
                <textarea
                  value={newNews.content}
                  onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                  placeholder="Содержание новости"
                  rows={4}
                  required
                />
                
                {/* Drag-and-drop зона для изображения */}
                <div 
                  className={`image-upload-zone ${newsImagePreview ? 'has-image' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {newsImagePreview ? (
                    <div className="image-preview-container">
                      <img src={newsImagePreview} alt="Preview" />
                      <button type="button" onClick={() => setNewsImagePreview(null)} className="remove-image-btn">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <div className="upload-icon">📷</div>
                      <p>Перетащите изображение сюда</p>
                      <p>или</p>
                      <label className="upload-label">
                        Выберите файл
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setNewsImagePreview(event.target.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  )}
                </div>
                
                <button type="submit" className="add-btn">Добавить</button>
              </form>
            )}
          </div>
          
          {/* === ВЫБОР ВЕСОВЫХ ОПЦИЙ ДЛЯ НОВОГО ТОВАРА === */}
          <div className="weight-options-section">
            <h4>⚖️ Весовые опции (граммы)</h4>
            <p className="hint">Выберите доступные веса для этого товара</p>
            <div className="weight-options-grid">
              {newProduct.weightOptions && newProduct.weightOptions.length > 0 ? (
                newProduct.weightOptions.map((weight, index) => (
                  <div key={index} className="weight-option-item">
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => {
                        const newOptions = [...newProduct.weightOptions];
                        newOptions[index] = parseInt(e.target.value) || 0;
                        setNewProduct({ ...newProduct, weightOptions: newOptions });
                      }}
                      min="1"
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        const newOptions = newProduct.weightOptions.filter((_, i) => i !== index);
                        setNewProduct({ ...newProduct, weightOptions: newOptions });
                      }}
                      className="remove-weight-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <p className="no-weights">Нет добавленных весов</p>
              )}
              <button 
                type="button" 
                onClick={() => {
                  const newOptions = [...newProduct.weightOptions, 100];
                  setNewProduct({ ...newProduct, weightOptions: newOptions });
                }}
                className="add-weight-btn"
              >
                + Добавить вес
              </button>
            </div>
          </div>

          {/* Список новостей */}
          <div className="news-list">
            {news.length === 0 ? (
              <p>Нет новостей</p>
            ) : (
              news.map((item) => (
                <div key={item.id} className="news-item">
                  {item.image && (
                    <img src={item.image} alt={item.title} />
                  )}
                  <div className="news-info">
                    <h3>{item.title}</h3>
                    <p className="news-date">{item.date}</p>
                    <p className="news-preview">{item.content.substring(0, 100)}...</p>
                  </div>
                  <div className="news-actions">
                    <button onClick={() => handleEditNews(item)} className="edit-btn">✏️</button>
                    <button onClick={() => handleDeleteNews(item.id)} className="delete-btn">🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* === УПРАВЛЕНИЕ ТОВАРАМИ === */}
        <div className="admin-section">
          <h2>📦 Товары</h2>
          
          {/* Форма добавления/редактирования */}
          <div className="product-form">
            {isEditing ? (
              <form onSubmit={handleUpdateProduct}>
                <h3>Редактирование: {editingProduct.name}</h3>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="Название"
                  required
                />
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  placeholder="Цена (₽)"
                  required
                />
                
                {/* Drag-and-drop зона для изображения */}
                <div 
                  className={`image-upload-zone ${imagePreview ? 'has-image' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {imagePreview ? (
                    <div className="image-preview-container">
                      <img src={imagePreview} alt="Preview" />
                      <button type="button" onClick={handleRemoveImage} className="remove-image-btn">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <div className="upload-icon">📷</div>
                      <p>Перетащите изображение сюда</p>
                      <p>или</p>
                      <label className="upload-label">
                        Выберите файл
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="save-btn">Сохранить</button>
                  <button type="button" onClick={() => { setIsEditing(false); setEditingProduct(null); setImagePreview(null); }} className="cancel-btn">
                    Отмена
                  </button>
                </div>
                
                {/* === ВЫБОР ВЕСОВЫХ ОПЦИЙ === */}
                <div className="weight-options-section">
                  <h4>⚖️ Весовые опции (граммы)</h4>
                  <p className="hint">Выберите доступные веса для этого товара</p>
                  <div className="weight-options-grid">
                    {editingProduct.weightOptions && editingProduct.weightOptions.length > 0 ? (
                      editingProduct.weightOptions.map((weight, index) => (
                        <div key={index} className="weight-option-item">
                          <input
                            type="number"
                            value={weight}
                            onChange={(e) => {
                              const newOptions = [...editingProduct.weightOptions];
                              newOptions[index] = parseInt(e.target.value) || 0;
                              setEditingProduct({ ...editingProduct, weightOptions: newOptions });
                            }}
                            min="1"
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              const newOptions = editingProduct.weightOptions.filter((_, i) => i !== index);
                              setEditingProduct({ ...editingProduct, weightOptions: newOptions });
                            }}
                            className="remove-weight-btn"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="no-weights">Нет добавленных весов</p>
                    )}
                    <button 
                      type="button" 
                      onClick={() => {
                        const newOptions = [...(editingProduct.weightOptions || []), 100];
                        setEditingProduct({ ...editingProduct, weightOptions: newOptions });
                      }}
                      className="add-weight-btn"
                    >
                      + Добавить вес
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddProduct}>
                <h3>Добавить новый товар</h3>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Название"
                  required
                />
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="Цена (₽)"
                  required
                />
                
                {/* Drag-and-drop зона для изображения */}
                <div 
                  className={`image-upload-zone ${imagePreview ? 'has-image' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {imagePreview ? (
                    <div className="image-preview-container">
                      <img src={imagePreview} alt="Preview" />
                      <button type="button" onClick={handleRemoveImage} className="remove-image-btn">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <div className="upload-icon">📷</div>
                      <p>Перетащите изображение сюда</p>
                      <p>или</p>
                      <label className="upload-label">
                        Выберите файл
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  )}
                </div>
                
                <button type="submit" className="add-btn">Добавить</button>
              </form>
            )}
          </div>

          {/* Поиск */}
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Список товаров */}
          <div className="products-list">
            {filteredProducts.length === 0 ? (
              <p>Нет товаров. Добавьте первый товар!</p>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="product-item">
                  <img src={product.image} alt={product.name} />
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p>{product.price} ₽</p>
                  </div>
                  <div className="product-actions">
                    <button onClick={() => handleEditProduct(product)} className="edit-btn">✏️</button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="delete-btn">🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* === УПРАВЛЕНИЕ ЗАКАЗАМИ === */}
        <div className="admin-section full-width">
          <div className="orders-header">
            <h2>📋 Заказы</h2>
            <button onClick={handleRefreshOrders} className="refresh-btn" title="Обновить заказы">
              🔄 Обновить
            </button>
            <div className="orders-actions">
              <div className="export-section">
                <span className="action-label">Экспорт:</span>
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
              </div>
              <div className="import-section">
                <span className="action-label">Импорт:</span>
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
              </div>
            </div>
          </div>
          <div className="orders-list">
            {orders.length === 0 ? (
              <p>Нет заказов</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="order-item">
                  <div className="order-header">
                    <h3>Заказ #{order.id}</h3>
                    <div className="order-status-selector">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, option.value)}
                          className={`status-btn ${order.status === option.value ? 'active' : ''}`}
                          style={{
                            background: order.status === option.value ? option.gradient : '#f0f0f0',
                            color: order.status === option.value ? 'white' : '#666',
                            border: order.status === option.value ? 'none' : '1px solid #ddd'
                          }}
                        >
                          <span className="status-icon">{option.icon}</span>
                          <span className="status-label">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="order-info">
                    <p><strong>Клиент:</strong> {order.customer.name}</p>
                    <p><strong>Телефон:</strong> {order.customer.phone}</p>
                    {order.customer.address && <p><strong>Адрес:</strong> {order.customer.address}</p>}
                    {order.customer.comment && <p><strong>Комментарий:</strong> {order.customer.comment}</p>}
                    <p><strong>Тип доставки:</strong> {order.customer.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка'}</p>
                  </div>
                  <div className="order-items">
                    <strong>Товары:</strong>
                    {order.items.map((item, index) => (
                      <p key={index}>{item.name} — {item.quantity} шт. × {item.price} ₽ = {item.price * item.quantity} ₽</p>
                    ))}
                  </div>
                  <div className="order-total">
                    <strong>Итого: {order.total} ₽</strong>
                  </div>
                  <div className="order-actions">
                    <button onClick={() => handleUserChatClick({ orders: [order] })} className="chat-btn">
                      💬 Чат
                    </button>
                    <button onClick={() => handleDeleteOrder(order.id)} className="delete-btn" title="Удалить заказ">
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Чат по центру экрана */}
      {isChatOpen && selectedOrderForChat && (
        <AdminChatWidget 
          key={selectedOrderForChat}
          orderId={selectedOrderForChat}
          currentUserId={currentUserId}
          isAdmin={true}
          isOpen={isChatOpen}
          onOpenChange={setIsChatOpen}
          userChats={userChats}
          selectedUserChat={selectedUserChat}
          onOrderChange={setSelectedOrderForChat}
        />
      )}

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
                  {order.status === 'cancelled' && ' Отменен'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;