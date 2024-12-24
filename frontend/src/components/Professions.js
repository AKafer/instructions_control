import React, { useEffect, useState } from 'react';
import axios from '../httpClient';
import DataTable from 'react-data-table-component';
import '../styles/Professions.css';
import { apiBaseUrl } from '../config';

const Professions = () => {
  const [professions, setProfessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Выбранная профессия (для редактирования, удаления)
  const [selectedProfession, setSelectedProfession] = useState(null);

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

  // Показывать ли окошко подтверждения удаления
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ------------------ HOOK: При загрузке ------------------
  useEffect(() => {
    fetchProfessions();
  }, []);

  // Получение списка профессий (возвращаем массив)
  const fetchProfessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiBaseUrl}/api/v1/professions/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      // Предполагаем, что сервер возвращает массив.
      // Если же возвращает { items: [...] }, адаптируйте как нужно.
      const data = response.data;
      setProfessions(data);
      return data;
    } catch (error) {
      console.error('Error fetching professions:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ------------------ Валидация формы создания ------------------
  const validateCreateForm = () => {
    let hasError = false;
    const errors = { title: false };

    if (!newTitle.trim()) {
      errors.title = true;
      hasError = true;
    }

    setCreateErrors(errors);
    return !hasError;
  };

  // ------------------ Создание профессии ------------------
  const handleCreateProfession = async () => {
    if (!validateCreateForm()) {
      return; // если есть ошибки, не отправляем запрос
    }

    try {
      const token = localStorage.getItem('token');
      // Тело JSON
      const body = {
        title: newTitle,
        description: newDescription,
      };

      await axios.post(`${apiBaseUrl}/api/v1/professions/`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Обновляем список
      await fetchProfessions();

      // Сброс полей
      setNewTitle('');
      setNewDescription('');
      setCreateErrors({ title: false });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating profession:', error);
    }
  };

  // ------------------ Редактирование ------------------
  const handleEditClick = () => {
    if (!selectedProfession) return;
    setEditTitle(selectedProfession.title || '');
    setEditDescription(selectedProfession.description || '');
    setShowEditForm(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProfession) return;

    try {
      const token = localStorage.getItem('token');
      const body = {
        title: editTitle,
        description: editDescription,
      };

      await axios.patch(
        `${apiBaseUrl}/api/v1/professions/${selectedProfession.id}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const updated = await fetchProfessions();
      // Найдём обновлённый объект и обновим selectedProfession
      const found = updated.find((item) => item.id === selectedProfession.id);
      if (found) {
        setSelectedProfession(found);
      }
      setShowEditForm(false);
    } catch (error) {
      console.error('Error editing profession:', error);
    }
  };

  // ------------------ Удаление ------------------
  const handleDeleteClick = () => {
    if (!selectedProfession) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedProfession) {
      setShowDeleteConfirm(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${apiBaseUrl}/api/v1/professions/${selectedProfession.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchProfessions();
      setSelectedProfession(null);
    } catch (error) {
      console.error('Error deleting profession:', error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // ------------------ Таблица ------------------
  const columns = [
    { name: 'ID', selector: (row) => row.id, sortable: true },
    { name: 'Название', selector: (row) => row.title, sortable: true },
    { name: 'Описание', selector: (row) => row.description, sortable: true },
    {
      name: 'Инструкции',
      // Выводим названия инструкций, каждую на новой строке
      cell: (row) => {
        if (!row.instructions || row.instructions.length === 0) {
          return 'Нет';
        }
        // Если есть инструкции, покажем их заголовки, каждый с новой строки
        const titles = row.instructions.map((instr) => instr.title).join('\n');

        // Чтобы переносы \n работали в HTML, нужно обернуть в <pre> или использовать <div style={{whiteSpace: 'pre'}} >
        return (
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {titles}
          </div>
        );
      },
    },
  ];

  const handleSelectedRowsChange = (state) => {
    if (state.selectedRows && state.selectedRows.length > 0) {
      setSelectedProfession(state.selectedRows[0]);
    } else {
      setSelectedProfession(null);
    }
  };

  // ------------------ РЕНДЕР ------------------
  return (
    <div className="professions-wrapper">
      <div className="professions-header">
        <h2>Профессии</h2>
      </div>

      {/* Кнопки */}
      <div className="professions-buttons">
        <button
          onClick={() => {
            setShowCreateForm(true);
            setShowEditForm(false);
          }}
        >
          Создать
        </button>
        <button onClick={handleEditClick} disabled={!selectedProfession}>
          Редактировать
        </button>
        <button onClick={handleDeleteClick} disabled={!selectedProfession}>
          Удалить
        </button>
      </div>

      {/* Форма создания */}
      {showCreateForm && (
        <div
          className="form-container outlined-box"
          style={{ maxWidth: '50%', margin: '0 auto' }}
        >
          <h3>Создать профессию</h3>

          {/* Поле Title (обязательное) */}
          <div className={`field ${createErrors.title ? 'error' : ''}`}>
            <label>Название (обязательное поле):</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            {createErrors.title && (
              <div className="error-hint">Название обязательно</div>
            )}
          </div>

          <div className="field">
            <label>Описание:</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div className="actions" style={{ display: 'flex', gap: '10px' }}>
            <button
              style={{ backgroundColor: '#007bff', color: '#fff' }}
              onClick={handleCreateProfession}
            >
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
        <div
          className="form-container outlined-box"
          style={{ maxWidth: '50%', margin: '0 auto' }}
        >
          <h3>Редактировать профессию</h3>

          <div className="field">
            <label>Название:</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Описание:</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>

          <div className="actions" style={{ display: 'flex', gap: '10px' }}>
            <button
              style={{ backgroundColor: '#007bff', color: '#fff' }}
              onClick={handleSaveEdit}
            >
              Сохранить
            </button>
            <button
              style={{ backgroundColor: '#007bff', color: '#fff' }}
              onClick={() => setShowEditForm(false)}
            >
              Отменить
            </button>
          </div>
        </div>
      )}

      {/* Таблица */}
      <DataTable
        columns={columns}
        data={professions}
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
              Вы уверены, что хотите удалить профессию{' '}
              {selectedProfession?.title}?
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

export default Professions;
