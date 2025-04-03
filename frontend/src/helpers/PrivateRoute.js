import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {EMAIL_STORAGE_KEY, JWT_STORAGE_KEY} from './constants';


const PrivateRoute = ({ children, adminOnly = false }) => {
	const jwt = localStorage.getItem(JWT_STORAGE_KEY);

	if (!jwt) {
		return <Navigate to="/login" replace />;
	}

	let decoded;
	try {
		decoded = jwtDecode(jwt);
	} catch (error) {
		console.error('Ошибка декодирования токена:', error);
		return <Navigate to="/login" replace />;
	}

	const currentTime = Date.now() / 1000;

	if (decoded.exp && decoded.exp < currentTime) {
		console.warn('JWT token expired');
		localStorage.removeItem(JWT_STORAGE_KEY);
		return <Navigate to="/login" replace />;
	}

	let isAdmin = false;
	isAdmin = !!decoded.is_superuser;



	if (adminOnly && !isAdmin) {
		return <Navigate to="/control" replace />;
	}

	return children;
};

export default PrivateRoute;
