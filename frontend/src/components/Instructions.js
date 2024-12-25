import React, { useEffect, useState } from 'react';
import axios from '../httpClient';
import DataTable from 'react-data-table-component';
import '../styles/Instructions.css';
import { apiBaseUrl } from '../config';

const Instructions = () => {
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Текущая выбранная инструкция (для редактирования, удаления)
  const [selectedInstruction, setSelectedInstruction] = useState(null);

  // Показываем ли форму создания и форму редактирования
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Поля формы создания (обратите внимание на newIteration: true)
  const [newTitle, setNewTitle] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newPeriod, setNewPeriod] = useState('');
  const [newIteration, setNewIteration] = useState(true);
  const [newFile, setNewFile] = useState(null);

  // **Состояние ошибок** для формы создания
  const [createErrors, setCreateErrors] = useState({
    title: false,
    file: false,
  });

  // Поля формы редактирования
  const [editTitle, setEditTitle] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editPeriod, setEditPeriod] = useState('');
  const [editIteration, setEditIteration] = useState(false);

  // **Подтверждение удаления**
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ------------------ HOOK: При загрузке компонента ------------------
  useEffect(() => {
    fetchAllInstructions();
  }, []);

  // ------------------ ФУНКЦИЯ ЗАГРУЗКИ ВСЕХ ИНСТРУКЦИЙ ------------------
  const fetchAllInstructions = async (inputValue = '') => {
    setLoading(true);
    const token = localStorage.getItem('token');
    let page = 1;
    const size = 50; // Размер страницы
    let allInstructions = [];
    let hasMore = true;

    try {
      while (hasMore) {
        const response = await axios.get(`${apiBaseUrl}/api/v1/instructions/`, {
          params: { page, size, search: inputValue },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const data = response.data.items || [];
        const formattedData = data.map((instruction) => ({
          ...instruction,
          link: instruction.link || '', // Убедитесь, что поле link существует
        }));

        allInstructions = [...allInstructions, ...formattedData];

        // Проверяем, есть ли ещё страницы
        if (data.length < size) {
          hasMore = false;
        } else {
          page += 1;
        }
      }

      setInstructions(allInstructions);
      console.log('Все инструкции загружены:', allInstructions);
    } catch (error) {
      console.error('Ошибка при загрузке инструкций:', error);
    } finally {
      setLoading(false);
    }
  };

  // ------------------ ВАЛИДАЦИЯ ФОРМЫ СОЗДАНИЯ ------------------
  // Проверяем, что "Название" и "Файл" заполнены
  const validateCreateForm = () => {
    const errors = {
      title: false,
      file: false,
    };
    let hasError = false;

    if (!newTitle.trim()) {
      errors.title = true;
      hasError = true;
    }
    if (!newFile) {
      errors.file = true;
      hasError = true;
    }

    setCreateErrors(errors);
    return !hasError; // true, если ошибок нет
  };

  // ------------------ СОЗДАНИЕ ------------------
  const handleCreateInstruction = async () => {
    // Сначала проверяем форму
    if (!validateCreateForm()) {
      return; // Если есть ошибки — выходим, не отправляем запрос
    }

    try {
      const token = localStorage.getItem('token');

      // Собираем FormData
      const formData = new FormData();
      formData.append('title', newTitle);
      formData.append('number', newNumber);
      formData.append('period', newPeriod);
      formData.append('iteration', newIteration);
      if (newFile) {
        formData.append('file', newFile);
      }

      // POST запрос
      await axios.post(`${apiBaseUrl}/api/v1/instructions/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Обновляем список
      await fetchAllInstructions();

      // Сбрасываем форму и ошибки
      setNewTitle('');
      setNewNumber('');
      setNewPeriod('');
      setNewIteration(true); // снова по умолчанию true
      setNewFile(null);
      setCreateErrors({ title: false, file: false });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Ошибка при создании инструкции:', error);
    }
  };

  // ------------------ РЕДАКТИРОВАНИЕ ------------------
  // Когда пользователь нажимает «Редактировать»
  const handleEditClick = () => {
    if (!selectedInstruction) return;
    setEditTitle(selectedInstruction.title || '');
    setEditNumber(selectedInstruction.number || '');
    setEditPeriod(selectedInstruction.period || '');
    setEditIteration(!!selectedInstruction.iteration);
    setShowEditForm(true);
  };

  // Сохранить изменения (PATCH multipart/form-data)
  const handleSaveEdit = async () => {
    if (!selectedInstruction) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Добавляем поля
      formData.append('title', editTitle);
      formData.append('number', editNumber);
      formData.append('period', editPeriod);
      formData.append('iteration', editIteration);

      // Если нужно редактировать файл, тоже append('file', ...)
      // Например:
      // if (newFile) {
      //   formData.append('file', newFile);
      // }

      await axios.patch(
        `${apiBaseUrl}/api/v1/instructions/${selectedInstruction.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // После успешного PATCH — список с обновлёнными данными
      await fetchAllInstructions();

      setShowEditForm(false);
      setSelectedInstruction(null);
    } catch (error) {
      console.error('Ошибка при редактировании инструкции:', error);
    }
  };

  // ------------------ УДАЛЕНИЕ ------------------
  // Вместо handleDelete вызываться будет handleDeleteClick, открывая «Вы уверены?»
  const handleDeleteClick = () => {
    if (!selectedInstruction) return;
    setShowDeleteConfirm(true); // показываем окошко подтверждения
  };

  // При нажатии «Да» в окошке
  const confirmDelete = async () => {
    if (!selectedInstruction) {
      setShowDeleteConfirm(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${apiBaseUrl}/api/v1/instructions/${selectedInstruction.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchAllInstructions();
      setSelectedInstruction(null); // сбрасываем выбор
    } catch (error) {
      console.error('Ошибка при удалении инструкции:', error);
    } finally {
      // В любом случае скрываем окно подтверждения
      setShowDeleteConfirm(false);
    }
  };

  // При нажатии «Нет»
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // ------------------ ТАБЛИЦА ------------------
  // Описание колонок, включая ссылку на файл
  const columns = [
    { name: 'ID', selector: (row) => row.id, sortable: true },
    { name: 'Название', selector: (row) => row.title, sortable: true },
    { name: 'Номер', selector: (row) => row.number, sortable: true },
    { name: 'Период', selector: (row) => row.period, sortable: true },
    {
      name: 'Итерация',
      selector: (row) => (row.iteration ? 'Да' : 'Нет'),
      sortable: true,
    },
    {
      name: 'Файл',
      cell: (row) =>
        row.link ? (
          <a href={row.link} target="_blank" rel="noopener noreferrer">
            Файл
          </a>
        ) : (
          'Нет'
        ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  // Обработчик выбора строки
  const handleSelectedRowsChange = (state) => {
    if (state.selectedRows && state.selectedRows.length > 0) {
      setSelectedInstruction(state.selectedRows[0]);
    } else {
      setSelectedInstruction(null);
    }
  };

  // ------------------ РЕНДЕР ------------------
  return (
    <div className="instructions-wrapper">
      {/* Голубая шапка */}
      <div className="instructions-header">
        <h2>Инструкции</h2>
      </div>

      {/* Кнопки */}
      <div className="instructions-buttons">
        <button
          onClick={() => {
            // При нажатии "Создать" скрываем форму редактирования
            setShowCreateForm(true);
            setShowEditForm(false);
          }}
        >
          Создать
        </button>
        <button onClick={handleEditClick} disabled={!selectedInstruction}>
          Редактировать
        </button>
        <button onClick={handleDeleteClick} disabled={!selectedInstruction}>
          Удалить
        </button>
      </div>

      {/* Форма создания (если showCreateForm == true) */}
      {showCreateForm && (
        <div
          className="form-container outlined-box"
          style={{ maxWidth: '50%', margin: '0 auto' }}
        >
          <h3>Создать инструкцию</h3>

          {/* Поле Название (обязательное поле) */}
          <div className={`field ${createErrors.title ? 'error' : ''}`}>
            <label>
              Название (обязательное поле):
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            {createErrors.title && (
              <div className="error-hint">Название обязательно</div>
            )}
          </div>

          {/* Файл (обязательное поле) */}
          <div className={`field ${createErrors.file ? 'error' : ''}`}>
            <label>
              Файл (PDF) (обязательное поле):
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setNewFile(e.target.files[0] || null)}
            />
            {createErrors.file && (
              <div className="error-hint">Файл обязателен</div>
            )}
          </div>

          <div className="field">
            <label>Номер:</label>
            <input
              type="text"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Период:</label>
            <input
              type="number"
              value={newPeriod}
              onChange={(e) => setNewPeriod(e.target.value)}
            />
          </div>

          <div className="field">
            <label>
              Итерация:
              <input
                type="checkbox"
                checked={newIteration}
                onChange={(e) => setNewIteration(e.target.checked)}
              />
            </label>
          </div>

          <div className="actions" style={{ display: 'flex', gap: '10px' }}>
            {/* Синяя кнопка */}
            <button
              style={{ backgroundColor: '#007bff', color: '#fff' }}
              onClick={handleCreateInstruction}
            >
              Создать
            </button>
            <button
              style={{ backgroundColor: '#007bff', color: '#fff' }}
              onClick={() => {
                setShowCreateForm(false);
                setNewFile(null);
                setCreateErrors({ title: false, file: false });
              }}
            >
              Отменить
            </button>
          </div>
        </div>
      )}

      {/* Форма редактирования (если showEditForm == true) */}
      {showEditForm && (
        <div
          className="form-container outlined-box"
          style={{ maxWidth: '50%', margin: '0 auto' }}
        >
          <h3>Редактировать инструкцию</h3>

          <div className="field">
            <label>Название:</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Номер:</label>
            <input
              type="text"
              value={editNumber}
              onChange={(e) => setEditNumber(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Период:</label>
            <input
              type="number"
              value={editPeriod}
              onChange={(e) => setEditPeriod(e.target.value)}
            />
          </div>

          <div className="field">
            <label>
              Итерация:
              <input
                type="checkbox"
                checked={editIteration}
                onChange={(e) => setEditIteration(e.target.checked)}
              />
            </label>
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
        data={instructions}
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
              Вы уверены, что хотите удалить инструкцию{' '}
              {selectedInstruction?.title}?
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

export default Instructions;
