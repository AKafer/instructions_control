import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import '../styles/AdminHeader.css';  // Голубая шапка
import '../styles/AdminMenu.css';    // Вертикальное меню
import Professions from './Professions';
import Instructions from './Instructions';
import Divisions from './Divisions';

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
        <Link to="divisions" className="admin-menu-item"> {/* Добавляем ссылку на подразделения */}
          Подразделения
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
          <Route path="divisions" element={<Divisions />} /> {/* Добавляем маршрут */}
          {/* <Route path="tests" element={<Tests />} /> */}
        </Routes>
      </div>
    </div>
  );
};

export default Admin;
