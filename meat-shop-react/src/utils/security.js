// === СИСТЕМА БЕЗОПАСНОСТИ ===

// Конфигурация безопасности
const SECURITY_CONFIG = {
  maxAttempts: 5,              // Максимальное количество попыток
  blockTime: 15 * 60 * 1000,   // Время блокировки в миллисекундах (15 минут)
  sessionTimeout: 30 * 60 * 1000, // Время жизни сессии (30 минут)
  minDelay: 2000,              // Минимальная задержка между попытками (2 секунды)
  maxDelay: 10000,             // Максимальная задержка (10 секунд)
  salt: 'meat-shop-secret-salt-2026', // Соль для хеширования
};

// Получить IP-адрес (используем localStorage для имитации)
const getIP = () => {
  let ip = localStorage.getItem('admin_ip');
  if (!ip) {
    // Генерируем случайный IP для демонстрации
    ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    localStorage.setItem('admin_ip', ip);
  }
  return ip;
};

// Получить информацию о попытках входа
const getLoginAttempts = () => {
  const attempts = localStorage.getItem('login_attempts');
  return attempts ? JSON.parse(attempts) : {};
};

// Сохранить информацию о попытках входа
const saveLoginAttempts = (attempts) => {
  localStorage.setItem('login_attempts', JSON.stringify(attempts));
};

// Проверить, заблокирован ли IP
const isIPBlocked = (ip) => {
  const attempts = getLoginAttempts();
  const attempt = attempts[ip];
  
  if (!attempt) return false;
  
  // Проверяем, не истекло ли время блокировки
  if (Date.now() < attempt.blockUntil) {
    return true;
  }
  
  // Если время вышло, очищаем попытки
  delete attempts[ip];
  saveLoginAttempts(attempts);
  return false;
};

// Блокировать IP
const blockIP = (ip) => {
  const attempts = getLoginAttempts();
  attempts[ip] = {
    attempts: 0,
    blockUntil: Date.now() + SECURITY_CONFIG.blockTime,
    lastAttempt: Date.now()
  };
  saveLoginAttempts(attempts);
};

// Увеличить счетчик попыток
const incrementAttempts = (ip) => {
  const attempts = getLoginAttempts();
  if (!attempts[ip]) {
    attempts[ip] = {
      attempts: 0,
      blockUntil: 0,
      lastAttempt: Date.now()
    };
  }
  attempts[ip].attempts++;
  attempts[ip].lastAttempt = Date.now();
  saveLoginAttempts(attempts);
  return attempts[ip];
};

// Проверить, можно ли попробовать войти
const canTryLogin = (ip) => {
  const attempts = getLoginAttempts();
  const attempt = attempts[ip];
  
  if (!attempt) return true;
  
  // Если попыток меньше максимума, можно пробовать
  if (attempt.attempts < SECURITY_CONFIG.maxAttempts) {
    return true;
  }
  
  // Если попыток больше максимума, проверяем время блокировки
  if (Date.now() < attempt.blockUntil) {
    return false;
  }
  
  // Если время вышло, очищаем и разрешаем
  delete attempts[ip];
  saveLoginAttempts(attempts);
  return true;
};

// Получить оставшееся время блокировки
const getRemainingBlockTime = (ip) => {
  const attempts = getLoginAttempts();
  const attempt = attempts[ip];
  
  if (!attempt || !attempt.blockUntil) return 0;
  
  const remaining = attempt.blockUntil - Date.now();
  return remaining > 0 ? remaining : 0;
};

// Хеширование пароля с использованием Web Crypto API (SHA-256)
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SECURITY_CONFIG.salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Проверка пароля с защитой от перебора
const verifyPassword = async (password) => {
  const ip = getIP();
  
  // Проверяем, заблокирован ли IP
  if (isIPBlocked(ip)) {
    return {
      success: false,
      blocked: true,
      remainingTime: getRemainingBlockTime(ip)
    };
  }
  
  // Проверяем, можно ли попробовать войти
  if (!canTryLogin(ip)) {
    return {
      success: false,
      blocked: true,
      remainingTime: getRemainingBlockTime(ip)
    };
  }
  
  // Хешируем пароль
  const hashedPassword = await hashPassword(password);
  const correctHash = await hashPassword('admin123');
  
  // Проверяем пароль
  if (hashedPassword === correctHash) {
    // Успешный вход - очищаем попытки
    const attempts = getLoginAttempts();
    delete attempts[ip];
    saveLoginAttempts(attempts);
    
    // Создаем сессию
    const sessionData = {
      token: generateToken(),
      createdAt: Date.now(),
      expiresAt: Date.now() + SECURITY_CONFIG.sessionTimeout
    };
    localStorage.setItem('admin_session', JSON.stringify(sessionData));
    
    return {
      success: true,
      session: sessionData
    };
  } else {
    // Неудачная попытка
    incrementAttempts(ip);
    
    // Вычисляем задержку (экспоненциальная)
    const attemptCount = getLoginAttempts()[ip]?.attempts || 1;
    const delay = Math.min(
      SECURITY_CONFIG.minDelay * Math.pow(2, attemptCount - 1),
      SECURITY_CONFIG.maxDelay
    );
    
    // Если достигнут максимум, блокируем
    if (attemptCount >= SECURITY_CONFIG.maxAttempts) {
      blockIP(ip);
      return {
        success: false,
        blocked: true,
        remainingTime: SECURITY_CONFIG.blockTime
      };
    }
    
    return {
      success: false,
      blocked: false,
      delay: delay,
      attemptsRemaining: SECURITY_CONFIG.maxAttempts - attemptCount
    };
  }
};

// Генерация токена сессии
const generateToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

// Проверка валидности сессии
const validateSession = () => {
  const sessionData = localStorage.getItem('admin_session');
  
  if (!sessionData) {
    return { valid: false };
  }
  
  try {
    const session = JSON.parse(sessionData);
    
    // Проверяем, не истекло ли время сессии
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem('admin_session');
      return { valid: false };
    }
    
    return { valid: true, session };
  } catch (e) {
    return { valid: false };
  }
};

// Завершение сессии
const endSession = () => {
  localStorage.removeItem('admin_session');
};

// Проверка, авторизован ли пользователь
const isAdmin = () => {
  const validation = validateSession();
  return validation.valid;
};

// Получить оставшееся время сессии
const getSessionRemainingTime = () => {
  const sessionData = localStorage.getItem('admin_session');
  if (!sessionData) return 0;
  
  try {
    const session = JSON.parse(sessionData);
    const remaining = session.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch (e) {
    return 0;
  }
};

// Очистка всех данных безопасности
const clearAllSecurityData = () => {
  localStorage.removeItem('admin_session');
  localStorage.removeItem('login_attempts');
  localStorage.removeItem('admin_ip');
};

export {
  verifyPassword,
  isAdmin,
  endSession,
  getSessionRemainingTime,
  clearAllSecurityData,
  getIP,
  SECURITY_CONFIG
};