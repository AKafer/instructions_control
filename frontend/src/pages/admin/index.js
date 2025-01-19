import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './AdminHeader.css';
import Professions from '../../components/Professions';
import { Instructions } from '../index';
import Divisions from '../../components/Divisions';
import Users from '../../components/Users';
import {Button, ButtonBox, Main} from '../../components'; // Импорт компонента Button

const Admin = () => {
  const navigate = useNavigate(); // Инициализация хука
  const [selectedInstruction, setSelectedInstruction] = useState(null); // Пример состояния

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return <Main>
      <header className="admin-header">
        <h1>Панель администратора</h1>
        <Button
          modifier='style_light-blue'
          clickHandler={handleLogout}
        >
          Logout
        </Button>
      </header>

      {/* Меню (вертикальные синие прямоугольники) */}
      <ButtonBox>
        <Button
          modifier='style_dark-blue'
          to="professions"
        >
          Профессии
        </Button>

        <Button
          modifier='style_dark-blue'
          to="instructions"
        >
          Инструкции
        </Button>

        <Button
          modifier='style_dark-blue'
          to="divisions"
        >
          Подразделения
        </Button>

        <Button
          modifier='style_dark-blue'
          className="admin-menu-item"
          to="users"
        >
          Пользователи
        </Button>

        <Button
          modifier='style_dark-blue'
          to="tests"
        >
          Тесты
        </Button>
      </ButtonBox>

      {/* Вложенные роуты */}
      <div style={{ marginTop: '20px' }}>
        <Routes>
          <Route path="professions" element={<Professions />} />
          <Route path="instructions" element={<Instructions />} />
          <Route path="divisions" element={<Divisions />} />
          <Route path="users" element={<Users />} />
          {/* <Route path="tests" element={<Tests />} /> */}
        </Routes>
      </div>
  </Main>;
};

export default Admin;
