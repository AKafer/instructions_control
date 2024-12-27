// src/components/Control.js

import React, { useEffect, useState } from 'react';
import axios from '../httpClient';
import '../styles/ControlPage.css';
import { apiBaseUrl } from '../config';
import logo from '../assets/logo.png';
import {Link} from "react-router-dom";

const Control = () => {
  const [instructions, setInstructions] = useState([]);
  const [selectedInstructionId, setSelectedInstructionId] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInstructions();
  }, []);

  const fetchInstructions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiBaseUrl}/api/v1/instructions/get_my_instructions/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      setInstructions(response.data);
    } catch (error) {
      console.error('Error fetching instructions:', error);
      if (error.response && error.response.status === 401) {
        window.location.href = '/login';
      } else {
        setError('Не удалось загрузить инструкции.');
      }
    }
  };

  const handleFileChange = (e) => {
    setSignatureFile(e.target.files[0]);
  };

  const handleSubmitSignature = async (instructionId) => {
    if (!signatureFile) {
      alert('Пожалуйста, выберите файл');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('file', signatureFile);

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${apiBaseUrl}/api/v1/journals/update_journal/${instructionId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      // Очистка файла и закрытие формы
      setSignatureFile(null);
      setSelectedInstructionId(null);
      setIsSubmitting(false);

      // Обновление списка инструкций
      await fetchInstructions();
    } catch (error) {
      console.error('Error submitting signature:', error);
      alert('Не удалось отправить подпись');
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="control-container">
      {/* Логотип и кнопка выхода */}
      <div className="control-header">
        <Link to="/">
          <img src={logo} alt="Logo" className="control-logo" />
        </Link>
        <button className="logout-button" onClick={handleLogout}>
          Выйти
        </button>
      </div>

      {/* Обработка ошибок */}
      {error && <div className="error-message">{error}</div>}

      {/* Сетка инструкций */}
      <div className="instructions-grid">
        {instructions.map((instruction) => (
          <div key={instruction.id} className="instruction-item">
            <div className="instruction-details">
              <h3>{instruction.title}</h3>
              <p><strong>Номер:</strong> {instruction.number}</p>
              <p><strong>Период:</strong> {instruction.period} дней</p>
              <p><strong>Повторяемость:</strong> {instruction.iteration ? 'Да' : 'Нет'}</p>
              <p>
                <strong>Ссылка на файл:</strong>
                <a href={instruction.link} target="_blank" rel="noopener noreferrer">
                  Смотреть файл
                </a>
              </p>

              {/* Детали журнала */}
              <div className="journal-details">
                {instruction.journal.last_date_read ? (
                  <>
                    <p>
                      <strong>Ссылка на подпись:</strong>
                      {instruction.journal.link ? (
                        <a href={instruction.journal.link} target="_blank" rel="noopener noreferrer">
                          Смотреть подпись
                        </a>
                      ) : (
                        ' Нет'
                      )}
                    </p>
                    <p>
                      <strong>Дата ознакомления:</strong>
                      {instruction.journal.last_date_read ? new Date(instruction.journal.last_date_read).toLocaleString() : 'Новая инструкция. Нет ознакомлений.'}
                    </p>
                    <p>
                      <strong>Ознакомлен:</strong> {instruction.journal.valid ? 'Да' : 'Нужно ознакомиться'}
                    </p>
                    <p>
                      <strong>Ознакомиться повторно через:</strong> {instruction.journal.remain_days} дней
                    </p>
                  </>
                ) : (
                  <p>Новая инструкция. Нет ознакомлений.</p>
                )}
              </div>
            </div>

            {/* Кнопка "Ознакомиться" */}
            <button
              className="acknowledge-button"
              onClick={() => setSelectedInstructionId(instruction.id)}
            >
              Ознакомиться
            </button>

            {/* Форма отправки подписи */}
            {selectedInstructionId === instruction.id && (
              <div className="signature-form">
                <input type="file" onChange={handleFileChange} />
                <div className="signature-buttons">
                  <button
                    onClick={() => handleSubmitSignature(instruction.id)}
                    disabled={isSubmitting}
                    className="submit-signature-button"
                  >
                    {isSubmitting ? 'Отправка...' : 'Отправить подпись'}
                  </button>
                  <button
                    onClick={() => setSelectedInstructionId(null)}
                    disabled={isSubmitting}
                    className="cancel-button"
                  >
                    Отменить
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Добавление пустых прямоугольников, если инструкций меньше 4 */}
        {instructions.length < 4 && Array.from({ length: 4 - instructions.length }).map((_, index) => (
          <div key={`empty-${index}`} className="instruction-item empty-item">
            {/* Пустой прямоугольник */}
          </div>
        ))}
      </div>

      {/* Контактная информация */}
      <div className="contacts">
        <h3>Контакты</h3>
        <p>Email: <a href="mailto:i@aarsenev.ru">i@aarsenev.ru</a></p>
        <p>Телефон: <a href="tel:+79106492742">+7 910 649 27 42</a></p>
        <p>
          <a href="https://ias-control.ru/" target="_blank" rel="noopener noreferrer">IAS_Control</a>
        </p>
      </div>
    </div>
  );
};

export default Control;
