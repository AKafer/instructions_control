import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './styles.modules.css';
import { Link } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="landing-container">
      {/* Логотип с ссылкой */}
      <Link to="/">
        <img src={logo} alt="Logo" className="control-logo" />
      </Link>

      {/* Кнопка "Войти" */}
      <button className="login-button" onClick={handleLoginClick}>
        Войти
      </button>

      {/* Лозунги */}
      <div className="slogans">
        <h1>Добро пожаловать в нашу систему</h1>
        <p>Ваш надежный партнер в управлении инструкциями</p>
      </div>

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

export default Landing;
