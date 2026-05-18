import React from 'react';
import './Header.css';

const Header = ({ cartCount, onCartClick }) => {
  return (
    <>
      <div style={{
        backgroundImage: 'url(\'/top-bar-bg.png\')',
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px 10px 20px',
        fontSize: '17px',
        minHeight: '50px'
      }}>
        <span className="logo-text">Мясная лавка</span>
        <a href="/" style={{ color: 'white', textDecoration: 'none', marginRight: '10px' }}>Главная</a>
        <a href="#products" style={{ color: 'white', textDecoration: 'none', marginRight: '10px' }}>Продукция</a>
        <a href="#stores" style={{ color: 'white', textDecoration: 'none', marginRight: '10px' }}>Магазины</a>
        <a href="/about" style={{ color: 'white', textDecoration: 'none', marginRight: '10px' }}>О нас</a>
        <span>
          📞 +7 (908) 130-77-66
          <span style={{ marginLeft: '20px', cursor: 'pointer' }} onClick={onCartClick}>
            🛒 <span>{cartCount}</span>
          </span>
        </span>
      </div>
    </>
  );
};

export default Header;