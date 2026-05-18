import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer" style={{
      backgroundImage: 'url(\'/top-bar-bg.png\')',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: '40px 20px',
      borderTop: '1px solid #eee',
      textAlign: 'center',
      color: '#ffffff'
    }}>
      <p>© 2026 Мясная лавка. Все права защищены.</p>
      <p style={{ opacity: '0.7', fontSize: '14px', color: 'white' }}>Свежее мясо. Натуральный вкус. Каждый день.</p>
      <p style={{ marginTop: '10px' }}>
        <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>
          🔐 Вход для сотрудников
        </Link>
      </p>
      <p><a href="#" style={{ color: '#ffffff', fontSize: '14px', textDecoration: 'none' }}>Политика конфиденциальности</a></p>
    </footer>
  );
};

export default Footer;