// src/components/Users.jsx

import React, { useEffect, useState } from 'react';
import axios from '../httpClient';
import DataTable from 'react-data-table-component';
import '../styles/Users.css'; // Убедитесь, что файл создан и стилизован
import { apiBaseUrl } from '../config';

const Users_valid = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [professionsMap, setProfessionsMap] = useState({});
  const [divisionsMap, setDivisionsMap] = useState({});
  const [error, setError] = useState(null); // Для обработки общих ошибок

  // Состояния для формы создания пользователя
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    last_name: '',
    father_name: '',
    telegram_id: '',
    phone_number: '',
    profession_id: '',
    division_id: '',
  });
  const [createErrors, setCreateErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Индикатор отправки формы

  // ------------------ HOOK: При загрузке компонента ------------------
  useEffect(() => {
    fetchProfessions();
    fetchDivisions();
    fetchAllUsers();
  }, []);

  // ------------------ ФУНКЦИЯ ЗАГРУЗКИ ВСЕХ ПРОФЕССИЙ ------------------
  const fetchProfessions = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${apiBaseUrl}/api/v1/professions/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const professions = Array.isArray(response.data) ? response.data : response.data.items || [];
      const map = {};
      professions.forEach((profession) => {
        map[profession.id] = profession.title;
      });
      setProfessionsMap(map);
      console.log('Профессии загружены:', map);
    } catch (error) {
      console.error('Ошибка при загрузке профессий:', error);
      setError('Не удалось загрузить профессии.');
    }
  };

  // ------------------ ФУНКЦИЯ ЗАГРУЗКИ ВСЕХ ПОДРАЗДЕЛЕНИЙ ------------------
  const fetchDivisions = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${apiBaseUrl}/api/v1/divisions/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const divisions = Array.isArray(response.data) ? response.data : response.data.items || [];
      const map = {};
      divisions.forEach((division) => {
        map[division.id] = division.title;
      });
      setDivisionsMap(map);
      console.log('Подразделения загружены:', map);
    } catch (error) {
      console.error('Ошибка при загрузке подразделений:', error);
      setError('Не удалось загрузить подразделения.');
    }
  };

  // ------------------ ФУНКЦИЯ ЗАГРУЗКИ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ ------------------
  const fetchAllUsers = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    let page = 1;
    const size = 50; // Размер страницы
    let allUsers = [];
    let hasMore = true;

    try {
      while (hasMore) {
        const response = await axios.get(`${apiBaseUrl}/api/v1/users/`, {
          params: { page, size },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const data = response.data.items || [];
        allUsers = [...allUsers, ...data];

        // Проверяем, есть ли ещё страницы
        if (data.length < size) {
          hasMore = false;
        } else {
          page += 1;
        }
      }

      setUsers(allUsers);
      console.log('Все пользователи загружены:', allUsers);
    } catch (error) {
      console.error('Ошибка при загрузке пользователей:', error);
      setError('Не удалось загрузить пользователей.');
    } finally {
      setLoading(false);
    }
  };

  // ------------------ ОБРАБОТЧИК КНОПКИ "ПОДРОБНЕЕ" ------------------
  const handleDetailsClick = async (user) => {
    setSelectedUser(null);
    setShowDetailsModal(true);
    await fetchUserDetails(user.id);
  };

  // ------------------ ФУНКЦИЯ ЗАГРУЗКИ ДЕТАЛЕЙ ПОЛЬЗОВАТЕЛЯ ------------------
  const fetchUserDetails = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${apiBaseUrl}/api/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      setSelectedUser(response.data);
      console.log('Детали пользователя загружены:', response.data);
    } catch (error) {
      console.error('Ошибка при загрузке деталей пользователя:', error);
      setError('Не удалось загрузить детали пользователя.');
    }
  };

  // ------------------ ЗАКРЫТИЕ МОДАЛКИ ------------------
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  // ------------------ ФУНКЦИЯ ОБРАБОТКИ ИЗМЕНЕНИЯ ПОЛЕЙ ФОРМЫ ------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // ------------------ ВАЛИДАЦИЯ ФОРМЫ СОЗДАНИЯ ------------------
  const validateCreateForm = () => {
    const errors = {};
    let isValid = true;

    // Обязательные поля должны быть первыми
    const mandatoryFields = ['email', 'password', 'name', 'last_name', 'phone_number', 'profession_id', 'division_id'];

    mandatoryFields.forEach((field) => {
      if (!newUser[field].toString().trim()) {
        errors[field] = getFieldErrorMessage(field);
        isValid = false;
      }
    });

    // Дополнительная валидация
    if (newUser.email.trim()) {
      // Простая проверка формата email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUser.email)) {
        errors.email = 'Некорректный формат эл. почты.';
        isValid = false;
      }
    }

    if (newUser.phone_number.trim()) {
      // Простая проверка формата телефона
      const phoneRegex = /^\+?\d{10,15}$/;
      if (!phoneRegex.test(newUser.phone_number)) {
        errors.phone_number = 'Некорректный формат номера телефона.';
        isValid = false;
      }
    }

    setCreateErrors(errors);
    return isValid;
  };

  // ------------------ ФУНКЦИЯ ВЫВОДА СООБЩЕНИЯ ОБ ОШИБКЕ ПОЛЯ ------------------
  const getFieldErrorMessage = (field) => {
    const fieldNames = {
      email: 'Эл. почта обязательна.',
      password: 'Пароль обязателен.',
      name: 'Имя обязательно.',
      last_name: 'Фамилия обязательна.',
      phone_number: 'Номер телефона обязателен.',
      profession_id: 'Профессия обязательна.',
      division_id: 'Подразделение обязательно.',
    };
    return fieldNames[field] || 'Это поле обязательно.';
  };

  // ------------------ ФУНКЦИЯ СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ ------------------
  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!validateCreateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const token = localStorage.getItem('token');
    try {
      const payload = {
        email: newUser.email,
        password: newUser.password, // Теперь пароль обязателен
        name: newUser.name,
        last_name: newUser.last_name,
        father_name: newUser.father_name || null,
        telegram_id: newUser.telegram_id || null,
        phone_number: newUser.phone_number,
        profession_id: parseInt(newUser.profession_id, 10),
        division_id: parseInt(newUser.division_id, 10),
      };

      const response = await axios.post(`${apiBaseUrl}/api/v1/auth/register`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('Пользователь успешно создан:', response.data);
      alert('Пользователь успешно создан.');

      // Обновляем список пользователей
      await fetchAllUsers();

      // Сбрасываем форму
      setNewUser({
        email: '',
        password: '',
        name: '',
        last_name: '',
        father_name: '',
        telegram_id: '',
        phone_number: '',
        profession_id: '',
        division_id: '',
      });
      setCreateErrors({});
      setShowCreateForm(false);
    } catch (error) {
      console.error('Ошибка при создании пользователя:', error);
      if (error.response && error.response.status === 400) {
        // Предполагаем, что ошибка связана с уникальностью email
        setCreateErrors((prevErrors) => ({
          ...prevErrors,
          email: 'Эл. почта должна быть уникальной.',
        }));
      } else if (error.response && error.response.data && error.response.data.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Не удалось создать пользователя. Попробуйте позже.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------ ТАБЛИЦА ------------------
  const columns = [
    { name: 'Эл. почта', selector: (row) => row.email, sortable: true },
    { name: 'Имя', selector: (row) => row.name, sortable: true },
    { name: 'Фамилия', selector: (row) => row.last_name, sortable: true },
    {
      name: 'Профессия',
      selector: (row) => (row.profession_id ? professionsMap[row.profession_id] : 'Нет'),
      sortable: true,
    },
    {
      name: 'Подразделение',
      selector: (row) => (row.division_id ? divisionsMap[row.division_id] : 'Нет'),
      sortable: true,
    },
    { name: 'Номер телефона', selector: (row) => row.phone_number || 'Нет', sortable: true },
    {
      name: 'Подробнее',
      cell: (row) => (
        <button onClick={() => handleDetailsClick(row)} className="details-button">
          Подробнее
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  // Обработчик выбора строки
  const handleSelectedRowsChange = (state) => {
    // В текущей задаче выбор через кнопку "Подробнее", поэтому оставляем пустым
  };

  // ------------------ РЕНДЕР ------------------
  return (
    <div className="users-wrapper">
      {/* Голубая шапка */}
      <div className="users-header">
        <h2>Пользователи</h2>
      </div>

      {/* Кнопки */}
      <div className="users-buttons">
        <button
          onClick={() => {
            setShowCreateForm(true);
            setShowDetailsModal(false); // Закрыть модальное окно, если открыто
            setError(null); // Сбросить общие ошибки
          }}
        >
          Создать
        </button>
        <button
          onClick={() => {
            // Здесь можно добавить функционал редактирования пользователя
            // Пока оставляем без действия
            alert('Функционал редактирования пользователей будет добавлен позже.');
          }}
          disabled
        >
          Редактировать
        </button>
        <button
          onClick={() => {
            // Здесь можно добавить функционал удаления пользователя
            // Пока оставляем без действия
            alert('Функционал удаления пользователей будет добавлен позже.');
          }}
          disabled
        >
          Удалить
        </button>
      </div>

      {/* Обработка ошибок */}
      {error && <div className="error-message">{error}</div>}

      {/* Форма создания пользователя */}
      {showCreateForm && (
        <div className="form-container outlined-box">
          <h3>Создать пользователя</h3>
          <form onSubmit={handleCreateUser}>
            {/* Эл. почта (обязательное поле) */}
            <div className={`field ${createErrors.email ? 'error' : ''}`}>
              <label>Эл. почта (обязательное поле):</label>
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                placeholder="user@example.com"
              />
              {createErrors.email && <div className="error-hint">{createErrors.email}</div>}
            </div>

            {/* Пароль (обязательное поле) */}
            <div className={`field ${createErrors.password ? 'error' : ''}`}>
              <label>Пароль (обязательное поле):</label>
              <input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                placeholder="Введите пароль"
              />
              {createErrors.password && <div className="error-hint">{createErrors.password}</div>}
            </div>

            {/* Имя (обязательное поле) */}
            <div className={`field ${createErrors.name ? 'error' : ''}`}>
              <label>Имя (обязательное поле):</label>
              <input
                type="text"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                placeholder="Иван"
              />
              {createErrors.name && <div className="error-hint">{createErrors.name}</div>}
            </div>

            {/* Фамилия (обязательное поле) */}
            <div className={`field ${createErrors.last_name ? 'error' : ''}`}>
              <label>Фамилия (обязательное поле):</label>
              <input
                type="text"
                name="last_name"
                value={newUser.last_name}
                onChange={handleInputChange}
                placeholder="Иванов"
              />
              {createErrors.last_name && <div className="error-hint">{createErrors.last_name}</div>}
            </div>

            {/* Номер телефона (обязательное поле) */}
            <div className={`field ${createErrors.phone_number ? 'error' : ''}`}>
              <label>Номер телефона (обязательное поле):</label>
              <input
                type="text"
                name="phone_number"
                value={newUser.phone_number}
                onChange={handleInputChange}
                placeholder="+79032002577"
              />
              {createErrors.phone_number && <div className="error-hint">{createErrors.phone_number}</div>}
            </div>

            {/* Профессия (обязательное поле) */}
            <div className={`field ${createErrors.profession_id ? 'error' : ''}`}>
              <label>Профессия (обязательное поле):</label>
              <select
                name="profession_id"
                value={newUser.profession_id}
                onChange={handleInputChange}
              >
                <option value="">-- Выберите профессию --</option>
                {Object.entries(professionsMap).map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}
              </select>
              {createErrors.profession_id && <div className="error-hint">{createErrors.profession_id}</div>}
            </div>

            {/* Подразделение (обязательное поле) */}
            <div className={`field ${createErrors.division_id ? 'error' : ''}`}>
              <label>Подразделение (обязательное поле):</label>
              <select
                name="division_id"
                value={newUser.division_id}
                onChange={handleInputChange}
              >
                <option value="">-- Выберите подразделение --</option>
                {Object.entries(divisionsMap).map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}
              </select>
              {createErrors.division_id && <div className="error-hint">{createErrors.division_id}</div>}
            </div>

            {/* Отчество */}
            <div className="field">
              <label>Отчество:</label>
              <input
                type="text"
                name="father_name"
                value={newUser.father_name}
                onChange={handleInputChange}
                placeholder="Петрович"
              />
            </div>

            {/* Telegram ID */}
            <div className="field">
              <label>Telegram ID:</label>
              <input
                type="text"
                name="telegram_id"
                value={newUser.telegram_id}
                onChange={handleInputChange}
                placeholder="Введите Telegram ID"
              />
            </div>

            {/* Действия */}
            <div className="actions">
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Создание...' : 'Создать'}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewUser({
                    email: '',
                    password: '',
                    name: '',
                    last_name: '',
                    father_name: '',
                    telegram_id: '',
                    phone_number: '',
                    profession_id: '',
                    division_id: '',
                  });
                  setCreateErrors({});
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                Отменить
              </button>
            </div>
          </form> {/* Исправлено: закрытие формы */}
        </div>
      )}

      {/* Таблица */}
      <DataTable
        columns={columns}
        data={users}
        progressPending={loading}
        pagination
        selectableRows
        selectableRowsSingle
        onSelectedRowsChange={handleSelectedRowsChange}
        highlightOnHover
        pointerOnHover
      />

      {/* Модалка с деталями пользователя */}
      {showDetailsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {selectedUser ? (
              <>
                <h3>Детали пользователя</h3>
                <p><strong>Эл. почта:</strong> {selectedUser.email}</p>
                <p><strong>Имя:</strong> {selectedUser.name}</p>
                <p><strong>Фамилия:</strong> {selectedUser.last_name}</p>
                <p><strong>Отчество:</strong> {selectedUser.father_name || 'Нет'}</p>
                <p><strong>Профессия:</strong> {selectedUser.profession?.title || 'Нет'}</p>
                <p><strong>Подразделение:</strong> {selectedUser.division?.title || 'Нет'}</p>
                <p><strong>Телефон:</strong> {selectedUser.phone_number || 'Нет'}</p>
                <p><strong>Telegram ID:</strong> {selectedUser.telegram_id || 'Нет'}</p>
                <p><strong>Создан:</strong> {new Date(selectedUser.created_at).toLocaleString()}</p>
                <p><strong>Обновлён:</strong> {selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleString() : 'Нет'}</p>

                <h4>Инструкции:</h4>
                {selectedUser.instructions && selectedUser.instructions.length > 0 ? (
                  <table className="instructions-table">
                    <thead>
                      <tr>
                        <th>Название</th>
                        <th>Номер</th>
                        <th>Статус</th>
                        <th>Истекает через</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.instructions.map((instr) => (
                        <tr key={instr.id}>
                          <td>{instr.title}</td>
                          <td>{instr.number}</td>
                          <td>{instr.journal?.valid ? 'Действительна' : 'Не действительна'}</td>
                          <td>{instr.journal?.remain_days !== undefined ? `${instr.journal.remain_days} дней` : 'Нет'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>Нет инструкций</p>
                )}

                <button onClick={closeDetailsModal} className="close-modal-button">
                  Закрыть
                </button>
              </>
            ) : (
              <p>Загрузка...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users_valid;
