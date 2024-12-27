// src/components/Login.js

import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Импорт с фигурными скобками
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';
import { apiBaseUrl } from '../config';
import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  return (
    <div className="login-container">
      {/* Логотип с ссылкой */}
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
      </form>

      {/* Контактная информация */}
      <div className="contacts">
        <h3>Контакты</h3>
        <p>Email: <a href="mailto:i@aarsenev.ru">i@aarsenev.ru</a></p>
        <p>Телефон: <a href="tel:+79106492742">+7 910 649 27 42</a></p>
        <p>
          <a href="https://ias-control.ru/" target="_blank" rel="noopener noreferrer">IAS_Control</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
