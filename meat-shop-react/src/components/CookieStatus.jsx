import React, { useState, useEffect } from 'react';
import './CookieStatus.css';

  const CookieStatus = () => {
    const [hasCookies, setHasCookies] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const COOKIE_NAME = 'cookieNotificationClosed';
    const COOKIE_EXPIRY_DAYS = 30; // Показывать раз в 30 дней

    useEffect(() => {
      // Проверяем наличие cookies
      const checkCookies = () => {
        const cookies = document.cookie;
        setHasCookies(cookies.length > 0);
        
        // Проверяем, был ли закрыт уведомление и не истекло ли время
        const cookieValue = getCookie(COOKIE_NAME);
        if (cookieValue) {
          const closeDate = new Date(cookieValue);
          const now = new Date();
          const daysDiff = (now - closeDate) / (1000 * 60 * 60 * 24);
          
          // Показываем только если не было закрыто недавно (более 30 дней назад)
          if (daysDiff >= COOKIE_EXPIRY_DAYS) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        } else {
          // Если куки нет - показываем уведомление
          setIsVisible(true);
        }
        
        setIsChecking(false);
      };

      // Проверяем через 100ms после загрузки
      setTimeout(checkCookies, 100);
    }, []);

    // Функция для получения значения cookie
    const getCookie = (name) => {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    };

    // Функция для установки cookie с датой закрытия
    const setCookie = (name, value, days) => {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = "expires=" + date.toUTCString();
      document.cookie = name + "=" + value + ";" + expires + ";path=/";
    };

    const handleClose = () => {
      setIsVisible(false);
      // Устанавливаем cookie с текущей датой закрытия
      setCookie(COOKIE_NAME, new Date().toISOString(), COOKIE_EXPIRY_DAYS);
    };

  if (isChecking || !isVisible) {
    return null;
  }

  return (
    <div className="cookie-status">
      <div className="cookie-indicator">
        {hasCookies ? (
          <>
            <span className="cookie-icon">🍪</span>
            <span className="cookie-text">Cookies активны</span>
          </>
        ) : (
          <>
            <span className="cookie-icon">🍪</span>
            <span className="cookie-text">Cookies не используются</span>
          </>
        )}
        <button className="cookie-close-btn" onClick={handleClose}>✕</button>
      </div>
    </div>
  );
};

export default CookieStatus;
