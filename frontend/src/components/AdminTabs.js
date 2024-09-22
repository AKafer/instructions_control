import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/AdminTabs.css';

const AdminTabs = () => {
  const location = useLocation();

  return (
    <div className="tabs-container">
      <Link
        to="/admin/professions"
        className={`tab-item ${location.pathname === '/admin/professions' ? 'active' : ''}`}
      >
        Профессии
      </Link>
    </div>
  );
};

export default AdminTabs;
