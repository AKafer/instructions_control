import styles from './Profile.module.css';
import Button from '../../Button/Button';
import {EMAIL_STORAGE_KEY, JWT_STORAGE_KEY} from '../../../helpers/constants';
import {useNavigate} from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';

export function Profile() {
	const navigate = useNavigate();

	const jwt = localStorage.getItem(JWT_STORAGE_KEY);
	console.log(jwt);
	const decoded = jwtDecode(jwt);
	console.log(decoded);

	const LogOut = () => {
		localStorage.removeItem(JWT_STORAGE_KEY);
		navigate('/');
	};

	return (
		<div className={styles['help']}>
			<div className={styles['content']}>
				<div className={styles['title']}>
					Профиль: {decoded.email}
				</div>
			</div>
			<div className={styles['button']}>
				<Button onClick={LogOut}>
					Выход
				</Button>
			</div>
		</div>
	);
}