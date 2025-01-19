import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, Link } from 'react-router-dom';
import { apiBaseUrl } from '../../config';
import logo from '../../assets/logo.png';
import './styles.modules.css';

// Импорт библиотеки html5-qrcode
import { Html5Qrcode } from 'html5-qrcode';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Управление отображением модуля сканирования QR
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Ссылка на DOM-элемент для камеры
  const qrScannerRef = useRef(null);

  // Храним текущий экземпляр html5QrCode (stop/clear)
  const html5QrCodeRef = useRef(null);

  // ID для html5-qrcode
  const html5QrCodeId = 'qr-scanner-region';

  // ===== Проверка доступности сервера =====
  const checkServerAvailability = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/ping/`, {
        maxRedirects: 0,
        timeout: 5000,
      });
      console.log('Server is reachable. Status:', response.status);
    } catch (error) {
      console.error('Server check error:', error.message);
    }
  };

  // ===== Логин по email / паролю =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login form submitted');

    await checkServerAvailability();

    try {
      const response = await axios.post(
        `${apiBaseUrl}/api/v1/auth/jwt/login`,
        `grant_type=password&username=${encodeURIComponent(
          email
        )}&password=${encodeURIComponent(
          password
        )}&scope=&client_id=string&client_secret=string`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        }
      );

      if (response.status === 200 && response.data.access_token) {
        const token = response.data.access_token;
        localStorage.setItem('token', token);

        const decodedToken = jwtDecode(token);
        console.log('Decoded token:', decodedToken);

        if (decodedToken.is_superuser) {
          navigate('/admin');
        } else {
          navigate('/control');
        }
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      console.error('Login error:', err.message);
      setError('Не удалось войти. Проверьте свои учетные данные.');
    }
  };

  // ===== Инициализация QR-сканера =====
  useEffect(() => {
    let html5QrCode = null;

    if (showQRScanner) {
      // Создаём экземпляр Html5Qrcode
      html5QrCode = new Html5Qrcode(html5QrCodeId);
      html5QrCodeRef.current = html5QrCode;

      // Запускаем камеру и сканируем
      html5QrCode
        .start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: 250,
          },
          (decodedText /*, decodedResult*/) => {
            console.log('QR code detected:', decodedText);
            // НЕ вызываем .stop() здесь, чтобы не было двойного остановa
            // Просто запускаем логику QR-входа
            handleQRLogin(decodedText);
          },
          (errorMessage) => {
            // Часто "No QR code found"
          }
        )
        .catch((err) => {
          console.error('Failed to start QR scanner', err);
          setError(`Ошибка при запуске сканера: ${err}`);
        });
    }

    // Очистка при размонтировании / закрытии
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => html5QrCodeRef.current.clear())
          .catch((err) => console.warn('Cannot stop or clear scanner', err))
          .finally(() => {
            html5QrCodeRef.current = null;
          });
      }
    };
  }, [showQRScanner]);

  // ===== Обработчик входа по QR =====
  const handleQRLogin = async (qrData) => {
    try {
      console.log('handleQRLogin with data:', qrData);

      // Отправляем qrData как x-www-form-urlencoded
      const response = await axios.post(
        `${apiBaseUrl}/api/v1/auth/jwt/login`,
        qrData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        }
      );

      if (response.status === 200 && response.data.access_token) {
        const token = response.data.access_token;
        localStorage.setItem('token', token);

        const decodedToken = jwtDecode(token);
        console.log('Decoded token from QR:', decodedToken);

        if (decodedToken.is_superuser) {
          navigate('/admin');
        } else {
          navigate('/control');
        }
      } else {
        setError('Не удалось получить токен после скана QR.');
      }
    } catch (err) {
      setError(`Ошибка при входе по QR: ${err.message}`);
    } finally {
      // Сворачиваем оверлей
      setShowQRScanner(false);
    }
  };

  // ===== Обработчик "Отмена" =====
  const handleCancelQR = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.warn('Stop error:', e);
      }
      try {
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Clear error:', e);
      }
      html5QrCodeRef.current = null;
    }
    setShowQRScanner(false);
  };

  // ===== Вёрстка =====
  return (
    <div className="login-container">
      {/* Логотип */}
      <Link to="/">
        <img src={logo} alt="Logo" className="control-logo" />
      </Link>

      {/* Форма входа */}
      <form className="form" onSubmit={handleSubmit}>
        <h2>Вход</h2>
        {error && <p className="error-text">{error}</p>}

        <div className="form-group">
          <label htmlFor="email">Электронная почта:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="i@aarsenev.ru"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Пароль:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Введите пароль"
          />
        </div>

        <div className="form-group">
          <button type="submit" className="submit-button">
            Войти
          </button>
        </div>

        {/* Кнопка для входа через QR */}
        <div className="form-group">
          <button
            type="button"
            className="qr-button"
            onClick={() => setShowQRScanner(true)}
          >
            Войти по QR
          </button>
        </div>
      </form>

      {/* Контакты */}
      <div className="contacts">
        <h3>Контакты</h3>
        <p>
          Email: <a href="mailto:i@aarsenev.ru">i@aarsenev.ru</a>
        </p>
        <p>
          Телефон: <a href="tel:+79106492742">+7 910 649 27 42</a>
        </p>
        <p>
          <a
            href="https://ias-control.ru/"
            target="_blank"
            rel="noopener noreferrer"
          >
            IAS_Control
          </a>
        </p>
      </div>

      {/* Оверлей для сканирования */}
      {showQRScanner && (
        <div className="qr-scanner-overlay">
          <h3>Сканируйте QR-код</h3>
          <div
            id={html5QrCodeId}
            ref={qrScannerRef}
            style={{ width: '400px', margin: '0 auto' }}
          />
          <button onClick={handleCancelQR} className="cancel-qr-button">
            Отмена
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
