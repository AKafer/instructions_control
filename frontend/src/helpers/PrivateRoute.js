import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { JWT_STORAGE_KEY } from './constants';
import useApi from '../hooks/useApi.hook';

const PrivateRoute = ({ children, adminOnly = false }) => {
	const [checking, setChecking] = useState(true);
	const [allowed,  setAllowed]  = useState(false);
	const api = useApi();

	useEffect(() => {
		const verify = async () => {
			let token = localStorage.getItem(JWT_STORAGE_KEY);
			let needRefresh = true;

			if (token) {
				try {
					const { exp } = jwtDecode(token);
					needRefresh = exp < Date.now() / 1000;
				} catch {
					needRefresh = true;
				}
			}

			if (needRefresh) {
				try {
					const { data } = await api.post(
						'/auth/jwt/refresh',
						{},
						{ withCredentials: true }
					);
					token = data.access_token;
					localStorage.setItem(JWT_STORAGE_KEY, token);
				} catch {
					token = null;
				}
			}

			if (!token) {
				setAllowed(false);
				setChecking(false);
				return;
			}

			try {
				const { is_superuser } = jwtDecode(token);
				setAllowed(!adminOnly || Boolean(is_superuser));
			} catch {
				setAllowed(false);
			}

			setChecking(false);
		};

		verify();
	}, [adminOnly, api]);

	if (checking) {return <div>Загружаем…</div>;}
	return allowed
		? children
		: <Navigate to="/login" replace />;
};

export default PrivateRoute;
