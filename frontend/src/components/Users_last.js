// src/components/Users.jsx

import React, { useEffect, useState } from 'react';
import axios from '../httpClient';
import DataTable from 'react-data-table-component';
import '../styles/Users.css'; // Убедитесь, что файл создан
import { apiBaseUrl } from '../config';

const Users_last = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [professionsMap, setProfessionsMap] = useState({});
  const [divisionsMap, setDivisionsMap] = useState({});
  const [error, setError] = useState(null); // Для обработки общих ошибок

  // Состояния для формы создания/редактирования пользователя
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [formUser, setFormUser] = useState({
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
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Индикатор отправки формы

  // Состояния для модального окна удаления
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

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

  // ------------------ ЗАКРЫТИЕ МОДАЛЬНЫХ ОКОН ------------------
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // ------------------ ФУНКЦИЯ ОБРАБОТКИ ИЗМЕНЕНИЯ ПОЛЕЙ ФОРМЫ ------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormUser((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // ------------------ ВАЛИДАЦИЯ ФОРМЫ СОЗДАНИЯ И РЕДАКТИРОВАНИЯ ------------------
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Обязательные поля для создания и редактирования
    const mandatoryFields = ['email', 'name', 'last_name', 'phone_number', 'profession_id', 'division_id'];

    if (!isEditMode) {
      // В режиме создания пароль обязателен
      mandatoryFields.push('password');
    }

    mandatoryFields.forEach((field) => {
      if (!formUser[field].toString().trim()) {
        errors[field] = getFieldErrorMessage(field);
        isValid = false;
      }
    });

    // Дополнительная валидация
    if (formUser.email.trim()) {
      // Простая проверка формата email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formUser.email)) {
        errors.email = 'Некорректный формат эл. почты.';
        isValid = false;
      }
    }

    if (formUser.phone_number.trim()) {
      // Простая проверка формата телефона
      const phoneRegex = /^\+?\d{10,15}$/;
      if (!phoneRegex.test(formUser.phone_number)) {
        errors.phone_number = 'Некорректный формат номера телефона.';
        isValid = false;
      }
    }

    setFormErrors(errors);
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

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const token = localStorage.getItem('token');
    try {
      const payload = {
        email: formUser.email,
        password: formUser.password, // Пароль теперь обязателен
        name: formUser.name,
        last_name: formUser.last_name,
        father_name: formUser.father_name || null,
        telegram_id: formUser.telegram_id || null,
        phone_number: formUser.phone_number,
        profession_id: parseInt(formUser.profession_id, 10),
        division_id: parseInt(formUser.division_id, 10),
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
      setFormUser({
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
      setFormErrors({});
      setShowForm(false);
    } catch (error) {
      console.error('Ошибка при создании пользователя:', error);
      if (error.response && error.response.status === 400) {
        // Предполагаем, что ошибка связана с уникальностью email
        setFormErrors((prevErrors) => ({
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

  // ------------------ ФУНКЦИЯ РЕДАКТИРОВАНИЯ ПОЛЬЗОВАТЕЛЯ ------------------
  const handleEditUser = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const token = localStorage.getItem('token');
    try {
      const payload = {};

      // Добавляем только заполненные поля
      Object.keys(formUser).forEach((key) => {
        if (formUser[key].toString().trim() !== '') {
          if (key === 'profession_id' || key === 'division_id') {
            payload[key] = parseInt(formUser[key], 10);
          } else {
            payload[key] = formUser[key];
          }
        }
      });

      const response = await axios.patch(`${apiBaseUrl}/api/v1/users/${currentUserId}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('Пользователь успешно обновлён:', response.data);
      alert('Пользователь успешно обновлён.');

      // Обновляем список пользователей
      await fetchAllUsers();

      // Сбрасываем форму
      setFormUser({
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
      setFormErrors({});
      setShowForm(false);
      setIsEditMode(false);
      setCurrentUserId(null);
    } catch (error) {
      console.error('Ошибка при обновлении пользователя:', error);
      if (error.response && error.response.status === 400) {
        // Предполагаем, что ошибка связана с уникальностью email
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          email: 'Эл. почта должна быть уникальной.',
        }));
      } else if (error.response && error.response.data && error.response.data.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Не удалось обновить пользователя. Попробуйте позже.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------ ФУНКЦИЯ УДАЛЕНИЯ ПОЛЬЗОВАТЕЛЯ ------------------
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsSubmitting(true);
    setError(null);

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${apiBaseUrl}/api/v1/users/${userToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      console.log('Пользователь успешно удалён:', userToDelete);
      alert('Пользователь успешно удалён.');

      // Обновляем список пользователей
      await fetchAllUsers();

      // Закрываем модальное окно
      closeDeleteModal();
    } catch (error) {
      console.error('Ошибка при удалении пользователя:', error);
      setError('Не удалось удалить пользователя. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------ ОБРАБОТЧИК КНОПКИ "РЕДАКТИРОВАТЬ" ------------------
  const handleEditClick = () => {
    if (!selectedUser) {
      alert('Пожалуйста, выберите пользователя для редактирования.');
      return;
    }

    setShowForm(true);
    setIsEditMode(true);
    setCurrentUserId(selectedUser.id);
    setFormUser({
      email: selectedUser.email || '',
      password: '', // Пароль не предзаполняется
      name: selectedUser.name || '',
      last_name: selectedUser.last_name || '',
      father_name: selectedUser.father_name || '',
      telegram_id: selectedUser.telegram_id || '',
      phone_number: selectedUser.phone_number || '',
      profession_id: selectedUser.profession_id ? selectedUser.profession_id.toString() : '',
      division_id: selectedUser.division_id ? selectedUser.division_id.toString() : '',
    });
    setFormErrors({});
    setError(null);
  };

  // ------------------ ОБРАБОТЧИК КНОПКИ "УДАЛИТЬ" ------------------
  const handleDeleteClick = () => {
    if (!selectedUser) {
      alert('Пожалуйста, выберите пользователя для удаления.');
      return;
    }

    setUserToDelete(selectedUser);
    setShowDeleteModal(true);
    setError(null);
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
    const selected = state.selectedRows[0];
    setSelectedUser(selected || null);
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
            setShowForm(true);
            setIsEditMode(false);
            setCurrentUserId(null);
            setFormUser({
              email: '',
              password: '',
              name: '',
              last_name: '',
              father_name: '',
              telegram_id: '',
              phone_number: '',
              profession_id: '',
              division_id: '',
            }); // Сбросить форму при открытии
            setFormErrors({});
            setError(null);
          }}
        >
          Создать
        </button>
        <button onClick={handleEditClick} disabled={!selectedUser}>
          Редактировать
        </button>
        <button onClick={handleDeleteClick} disabled={!selectedUser}>
          Удалить
        </button>
      </div>

      {/* Обработка ошибок */}
      {error && <div className="error-message">{error}</div>}

      {/* Форма создания/редактирования пользователя */}
      {showForm && (
        <div className="form-container outlined-box">
          <h3>{isEditMode ? 'Редактировать пользователя' : 'Создать пользователя'}</h3>
          <form onSubmit={isEditMode ? handleEditUser : handleCreateUser}>
            {/* Эл. почта (обязательное поле) */}
            <div className={`field ${formErrors.email ? 'error' : ''}`}>
              <label>Эл. почта (обязательное поле):</label>
              <input
                type="email"
                name="email"
                value={formUser.email}
                onChange={handleInputChange}
                placeholder="user@example.com"
              />
              {formErrors.email && <div className="error-hint">{formErrors.email}</div>}
            </div>

            {/* Пароль (обязательное поле при создании) */}
            {!isEditMode && (
              <div className={`field ${formErrors.password ? 'error' : ''}`}>
                <label>Пароль (обязательное поле):</label>
                <input
                  type="password"
                  name="password"
                  value={formUser.password}
                  onChange={handleInputChange}
                  placeholder="Введите пароль"
                />
                {formErrors.password && <div className="error-hint">{formErrors.password}</div>}
              </div>
            )}

            {/* Имя (обязательное поле) */}
            <div className={`field ${formErrors.name ? 'error' : ''}`}>
              <label>Имя (обязательное поле):</label>
              <input
                type="text"
                name="name"
                value={formUser.name}
                onChange={handleInputChange}
                placeholder="Иван"
              />
              {formErrors.name && <div className="error-hint">{formErrors.name}</div>}
            </div>

            {/* Фамилия (обязательное поле) */}
            <div className={`field ${formErrors.last_name ? 'error' : ''}`}>
              <label>Фамилия (обязательное поле):</label>
              <input
                type="text"
                name="last_name"
                value={formUser.last_name}
                onChange={handleInputChange}
                placeholder="Иванов"
              />
              {formErrors.last_name && <div className="error-hint">{formErrors.last_name}</div>}
            </div>

            {/* Номер телефона (обязательное поле) */}
            <div className={`field ${formErrors.phone_number ? 'error' : ''}`}>
              <label>Номер телефона (обязательное поле):</label>
              <input
                type="text"
                name="phone_number"
                value={formUser.phone_number}
                onChange={handleInputChange}
                placeholder="+79032002577"
              />
              {formErrors.phone_number && <div className="error-hint">{formErrors.phone_number}</div>}
            </div>

            {/* Профессия (обязательное поле) */}
            <div className={`field ${formErrors.profession_id ? 'error' : ''}`}>
              <label>Профессия (обязательное поле):</label>
              <select
                name="profession_id"
                value={formUser.profession_id}
                onChange={handleInputChange}
              >
                <option value="">-- Выберите профессию --</option>
                {Object.entries(professionsMap).map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}
              </select>
              {formErrors.profession_id && <div className="error-hint">{formErrors.profession_id}</div>}
            </div>

            {/* Подразделение (обязательное поле) */}
            <div className={`field ${formErrors.division_id ? 'error' : ''}`}>
              <label>Подразделение (обязательное поле):</label>
              <select
                name="division_id"
                value={formUser.division_id}
                onChange={handleInputChange}
              >
                <option value="">-- Выберите подразделение --</option>
                {Object.entries(divisionsMap).map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}
              </select>
              {formErrors.division_id && <div className="error-hint">{formErrors.division_id}</div>}
            </div>

            {/* Отчество */}
            <div className="field">
              <label>Отчество:</label>
              <input
                type="text"
                name="father_name"
                value={formUser.father_name}
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
                value={formUser.telegram_id}
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
                {isSubmitting ? (isEditMode ? 'Обновление...' : 'Создание...') : (isEditMode ? 'Обновить' : 'Создать')}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowForm(false);
                  setIsEditMode(false);
                  setCurrentUserId(null);
                  setFormUser({
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
                  setFormErrors({});
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                Отменить
              </button>
            </div>
          </form> {/* Правильное закрытие формы */}
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
        // Custom styles to indicate selected row
        selectableRowSelected={(row) => selectedUser && row.id === selectedUser.id}
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
                <p><strong>Обновлён:</strong> {new Date(selectedUser.updated_at).toLocaleString()}</p>

                <h4>Инструкции:</h4>
                {selectedUser.instructions.length > 0 ? (
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

      {/* Модалка подтверждения удаления пользователя */}
      {showDeleteModal && userToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Подтверждение удаления</h3>
            <p>Вы уверены, что хотите удалить пользователя <strong>{userToDelete.email}</strong>?</p>
            <div className="actions">
              <button onClick={handleDeleteUser} className="delete-button" disabled={isSubmitting}>
                {isSubmitting ? 'Удаление...' : 'Да'}
              </button>
              <button onClick={closeDeleteModal} className="cancel-button" disabled={isSubmitting}>
                Нет
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users_last;
