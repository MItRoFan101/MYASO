import { useEffect, useState } from 'react';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: '25px',
        right: '25px',
        zIndex: 99999,
        width: 75,
        height: 75,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        backgroundImage: 'url(/rosemary.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'transparent',
        boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
      }}
      aria-label="Наверх"
    >
      <span style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>↑</span>
    </button>
  );
};

export default ScrollToTopButton;