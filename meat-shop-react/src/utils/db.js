// === БАЗА ДАННЫХ ===

// Товары
export const getProducts = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/products');
    if (response.ok) {
      const products = await response.json();
      // Сохраняем в localStorage для кэширования
      localStorage.setItem('products', JSON.stringify(products));
      return products;
    }
  } catch (error) {
    console.error('Error fetching products from server:', error);
  }
  
  // Fallback to localStorage
  const products = localStorage.getItem('products');
  return products ? JSON.parse(products) : [
    { id: 1, name: 'Говядина премиум', price: 1200, image: 'beef.jpg', weightOptions: [100, 200, 300, 500, 1000] },
    { id: 2, name: 'Свинина на кости', price: 800, image: 'pork.jpg', weightOptions: [100, 200, 300, 500, 1000] },
    { id: 3, name: 'Баранина каре', price: 950, image: 'lamb.jpg', weightOptions: [100, 200, 300, 500, 1000] },
    { id: 4, name: 'Куриное филе', price: 450, image: 'chicken.jpg', weightOptions: [100, 200, 300, 500, 1000] },
  ];
};

export const saveProducts = (products) => {
  localStorage.setItem('products', JSON.stringify(products));
};

export const addProduct = (product) => {
  const products = getProducts();
  const newProduct = { ...product, id: Date.now() };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
};

export const updateProduct = (id, updatedProduct) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...updatedProduct };
    saveProducts(products);
    return true;
  }
  return false;
};

export const deleteProduct = (id) => {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  saveProducts(filtered);
};

// Заказы
export const getOrders = () => {
  const orders = localStorage.getItem('orders');
  return orders ? JSON.parse(orders) : [];
};

// Получить заказы конкретного пользователя
export const fetchUserOrders = (userId) => {
  const orders = getOrders();
  return orders.filter(order => order.customer && order.customer.id === userId);
};

// Новости
export const getNews = () => {
  const news = localStorage.getItem('news');
  return news ? JSON.parse(news) : [
    {
      id: 1,
      title: '🎉 Новинка! Говядина премиум',
      content: 'Мы рады представить вам новую коллекцию говядины премиум качества. Только свежее мясо от проверенных поставщиков!',
      image: 'beef.jpg',
      date: '2024-01-15',
      read: false
    }
  ];
};

export const saveNews = (news) => {
  localStorage.setItem('news', JSON.stringify(news));
};

export const addNews = (news) => {
  const allNews = getNews();
  const newNews = { ...news, id: Date.now(), date: new Date().toISOString().split('T')[0], read: false };
  allNews.unshift(newNews);
  saveNews(allNews);
  return newNews;
};

export const updateNews = (id, updatedNews) => {
  const allNews = getNews();
  const index = allNews.findIndex(n => n.id === id);
  if (index !== -1) {
    allNews[index] = { ...allNews[index], ...updatedNews };
    saveNews(allNews);
    return true;
  }
  return false;
};

export const deleteNews = (id) => {
  const allNews = getNews();
  const filtered = allNews.filter(n => n.id !== id);
  saveNews(filtered);
};

export const saveOrder = (order) => {
  const orders = getOrders();
  orders.unshift(order); // Добавляем в начало
  localStorage.setItem('orders', JSON.stringify(orders));
};

export const getOrderById = (id) => {
  const orders = getOrders();
  return orders.find(o => o.id === Number(id));
};

export const updateOrderStatus = async (id, status) => {
  try {
    const response = await fetch(`http://localhost:5000/api/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      console.error('Error updating order status:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    return null;
  }
};

// Аутентификация админа
export const isAdminLoggedIn = () => {
  return localStorage.getItem('adminLoggedIn') === 'true';
};

export const adminLogin = (password) => {
  // Простая проверка пароля (в реальном проекте нужно серверное хеширование)
  if (password === 'admin123') {
    localStorage.setItem('adminLoggedIn', 'true');
    return true;
  }
  return false;
};

export const adminLogout = () => {
  localStorage.removeItem('adminLoggedIn');
};

// === ЧАТ С ЗАКАЗАМИ ===

// Получить все сообщения по заказу
export const getMessagesByOrder = (orderId) => {
  const messages = localStorage.getItem('chat_messages');
  if (!messages) return [];
  
  const allMessages = JSON.parse(messages);
  return allMessages.filter(msg => msg.orderId === orderId).sort((a, b) => a.createdAt - b.createdAt);
};

// Получить последнее сообщение по заказу
export const getLastMessageByOrder = (orderId) => {
  const messages = getMessagesByOrder(orderId);
  return messages.length > 0 ? messages[messages.length - 1] : null;
};

// Отправить сообщение
export const sendMessage = (orderId, senderId, senderType, text, mediaUrl = null, mediaType = null) => {
  const messages = localStorage.getItem('chat_messages');
  const allMessages = messages ? JSON.parse(messages) : [];
  
  const newMessage = {
    id: Date.now(),
    orderId,
    senderId,
    senderType, // 'customer' or 'admin'
    text,
    mediaUrl,
    mediaType,
    createdAt: Date.now(),
    isReadByAdmin: senderType === 'customer'
  };
  
  allMessages.push(newMessage);
  localStorage.setItem('chat_messages', JSON.stringify(allMessages));
  
  return newMessage;
};

// Отметить сообщения как прочитанные администратором
export const markMessagesAsRead = (orderId) => {
  const messages = localStorage.getItem('chat_messages');
  if (!messages) return;
  
  const allMessages = JSON.parse(messages);
  const updatedMessages = allMessages.map(msg => 
    msg.orderId === orderId && msg.senderType === 'customer' 
      ? { ...msg, isReadByAdmin: true }
      : msg
  );
  
  localStorage.setItem('chat_messages', JSON.stringify(updatedMessages));
};

// Получить количество непрочитанных сообщений
export const getUnreadCount = (orderId) => {
  const messages = localStorage.getItem('chat_messages');
  if (!messages) return 0;
  
  const allMessages = JSON.parse(messages);
  return allMessages.filter(msg => 
    msg.orderId === orderId && msg.senderType === 'customer' && !msg.isReadByAdmin
  ).length;
};

// Получить все заказы с последними сообщениями
export const getOrdersWithChats = () => {
  const orders = getOrders();
  const messages = localStorage.getItem('chat_messages');
  const allMessages = messages ? JSON.parse(messages) : [];
  
  return orders.map(order => {
    const orderMessages = allMessages.filter(msg => msg.orderId === order.id);
    const lastMessage = orderMessages.length > 0 ? orderMessages[orderMessages.length - 1] : null;
    
    return {
      ...order,
      lastMessage,
      unreadCount: orderMessages.filter(msg => msg.senderType === 'customer' && !msg.isReadByAdmin).length
    };
  }).sort((a, b) => {
    // Сортировка по дате последнего сообщения
    const dateA = a.lastMessage ? a.lastMessage.createdAt : 0;
    const dateB = b.lastMessage ? b.lastMessage.createdAt : 0;
    return dateB - dateA;
  });
};

// Очистить все заказы
export const clearAllOrders = () => {
  localStorage.removeItem('orders');
};

// Очистить все сообщения чата
export const clearAllMessages = () => {
  localStorage.removeItem('chat_messages');
};

// Очистить все данные (заказы и сообщения)
export const clearAllData = () => {
  localStorage.removeItem('orders');
  localStorage.removeItem('chat_messages');
};