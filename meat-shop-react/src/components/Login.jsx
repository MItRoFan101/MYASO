import React, { useState, useEffect } from 'react';
import { verifyPassword, getSessionRemainingTime } from '../utils/security';
import './Login.css';

const Login = ({ onLogin, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showBlockMessage, setShowBlockMessage] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      const remaining = getSessionRemainingTime();
      if (remaining > 0) {
        setRemainingTime(remaining);
        setShowBlockMessage(true);
      }
    };
    
    checkSession();
    
    const timer = setInterval(checkSession, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await verifyPassword(password);
      
      if (result.success) {
        // Сохраняем текущего пользователя
        const currentUser = {
          id: 1,
          name: 'Администратор',
          role: 'admin'
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('Saved currentUser to localStorage:', currentUser);
        
        onLogin();
      } else if (result.blocked) {
        setRemainingTime(result.remainingTime);
        setShowBlockMessage(true);
      } else {
        const attempts = result.attemptsRemaining;
        if (attempts > 0) {
          setError(`Неверный пароль. Осталось попыток: ${attempts}`);
        } else {
          setError('Слишком много попыток. Попробуйте позже.');
        }
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-content" onClick={(e) => e.stopPropagation()}>
        <div className="login-header">
          <h2>🔐 Вход для сотрудников</h2>
          <button className="login-close" onClick={onClose}>✕</button>
        </div>
        
        {showBlockMessage ? (
          <div className="blocked-message">
            <div className="blocked-icon">🔒</div>
            <h3>Доступ заблокирован</h3>
            <p>Слишком много неудачных попыток входа.</p>
            <p className="block-timer">Вернуться через: <span className="timer">{formatTime(remainingTime)}</span></p>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                  setShowBlockMessage(false);
                }}
                placeholder="Введите пароль"
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Проверка...' : 'Войти'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
