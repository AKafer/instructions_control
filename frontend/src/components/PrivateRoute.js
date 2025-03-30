import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Используем default импорт


const PrivateRoute = ({ children, adminOnly = false }) => {
	const token = localStorage.getItem('token');

	if (!token) {
		return <Navigate to="/login" replace />;
	}

	let isAdmin = false;
	try {
		const decoded = jwtDecode(token);
		isAdmin = decoded.is_superuser;
	} catch (error) {
		console.error('Ошибка декодирования токена:', error);
		return <Navigate to="/login" replace />;
	}

	if (adminOnly && !isAdmin) {
		return <Navigate to="/control" replace />;
	}

	return children;
};

export default PrivateRoute;
