// API utility module for backend communication

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
    throw new Error(error.error || 'Ошибка запроса');
  }
  return response.json();
};

// Helper function to get cookies from document
const getCookies = () => {
  const cookies = document.cookie.split(';').map(cookie => cookie.trim().split('='));
  const cookieMap = {};
  cookies.forEach(([name, value]) => {
    cookieMap[name] = value;
  });
  return cookieMap;
};

// Orders API
export const createOrder = async (orderData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const fetchOrders = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const fetchOrder = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

export const deleteOrder = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'DELETE',
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

export const deleteAllOrders = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'DELETE',
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error deleting all orders:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Messages API
export const fetchMessages = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/messages`);
    const data = await handleResponse(response);
    // Всегда возвращаем массив, даже если данных нет
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    // В случае ошибки возвращаем пустой массив
    return [];
  }
};

export const deleteMessage = async (orderId, messageId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/messages/${messageId}`, {
      method: 'DELETE',
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

export const sendMessage = async (orderId, senderId, senderType, text, mediaFile = null) => {
  try {
    console.log('=== Sending message ===');
    console.log('orderId:', orderId);
    console.log('senderId:', senderId);
    console.log('senderType:', senderType);
    console.log('text:', text);
    console.log('mediaFile:', mediaFile ? mediaFile.name : null);
    
    const formData = new FormData();
    formData.append('senderId', senderId);
    formData.append('senderType', senderType);
    if (text) {
      formData.append('text', text);
    }
    if (mediaFile) {
      formData.append('file', mediaFile);
    }

    console.log('FormData created, sending request...');
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/messages`, {
      method: 'POST',
      body: formData,
    });
    console.log('Response status:', response.status);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Health check
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Backend health check failed:', error);
    return null;
  }
};

// User orders API
export const fetchUserOrders = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`);
    const orders = await handleResponse(response);
    // Filter orders by user ID
    return orders.filter(order => order.customer && order.customer.id === userId);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
};
