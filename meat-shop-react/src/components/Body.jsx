import React, { useState, useEffect } from 'react';
import { getProducts } from '../utils/db';
import { fetchUserOrders } from '../utils/api';
import NewsWidget from './NewsWidget';
import UserOrdersWidget from './UserOrdersWidget';
import WeightSelectionModal from './WeightSelectionModal';
import './Body.css';

  const stores = [
  {
    name: 'Западный рынок',
    address: 'напротив лавки «Сладкая жизнь»',
    hours: '🕒 Ежедневно: 08:00 – 18:00 (без обеда и выходных)',
    phone: '',
    mapLink: 'https://yandex.ru/maps/?pt=39.478332,50.989345&z=18',
  },
  {
    name: 'Советская, 105',
    address: 'напротив магазина «СВЕТОФОР»',
    hours: '🕒 Ежедневно: 08:00 – 18:00 (без обеда и выходных)',
    phone: '',
    mapLink: 'https://yandex.ru/maps/?pt=39.484820,50.978341&z=18',
  },
  {
    name: 'ул. 40 лет Октября, 21А',
    address: 'в ассортименте: свежая рыба',
    hours: '🕒 Ежедневно: 08:00 – 18:00 (без обеда и выходных)',
    phone: '',
    mapLink: 'https://yandex.ru/maps/?pt=39.537199,50.975831&z=18',
    fishIcon: true,
  },
];

const Body = ({ onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [addedToCart, setAddedToCart] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [hasOrders, setHasOrders] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      const products = await getProducts();
      setProducts(products);
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Синхронизация корзины между вкладками
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'cart') {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Получаем текущего пользователя из localStorage
  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUserId(JSON.parse(user).id);
    }
  }, []);

  // Загружаем заказы пользователя, когда пользователь авторизован
  useEffect(() => {
    if (currentUserId) {
      const loadUserOrders = async () => {
        try {
          const orders = await fetchUserOrders(currentUserId);
          setUserOrders(orders);
          setHasOrders(orders.length > 0);
        } catch (error) {
          console.error('Error loading user orders:', error);
        }
      };
      loadUserOrders();
    }
  }, [currentUserId]);

  const handleAddToCart = (product) => {
    setSelectedProduct(product);
    setIsWeightModalOpen(true);
  };

  const handleWeightModalAddToCart = (item) => {
    onAddToCart(item);
    setCartItems([...cartItems, item]);
    setAddedToCart(prev => ({ ...prev, [item.name]: Date.now() }));
    
    // Удаляем статус добавления через 2 секунды
    setTimeout(() => {
      setAddedToCart(prev => {
        const newAdded = { ...prev };
        delete newAdded[item.name];
        return newAdded;
      });
    }, 2000);
  };
  
  const isRecentlyAdded = (productName) => {
    return addedToCart[productName] && (Date.now() - addedToCart[productName] < 2000);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* === НОВОСТНОЙ ВИДЖЕТ === */}
    <NewsWidget style={{ marginTop: '2000px' }} />

      {/* === ПОИСК === */}
      <div className="search-box">
        <input
          type="text"
          id="product-search"
          placeholder="🔍 Найти мясо, колбасу, шашлык..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* === СЕТКА ТОВАРОВ === */}
      <div id="products" className="products-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>{product.price} ₽</p>
            <button 
              onClick={() => handleAddToCart(product)}
              className={isRecentlyAdded(product.name) ? 'btn-in-cart' : ''}
            >
              {isRecentlyAdded(product.name) ? 'В корзине ✓' : 'В корзину'}
            </button>
          </div>
        ))}
        {searchQuery && filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#2C2C2C', opacity: '0.8' }}>
            😔 Ничего не найдено
          </div>
        )}
      </div>

      {/* === БЛОК С АДРЕСАМИ ЛАВОК === */}
      <div id="stores" className="stores-section">
        <h2>🏠 Наши магазины</h2>
        <div className="stores-grid">
          {stores.map((store, index) => (
            <div key={index} className="store-card">
              <h3>{store.name}</h3>
              <p>{store.address}{store.fishIcon && <span style={{ marginLeft: '8px' }}>🐟 Свежая рыба</span>}</p>
              <p>{store.hours}</p>
              {store.phone && <p>{store.phone}</p>}
              <a href={store.mapLink} className="store-map-btn">На карте</a>
            </div>
          ))}
        </div>
      </div>

      {/* === ВИДЖЕТ МОИХ ЗАКАЗОВ === */}
      {hasOrders && <UserOrdersWidget currentUserId={currentUserId} />}
      
      {/* === ВЫБОР ВЕСА === */}
      <WeightSelectionModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        product={selectedProduct}
        onAddToCart={handleWeightModalAddToCart}
      />
    </>
  );
};

export default Body;