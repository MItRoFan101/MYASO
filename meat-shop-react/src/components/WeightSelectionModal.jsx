import React, { useState, useEffect } from 'react';
import './WeightSelectionModal.css';

const WeightSelectionModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const [weight, setWeight] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [pricePer100g, setPricePer100g] = useState(0);

  useEffect(() => {
    if (isOpen && product) {
      setWeight('');
      setCalculatedPrice(0);
      setPricePer100g(product.price / 100);
    }
  }, [isOpen, product]);

  const handleWeightChange = (e) => {
    const value = e.target.value;
    setWeight(value);
    if (value && product) {
      const grams = parseInt(value);
      const price = (grams / 100) * product.price;
      setCalculatedPrice(price);
    } else {
      setCalculatedPrice(0);
    }
  };

  const handleAddToCart = () => {
    if (!weight || !product) return;
    
    const grams = parseInt(weight);
    const item = {
      ...product,
      quantity: 1,
      weight: grams,
      price: calculatedPrice
    };
    
    onAddToCart(item);
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="weight-modal-overlay" onClick={onClose}>
      <div className="weight-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="weight-modal-header">
          <h2>⚖️ Выбор веса</h2>
          <button className="weight-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="weight-modal-body">
          <div className="product-preview">
            <img src={product.image} alt={product.name} />
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="price-per-100g">Цена: {pricePer100g.toFixed(2)} ₽ за 100г</p>
            </div>
          </div>
          
          <div className="weight-input-section">
            <label htmlFor="weight-input">Введите вес (граммы):</label>
            <input
              type="number"
              id="weight-input"
              value={weight}
              onChange={handleWeightChange}
              placeholder="Например: 200"
              min="1"
              required
            />
            <div className="weight-hint">
              <p>💡 Введите желаемое количество граммов</p>
            </div>
          </div>
          
          <div className="price-calculation">
            <div className="price-row">
              <span>Вес:</span>
              <span>{weight} г</span>
            </div>
            <div className="price-row total">
              <span>Итого:</span>
              <span className="total-price">{calculatedPrice.toFixed(2)} ₽</span>
            </div>
          </div>
        </div>
        
        <div className="weight-modal-footer">
          <button className="cancel-btn" onClick={onClose}>Отмена</button>
          <button 
            className="add-btn" 
            onClick={handleAddToCart}
            disabled={!weight || calculatedPrice <= 0}
          >
            Добавить в корзину
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeightSelectionModal;