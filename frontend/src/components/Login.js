import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';
import { apiBaseUrl } from './Home';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Хук для программного перенаправления

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
      const response = await axios.post(`${apiBaseUrl}/api/v1/auth/jwt/login`,
        `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&scope=&client_id=string&client_secret=string`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
        }
      );

      if (response.status === 200 && response.data.access_token) {
        const token = response.data.access_token;
        localStorage.setItem('token', token);

        const decodedToken = jwtDecode(token);
        console.log('Decoded token:', decodedToken);

        if (decodedToken.is_superuser) {
          navigate('/admin'); // Перенаправляем на страницу админа
        } else {
          navigate('/'); // Перенаправляем на главную страницу
        }

        if (typeof onLogin === 'function') {
          onLogin();
        }
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      console.error('Login error:', err.message);
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
