import React from 'react';
import Header from './Header';
import Footer from './Footer';
import './About.css';

const About = () => {
  return (
    <div style={{ color: '#ffffff' }}>
      <Header cartCount={0} onCartClick={() => {}} />

      <div className="content">
        <div className="section" style={{ 
          backgroundImage: 'url(\'/bg-texture.jpg\')', 
          backgroundSize: 'cover', 
          borderRadius: '24px', 
          width: '80%', 
          maxWidth: '800px', 
          margin: '0 auto 30px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
        }}>
          {/* Тёмный полупрозрачный слой */}
          <div style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.75)', 
            zIndex: 0 
          }}></div>
          
          {/* Текст (белый) */}
          <div style={{ position: 'relative', zIndex: 1, padding: '30px' }}>
            <h2 style={{ color: '#ffffff' }}>О нас</h2>
            <p style={{ color: '#ffffff' }}>Более 10 лет мы остаёмся главным островком настоящего мясного вкуса в городе. За это время тысячи клиентов сказали нам спасибо за продукты, которые не стыдно подать к столу.</p>
            <p style={{ color: '#ffffff' }}>Наша философия проста: никакого компромисса со свежестью. Мы работаем напрямую с проверенными фермерскими хозяйствами:</p>
            <p style={{ color: '#ffffff' }}>🐷 Свинина поступает к нам из Белгородской области — региона с лучшими традициями животноводства.</p>
            <p style={{ color: '#ffffff' }}>🐑 Баранина и Говядина приезжают из самого сердца черноземья — села Хреновое. Это мясо от скота, выращенного на естественных кормах.</p>
            <p style={{ color: '#ffffff' }}>Почему нам доверяют профессионалы и домохозяйки?</p>
            <p style={{ color: '#ffffff' }}>✅ Сертифицированная бойня (лицензия действует).</p>
            <p style={{ color: '#ffffff' }}>✅ Отсутствие постороннего запаха — вы получаете только чистый, натуральный аромат свежего мяса.</p>
            <p style={{ color: '#ffffff' }}>✅ 10+ лет стабильной работы и море благодарных отзывов.</p>
            <p style={{ color: '#ffffff' }}>Мы не просто продаём мясо и рыбу — мы даём уверенность в качестве каждого грамма.</p>
          </div>
        </div>

        <div className="about-banner">
          <img
            src="/about-banner.jpg"
            alt="Свежая рыба и фермерское мясо — наша гордость"
            style={{
              width: '80%',
              maxWidth: '800px',
              borderRadius: '24px',
              display: 'block',
              margin: '0 auto'
            }}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;