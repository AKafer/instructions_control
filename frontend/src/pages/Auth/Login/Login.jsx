import {useNavigate} from 'react-router-dom';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import {JWT_STORAGE_KEY, loginUrl, PREFIX} from '../../../helpers/constants';
import styles from './Login.module.css';
import {useState} from 'react';
import useApi from '../../../hooks/useApi.hook';



const Login = () => {
	const api = useApi();
	const navigate = useNavigate();
	const [error, setError] = useState(undefined);

	const sendLogin = async (email, password) => {
		try {
			const params = new URLSearchParams();
			params.append('username', email);
			params.append('password', password);
			const {data} = await api.post(
				loginUrl,
				params,
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded'
					}
				});
			localStorage.setItem(JWT_STORAGE_KEY, data['access_token']);
			navigate('/admin');
		} catch (e) {
			setError(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	const submit = (e) => {
		e.preventDefault();
		setError(undefined);
		const target = e.target;
		const {email, password} = target;
		sendLogin(email.value, password.value);
	};

	return (
		<div className={styles['login']}>
			{error && <div className={styles['error']}>{error}</div>}
			<form className={styles['form']} onSubmit={submit}>
				<div className={styles['field']}>
					<label htmlFor="email">Ваш email</label>
					<Input id="email" placeholder='Email'/>
				</div>
				<div className={styles['field']}>
					<label htmlFor="password">Ваш пароль</label>
					<Input id="password" type="password" placeholder='Пароль'/>
				</div>
				<Button data-testid="nav-login-button" appearance="big">Вход</Button>
			</form>
		</div>
	);
};

export default Login;