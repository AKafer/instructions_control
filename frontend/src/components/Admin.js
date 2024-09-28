import React from 'react';
import Professions from './Professions';

const Admin = () => {
  return (
    <div>
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }}>
          Logout
        </button>
      </header>
      <Professions />
    </div>
  );
};

export default Admin;
