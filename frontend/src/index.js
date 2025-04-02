import React from 'react';
import ReactDOM from 'react-dom';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import './index.css';
import {AuthLayout} from './layouts/AuthLayout/AuthLayout';
import Landing from './pages/Auth/Landing/Landing';
import Login from './pages/Auth/Login/Login';
import {ControlLayout} from './layouts/ControlLayout/ControlLayout';
import {AdminLayout} from './layouts/AdminLayout/AdminLayout';
import {ControlInstructions} from './pages/Control/ControlInstructions/ControlInstructions';
import PrivateRoute from './helpers/PrivateRoute';
import {Statistic} from './pages/Admin/Statistic/Statistic';
import {Users} from './pages/Admin/Users/Users';
import {Education} from './pages/Admin/Education/Education';
import {SIZ} from './pages/Admin/SIZ/SIZ';
import {Medicine} from './pages/Admin/Medicine/Medicine';
import {Terminal} from './pages/Admin/Terminal/Terminal';
import {Instructions} from './pages/Admin/Instructions/Instructions';

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
				path: '/admin',
				element: <Statistic/>
			},
			{
				path: '/admin/users',
				element: <Users/>
			},
			{
				path: '/admin/instructions',
				element: <Instructions/>
			},
			{
				path: '/admin/education',
				element: <Education/>
			},
			{
				path: '/admin/SIZ',
				element: <SIZ/>
			},
			{
				path: '/admin/medicine',
				element: <Medicine/>
			},
			{
				path: '/admin/terminal',
				element: <Terminal/>
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