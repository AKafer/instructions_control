// src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Admin, Login, Landing } from './pages';
import Control from './components/Control';
import PrivateRoute from './components/PrivateRoute'; // Создайте этот компонент

function App() {
  return (
    <Router>
      <Routes>
        {/* Стартовая страница */}
        <Route path="/" element={<Landing />} />

        {/* Страница логина */}
        <Route path="/login" element={<Login />} />

        {/* Защищенный маршрут для админа */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute adminOnly={true}>
              <Admin />
            </PrivateRoute>
          }
        />


        <Route
          path="/control"
          element={
            <PrivateRoute>
              <Control />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
