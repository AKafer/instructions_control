import React, { useState } from 'react';
import axios from 'axios';
import '../styles/LoginPage.css'; // Импорт стилей

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://0.0.0.0:8700/api/v1/auth/jwt/login',
        `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&scope=&client_id=string&client_secret=string`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
        }
      );

      console.log('Login response:', response.data);

      if (response.status === 200 && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);

        // Проверяем, что onLogin это функция
        if (typeof onLogin === 'function') {
          onLogin();
        } else {
          console.error('onLogin is not a function:', onLogin);
        }

        // Обновляем страницу после успешного логина
        window.location.href = '/';
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please check your credentials.');
    }
  };

  return (
    <div className="container">
      <form className="form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <button type="submit">Login</button>
        </div>
      </form>
    </div>
  );
};

export default Login;
