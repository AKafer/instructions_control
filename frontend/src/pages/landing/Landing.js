import React from 'react';
import {useNavigate} from 'react-router-dom';
import styles from './Landing.module.css';

const Landing = () => {
	const navigate = useNavigate();
	const handleLoginClick = () => {
		navigate('/login');
	};

	return (
		<div className={styles['landing-container']}>
			<div className={styles['slogans']}>
				<h1>Добро пожаловать в нашу систему</h1>
				<p>Ваш надежный партнер в управлении учетными данными</p>
			</div>

			<button className="login-button" onClick={handleLoginClick}>
        		Войти
			</button>
			<div className={styles['contacts']}>
				<h3>Контакты</h3>
				<p>Email: <a href="mailto:i@aarsenev.ru">i@aarsenev.ru</a></p>
				<p>Телефон: <a href="tel:+79106492742">+7 910 649 27 42</a></p>
				<p>Наш сайт: <a href="https://ias-control.ru/" target="_blank" rel="noopener noreferrer">IAS_Control</a></p>
			</div>
		</div>
	);
};

export default Landing;
