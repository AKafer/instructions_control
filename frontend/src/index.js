import React from 'react';
import ReactDOM from 'react-dom';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import './index.css';
import {AuthLayout} from './layouts/AuthLayout';
import Landing from './pages/landing/Landing';
import Login from './pages/login/Login';

const router = createBrowserRouter([
	{
		path: '/',
		element: <AuthLayout/>,
		children: [
			{
				path: '/',
				element: <Landing/>
			},
			{
				path: '/login',
				element: <Login/>
			}
		]
	}
]);

ReactDOM.render(
	<React.StrictMode>
		<RouterProvider router={router}/>
	</React.StrictMode>,
	document.getElementById('root')
);