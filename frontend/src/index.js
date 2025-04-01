import React from 'react';
import ReactDOM from 'react-dom';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import './index.css';
import {AuthLayout} from './layouts/AuthLayout/AuthLayout';
import Landing from './pages/Auth/Landing/Landing';
import Login from './pages/Auth/Login/Login';
import {ControlLayout} from './layouts/ControlLayout/ControlLayout';
import Users from './components/Users';
import {AdminLayout} from './layouts/AdminLayout/AdminLayout';
import {ControlInstructions} from './pages/Control/ControlInstructions/ControlInstructions';
import PrivateRoute from './helpers/PrivateRoute';

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
	},
	{
		path: '/admin',
		element: <PrivateRoute adminOnly><AdminLayout/></PrivateRoute>,
		children: [
			{
				path: '/admin/users',
				element: <Users/>
			}
		]
	},
	{
		path: '/control',
		element: <PrivateRoute><ControlLayout/></PrivateRoute>,
		children: [
			{
				path: '/control/instructions',
				element: <ControlInstructions/>
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