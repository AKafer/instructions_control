// src/components/Divisions.jsx

import React, { useEffect, useState } from 'react';
import axios from '../httpClient';
import DataTable from 'react-data-table-component';
import '../styles/Divisions.css'; // Создайте этот файл
import { apiBaseUrl } from '../config';

const Divisions = () => {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Выбранное подразделение (для редактирования, удаления)
  const [selectedDivision, setSelectedDivision] = useState(null);

  // Показ формы создания / редактирования
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Поля формы создания (обязательное поле title)
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Ошибки формы создания (только title обязателен)
  const [createErrors, setCreateErrors] = useState({
    title: false,
  });

  // Поля формы редактирования
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Подтверждение удаления
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ------------------ HOOK: При загрузке компонента ------------------
  useEffect(() => {
    fetchDivisions();
  }, []);

  // ------------------ ФУНКЦИЯ ЗАГРУЗКИ ВСЕХ ПОДРАЗДЕЛЕНИЙ ------------------
  const fetchDivisions = async (inputValue = '') => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.get(`${apiBaseUrl}/api/v1/divisions/`, {
        params: { search: inputValue }, // Если поддерживается поиск
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      // Предполагаем, что ответ API - это массив подразделений
      const data = Array.isArray(response.data) ? response.data : response.data.items || [];
      setDivisions(data);
      console.log('Все подразделения загружены:', data);
    } catch (error) {
      console.error('Ошибка при загрузке подразделений:', error);
    } finally {
      setLoading(false);
    }
  };

  // ------------------ ВАЛИДАЦИЯ ФОРМЫ СОЗДАНИЯ ------------------
  const validateCreateForm = () => {
    let hasError = false;
    const errors = { title: false };

    if (!newTitle.trim()) {
      errors.title = true;
      hasError = true;
    }

    setCreateErrors(errors);
    return !hasError; // true, если ошибок нет
  };

  // ------------------ СОЗДАНИЕ ------------------
  const handleCreateDivision = async () => {
    if (!validateCreateForm()) {
      return; // если есть ошибки, не отправляем запрос
    }

    try {
      const token = localStorage.getItem('token');
      const body = {
        title: newTitle,
        description: newDescription,
      };

      // Создаем подразделение
      await axios.post(`${apiBaseUrl}/api/v1/divisions/`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Обновляем список
      await fetchDivisions();

      // Сброс полей
      setNewTitle('');
      setNewDescription('');
      setCreateErrors({ title: false });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Ошибка при создании подразделения:', error);
    }
  };

  // ------------------ РЕДАКТИРОВАНИЕ ------------------
  const handleEditClick = () => {
    if (!selectedDivision) return;
    setEditTitle(selectedDivision.title || '');
    setEditDescription(selectedDivision.description || '');
    setShowEditForm(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDivision) return;

    try {
      const token = localStorage.getItem('token');
      const body = {
        title: editTitle,
        description: editDescription,
      };

      // Обновляем подразделение
      await axios.patch(`${apiBaseUrl}/api/v1/divisions/${selectedDivision.id}`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Обновляем список
      await fetchDivisions();

      setShowEditForm(false);
      setSelectedDivision(null);
    } catch (error) {
      console.error('Ошибка при редактировании подразделения:', error);
    }
  };

  // ------------------ УДАЛЕНИЕ ------------------
  const handleDeleteClick = () => {
    if (!selectedDivision) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedDivision) {
      setShowDeleteConfirm(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${apiBaseUrl}/api/v1/divisions/${selectedDivision.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Обновляем список
      await fetchDivisions();
      setSelectedDivision(null);
    } catch (error) {
      console.error('Ошибка при удалении подразделения:', error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // ------------------ ТАБЛИЦА ------------------
  const columns = [
    { name: 'ID', selector: (row) => row.id, sortable: true },
    { name: 'Название', selector: (row) => row.title, sortable: true },
    { name: 'Описание', selector: (row) => row.description, sortable: true },
  ];

  const handleSelectedRowsChange = (state) => {
    if (state.selectedRows && state.selectedRows.length > 0) {
      setSelectedDivision(state.selectedRows[0]);
    } else {
      setSelectedDivision(null);
    }
  };

  // ------------------ РЕНДЕР ------------------
  return (
    <div className="divisions-wrapper">
      <div className="divisions-header">
        <h2>Подразделения</h2>
      </div>

      {/* Кнопки */}
      <div className="divisions-buttons">
        <button
          onClick={() => {
            setShowCreateForm(true);
            setShowEditForm(false);
          }}
        >
          Создать
        </button>
        <button onClick={handleEditClick} disabled={!selectedDivision}>
          Редактировать
        </button>
        <button onClick={handleDeleteClick} disabled={!selectedDivision}>
          Удалить
        </button>
      </div>

      {/* Форма создания */}
      {showCreateForm && (
        <div className="form-container outlined-box" style={{ maxWidth: '50%', margin: '0 auto' }}>
          <h3>Создать подразделение</h3>

          {/* Поле Название (обязательное поле) */}
          <div className={`field ${createErrors.title ? 'error' : ''}`}>
            <label>Название (обязательное поле):</label>
            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            {createErrors.title && <div className="error-hint">Название обязательно</div>}
          </div>

          <div className="field">
            <label>Описание:</label>
            <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          </div>

          <div className="actions" style={{ display: 'flex', gap: '10px' }}>
            <button style={{ backgroundColor: '#007bff', color: '#fff' }} onClick={handleCreateDivision}>
              Создать
            </button>
            <button
              style={{ backgroundColor: '#007bff', color: '#fff' }}
              onClick={() => {
                setShowCreateForm(false);
                setCreateErrors({ title: false });
                setNewTitle('');
                setNewDescription('');
              }}
            >
              Отменить
            </button>
          </div>
        </div>
      )}

      {/* Форма редактирования */}
      {showEditForm && (
        <div className="form-container outlined-box" style={{ maxWidth: '50%', margin: '0 auto' }}>
          <h3>Редактировать подразделение</h3>

          <div className="field">
            <label>Название:</label>
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>

          <div className="field">
            <label>Описание:</label>
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
          </div>

          <div className="actions" style={{ display: 'flex', gap: '10px' }}>
            <button style={{ backgroundColor: '#007bff', color: '#fff' }} onClick={handleSaveEdit}>
              Сохранить
            </button>
            <button
              style={{ backgroundColor: '#007bff', color: '#fff' }}
              onClick={() => {
                setShowEditForm(false);
                setSelectedDivision(null);
              }}
            >
              Отменить
            </button>
          </div>
        </div>
      )}

      {/* Таблица */}
      <DataTable
        columns={columns}
        data={divisions}
        progressPending={loading}
        pagination
        selectableRows
        selectableRowsSingle
        onSelectedRowsChange={handleSelectedRowsChange}
        highlightOnHover
        pointerOnHover
      />

      {/* Модалка подтверждения удаления */}
      {showDeleteConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p>
              Вы уверены, что хотите удалить подразделение <strong>{selectedDivision?.title}</strong>?
            </p>
            <div className="confirm-actions">
              <button onClick={confirmDelete}>Да</button>
              <button onClick={cancelDelete}>Нет</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Divisions;
