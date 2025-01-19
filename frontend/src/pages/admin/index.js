// src/components/Admin.js

import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import './AdminHeader.css';
import './AdminMenu.css';
import Professions from '../../components/Professions';
import { Instructions } from '../index';
import Divisions from '../../components/Divisions';
import Users from '../../components/Users';

const Admin = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div>
      <header className="admin-header">
        <h1>Панель администратора</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>

      {/* Меню (вертикальные синие прямоугольники) */}
      <nav className="admin-menu">
        <Link to="professions" className="admin-menu-item">
          Профессии
        </Link>
        <Link to="instructions" className="admin-menu-item">
          Инструкции
        </Link>
        <Link to="divisions" className="admin-menu-item">
          Подразделения
        </Link>
        <Link to="users" className="admin-menu-item"> {/* Добавляем ссылку на пользователей */}
          Пользователи
        </Link>
        <Link to="tests" className="admin-menu-item">
          Тесты
        </Link>
      </nav>

      {/* Вложенные роуты */}
      <div style={{ marginTop: '20px' }}>
        <Routes>
          <Route path="professions" element={<Professions />} />
          <Route path="instructions" element={<Instructions />} />
          <Route path="divisions" element={<Divisions />} />
          <Route path="users" element={<Users />} /> {/* Добавляем маршрут */}
          {/* <Route path="tests" element={<Tests />} /> */}
        </Routes>
      </div>
    </div>
  );
};

export default Admin;
