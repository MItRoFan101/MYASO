import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import './AboutPage.css';

const AboutPage = () => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleScroll = () => {
    setShowScrollToTop(window.scrollY > 500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCartClick = () => {
    // Navigate to home page where cart modal is shown
    window.location.href = '/';
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="about-page">
      <Header cartCount={cartCount} onCartClick={handleCartClick} />

      <div className="content">
        <div className="section">
          <h2>О нашем производстве</h2>
          <p>«Мясная лавка» — это семейное предприятие с многолетней историей. Мы используем только охлаждённое мясо от проверенных фермеров Краснодарского края. Никакой заморозки, только натуральный вкус. Все продукты проходят строгий контроль качества на каждом этапе: от приёмки сырья до упаковки готовой продукции.</p>
          <p>Наши мастера вручную разделывают туши, готовят фарш для пельменей и маринуют шашлык по фирменным рецептам. Мы гордимся тем, что можем предложить вам настоящее мясо без компромиссов.</p>
        </div>
        <div className="section">
          <h2>Гарантии качества</h2>
          <p>✅ Только фермерское мясо — никаких промышленных добавок.</p>
          <p>✅ Ежедневный контроль свежести — продукция хранится при строгом температурном режиме.</p>
          <p>✅ Сертификаты соответствия — всё мясо проходит ветеринарный надзор.</p>
          <p>✅ Возврат и обмен в течение 24 часов, если качество не устроило.</p>
        </div>
        <div className="section">
          <h2>Наши сертификаты</h2>
          <div className="certificates">
            <div className="cert-card">
              <img src="https://placehold.co/200x280?text=Сертификат+качества" alt="Сертификат качества" />
              <p>Сертификат качества</p>
            </div>
            <div className="cert-card">
              <img src="https://placehold.co/200x280?text=Ветеринарное+свидетельство" alt="Ветеринарное свидетельство" />
              <p>Ветеринарное свидетельство</p>
            </div>
            <div className="cert-card">
              <img src="https://placehold.co/200x280?text=Декларация+соответствия" alt="Декларация соответствия" />
              <p>Декларация соответствия</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Кнопка наверх */}
      {showScrollToTop && (
        <button className="scroll-to-top" onClick={scrollToTop}>
          ↑
        </button>
      )}
    </div>
  );
};

export default AboutPage;