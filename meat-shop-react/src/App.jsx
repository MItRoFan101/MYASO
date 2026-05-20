import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Body from './components/Body';
import Footer from './components/Footer';
import CartModal from './components/CartModal';
import Login from './components/Login';
import Admin from './pages/Admin';
import Order from './pages/Order';
import CookieStatus from './components/CookieStatus';
import UserOrdersWidget from './components/UserOrdersWidget';
import './App.css';
import AboutPage from './components/AboutPage';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Синхронизация корзины между вкладками
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'cart') {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const newCart = JSON.parse(savedCart);
          // Обновляем только если корзина изменилась
          if (JSON.stringify(newCart) !== JSON.stringify(cart)) {
            setCart(newCart);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [cart]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product) => {
    const existingItem = cart.find(item => item.name === product.name);
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    setCart([...cart]);
  };

  const handleUpdateCart = (newCart) => {
    setCart(newCart);
  };

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowAdminPanel(true);
  };

  const handleCloseAdmin = () => {
    setShowAdminPanel(false);
  };

  // Smooth scrolling for anchor links
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const target = e.target.closest('a[href^="#"]');
      if (target) {
        e.preventDefault();
        const href = target.getAttribute('href');
        
        if (href === '#admin') {
          setShowAdminPanel(true);
        } else {
          const targetElement = document.querySelector(href);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <div style={{ backgroundImage: 'url(\'/top-bar-bg.png\')', backgroundSize: '100% auto', backgroundPosition: 'center -300px', backgroundRepeat: 'no-repeat', minHeight: '100vh' }}>
      <Header cartCount={cartCount} onCartClick={handleCartClick} />
      <Body onAddToCart={handleAddToCart} />
      <Footer />
      <CartModal
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        cart={cart}
        onAddToCart={handleAddToCart}
        onUpdateCart={handleUpdateCart}
        navigate={navigate}
      />
      
      {showAdminPanel && (
        <Login onLogin={handleLogin} onClose={handleCloseAdmin} />
      )}
      
      {/* === СТАТИЧНЫЕ СИЛУЭТЫ === */}
      <div className="static-silhouette" id="static-cow">
        <img src="cow.png" alt="" />
      </div>
      <div className="static-silhouette" id="static-lamb">
        <img src="lamb.png" alt="" />
      </div>

      {/* === КНОПКА НАВЕРХ (розмарин + стрелка) === */}
    

      {/* === КОНТРОЛЬ COOKIES === */}
      <CookieStatus />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/order/:id" element={<Order />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Router>
  );
}

export default App;