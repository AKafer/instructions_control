import React, { useEffect, useState } from 'react';
import axios from '../../httpClient';
import DataTable from 'react-data-table-component';
import { apiBaseUrl } from '../../config';
import { Button, ButtonBox, Container } from '../../components';
import './styles.modules.css'; // Ваши стили

const Tests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Инструкции для <select>
  const [instructionsList, setInstructionsList] = useState([]);

  // ====== Создание (форма) ======
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSuccessRate, setNewSuccessRate] = useState(75);
  const [newInstructionId, setNewInstructionId] = useState('');
  const [newQuestions, setNewQuestions] = useState([]);
  const [createTestErrors, setCreateTestErrors] = useState({
    title: false,
    successRate: false,
    instruction: false,
  });

  // ====== Редактирование (форма) ======
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  // Для редактирования (почти те же поля, но editPrefix)
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSuccessRate, setEditSuccessRate] = useState(75);
  const [editInstructionId, setEditInstructionId] = useState('');
  const [editQuestions, setEditQuestions] = useState([]);

  useEffect(() => {
    fetchAllTests();
    fetchAllInstructions();
  }, []);

  // --------------------- ЗАГРУЗКА ТЕСТОВ ---------------------
  const fetchAllTests = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const resp = await axios.get(`${apiBaseUrl}/api/v1/tests/tests`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      setTests(resp.data || []);
      console.log('Загружены тесты:', resp.data);
    } catch (err) {
      console.error('Ошибка при загрузке тестов:', err);
    } finally {
      setLoading(false);
    }
  };

  // --------------------- ЗАГРУЗКА ИНСТРУКЦИЙ ---------------------
  const fetchAllInstructions = async () => {
    const token = localStorage.getItem('token');
    let page = 1;
    const size = 50;
    let hasMore = true;
    let all = [];

    try {
      while (hasMore) {
        const resp = await axios.get(`${apiBaseUrl}/api/v1/instructions/`, {
          params: { page, size },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        const data = resp.data.items || [];
        all = [...all, ...data];
        if (data.length < size) {
          hasMore = false;
        } else {
          page += 1;
        }
      }
      setInstructionsList(all);
      console.log('Инструкции (для селекта):', all);
    } catch (err) {
      console.error('Ошибка при загрузке инструкций:', err);
    }
  };

  // --------------------- Валидация создания ---------------------
  const validateCreateForm = () => {
    const errors = {
      title: false,
      successRate: false,
      instruction: false,
    };
    let hasError = false;

    if (!newTitle.trim()) {
      errors.title = true;
      hasError = true;
    }
    if (!newSuccessRate) {
      errors.successRate = true;
      hasError = true;
    }
    if (!newInstructionId) {
      errors.instruction = true;
      hasError = true;
    }
    setCreateTestErrors(errors);
    return !hasError;
  };

  // --------------------- Создание Теста + Вопросов ---------------------
  const handleCreateTest = async () => {
    if (!validateCreateForm()) return;
    const token = localStorage.getItem('token');
    try {
      // 1) Создаём тест
      const testBody = {
        title: newTitle,
        description: newDescription,
        success_rate: Number(newSuccessRate),
        instruction_id: Number(newInstructionId),
      };
      const createResp = await axios.post(
        `${apiBaseUrl}/api/v1/tests/tests`,
        testBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const newTestId = createResp.data.id;
      console.log('Тест создан, ID=', newTestId);

      // 2) Создаём вопросы
      for (const [qIndex, qObj] of newQuestions.entries()) {
        const answersArray = qObj.answers.map((ansText, ansIndex) => {
          const key = (ansIndex + 1).toString(); // "1", "2", ...
          return { [key]: ansText };
        });
        const questionBody = {
          question: qObj.question,
          answers: answersArray,
          correct_answer: Number(qObj.correctAnswer) || 1,
          test_id: newTestId,
        };
        await axios.post(`${apiBaseUrl}/api/v1/tests/questions`, questionBody, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log(`Вопрос #${qIndex + 1} создан`);
      }

      // 3) Обновить список
      await fetchAllTests();

      // 4) Сброс
      setNewTitle('');
      setNewDescription('');
      setNewSuccessRate(75);
      setNewInstructionId('');
      setNewQuestions([]);
      setCreateTestErrors({ title: false, successRate: false, instruction: false });
      setShowCreateForm(false);

    } catch (err) {
      console.error('Ошибка при создании теста:', err);
    }
  };

  // ===================== Логика вопросов (CREATION) =====================
  const handleAddQuestion = () => {
    setNewQuestions((prev) => [
      ...prev,
      { question: '', answers: [''], correctAnswer: 1 },
    ]);
  };
  const handleRemoveQuestion = (qIndex) => {
    setNewQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };
  const handleQuestionChange = (qIndex, newText) => {
    setNewQuestions((prev) =>
      prev.map((q, idx) => (idx === qIndex ? { ...q, question: newText } : q))
    );
  };
  const handleAddAnswer = (qIndex) => {
    setNewQuestions((prev) =>
      prev.map((q, idx) =>
        idx === qIndex ? { ...q, answers: [...q.answers, ''] } : q
      )
    );
  };
  const handleRemoveAnswer = (qIndex, ansIndex) => {
    setNewQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx === qIndex) {
          const updated = q.answers.filter((_, i) => i !== ansIndex);
          return { ...q, answers: updated };
        }
        return q;
      })
    );
  };
  const handleAnswerChange = (qIndex, ansIndex, newText) => {
    setNewQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx === qIndex) {
          const updatedAns = q.answers.map((ans, i) => (i === ansIndex ? newText : ans));
          return { ...q, answers: updatedAns };
        }
        return q;
      })
    );
  };
  const handleCorrectAnswerChange = (qIndex, newVal) => {
    setNewQuestions((prev) =>
      prev.map((q, idx) => (idx === qIndex ? { ...q, correctAnswer: newVal } : q))
    );
  };

  // ===================== РЕДАКТИРОВАНИЕ (ПРИ НАЖАТИИ «Вопросы») =====================
  const handleEditClick = (testRow) => {
    setSelectedTest(testRow);
    setEditTitle(testRow.title || '');
    setEditDescription(testRow.description || '');
    setEditSuccessRate(testRow.success_rate || 75);
    setEditInstructionId(testRow.instruction_id ? String(testRow.instruction_id) : '');
    // Преобразуем questions в форму [{question, answers[], correctAnswer}, ...]
    const mappedQuestions = (testRow.questions || []).map((q) => {
      // answers -> [{ "1":"..."}, {"2":"..."} ]
      // Нужно вернуть массив строк, + correctAnswer
      const answersStr = q.answers.map((ansObj) => {
        const key = Object.keys(ansObj)[0]; // "1", "2"
        return ansObj[key] || '';
      });
      return {
        question: q.question,
        answers: answersStr,
        correctAnswer: q.correct_answer || 1,
        questionId: q.id, // на всякий случай
      };
    });

    setEditQuestions(mappedQuestions);

    setShowEditForm(true);
  };

  // Сохранить изменения (PATCH тест, + логику вопросов)
  const handleSaveEditTest = async () => {
    if (!selectedTest) return;
    const token = localStorage.getItem('token');

    try {
      // 1) Обновим сам тест
      const testBody = {
        title: editTitle,
        description: editDescription,
        success_rate: Number(editSuccessRate),
        instruction_id: Number(editInstructionId),
      };
      await axios.patch(
        `${apiBaseUrl}/api/v1/tests/tests/${selectedTest.id}`,
        testBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Тест обновлён.');

      // 2) (Пример) Удалим все вопросы и создадим заново.
      //    В реальном проекте можно патчить/создавать/удалять выборочно.
      //    Или /api/v1/tests/questions/bulk-update? ...
      //    Ниже, для упрощения: delete all, then recreate.

      // Удаляем все вопросы
      if (selectedTest.questions && selectedTest.questions.length > 0) {
        for (const q of selectedTest.questions) {
          await axios.delete(`${apiBaseUrl}/api/v1/tests/questions/${q.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log(`Вопрос id=${q.id} удалён.`);
        }
      }

      // Создаём заново
      for (const [qIndex, qObj] of editQuestions.entries()) {
        const answersArray = qObj.answers.map((ansText, ansIdx) => {
          const key = (ansIdx + 1).toString();
          return { [key]: ansText };
        });
        const questionBody = {
          question: qObj.question,
          answers: answersArray,
          correct_answer: Number(qObj.correctAnswer) || 1,
          test_id: selectedTest.id,
        };
        await axios.post(`${apiBaseUrl}/api/v1/tests/questions`, questionBody, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log(`Вопрос #${qIndex + 1} пересоздан`);
      }

      // 3) Обновим список
      await fetchAllTests();

      // Скрываем форму
      setShowEditForm(false);
      setSelectedTest(null);

    } catch (err) {
      console.error('Ошибка при редактировании теста:', err);
    }
  };

  // Методы редактирования вопросов (editQuestions)
  const handleEditAddQuestion = () => {
    setEditQuestions((prev) => [
      ...prev,
      { question: '', answers: [''], correctAnswer: 1 },
    ]);
  };
  const handleEditRemoveQuestion = (qIndex) => {
    setEditQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };
  const handleEditQuestionChange = (qIndex, newText) => {
    setEditQuestions((prev) =>
      prev.map((q, idx) => (idx === qIndex ? { ...q, question: newText } : q))
    );
  };
  const handleEditAddAnswer = (qIndex) => {
    setEditQuestions((prev) =>
      prev.map((q, idx) =>
        idx === qIndex
          ? { ...q, answers: [...q.answers, ''] }
          : q
      )
    );
  };
  const handleEditRemoveAnswer = (qIndex, ansIndex) => {
    setEditQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx === qIndex) {
          const updated = q.answers.filter((_, i) => i !== ansIndex);
          return { ...q, answers: updated };
        }
        return q;
      })
    );
  };
  const handleEditAnswerChange = (qIndex, ansIndex, newText) => {
    setEditQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx === qIndex) {
          const updatedAns = q.answers.map((ans, i) => (i === ansIndex ? newText : ans));
          return { ...q, answers: updatedAns };
        }
        return q;
      })
    );
  };
  const handleEditCorrectAnswerChange = (qIndex, newVal) => {
    setEditQuestions((prev) =>
      prev.map((q, idx) => (idx === qIndex ? { ...q, correctAnswer: newVal } : q))
    );
  };

  // --------------------- СТОЛБЦЫ ТАБЛИЦЫ ---------------------
  const columns = [
    { name: 'ID', selector: row => row.id, sortable: true },
    { name: 'Название', selector: row => row.title, sortable: true },
    { name: 'Описание', selector: row => row.description, sortable: true },
    {
      name: 'Уровень',
      selector: row => row.success_rate,
      cell: row => `${row.success_rate}%`,
      sortable: true,
    },
    {
      name: 'Инструкция',
      selector: row => row.instruction?.title || 'Нет',
      sortable: true,
    },
    {
      name: 'Вопросы',
      cell: row => (
        <button onClick={() => handleEditClick(row)}>
          Вопросы
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  // Выделение строки
  const handleSelectedRowsChange = (state) => {
    if (state.selectedRows && state.selectedRows.length > 0) {
      setSelectedTest(state.selectedRows[0]);
    } else {
      setSelectedTest(null);
    }
  };

  return (
    <Container>
      <div className="instructions-wrapper">
        <div className="instructions-header">
          <h2>Тесты</h2>
        </div>

        <ButtonBox>
          <Button
            modifier="style_dark-blue"
            clickHandler={() => {
              setShowCreateForm(!showCreateForm);
              setShowEditForm(false);
            }}
          >
            Создать
          </Button>
        </ButtonBox>

        {/* ФОРМА СОЗДАНИЯ */}
        {showCreateForm && (
          <div className="form-container outlined-box" style={{ maxWidth: '60%', margin: '0 auto' }}>
            <h3>Создать тест</h3>

            {/* Title */}
            <div className={`field ${createTestErrors.title ? 'error' : ''}`}>
              <label>Название (обязательное):</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              {createTestErrors.title && <div className="error-hint">Название обязательно</div>}
            </div>

            {/* Description */}
            <div className="field">
              <label>Описание:</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            {/* success_rate */}
            <div className={`field ${createTestErrors.successRate ? 'error' : ''}`}>
              <label>Уровень (success_rate) (обязательное):</label>
              <input
                type="number"
                value={newSuccessRate}
                onChange={(e) => setNewSuccessRate(e.target.value)}
              />
              {createTestErrors.successRate && (
                <div className="error-hint">Уровень обязателен</div>
              )}
            </div>

            {/* instruction_id */}
            <div className={`field ${createTestErrors.instruction ? 'error' : ''}`}>
              <label>Инструкция (обязательная):</label>
              <select
                value={newInstructionId}
                onChange={(e) => setNewInstructionId(e.target.value)}
              >
                <option value="">-- Выберите инструкцию --</option>
                {instructionsList.map((instr) => (
                  <option key={instr.id} value={instr.id}>
                    {instr.title}
                  </option>
                ))}
              </select>
              {createTestErrors.instruction && (
                <div className="error-hint">Инструкция обязательна</div>
              )}
            </div>

            {/* Вопросы */}
            <div className="field">
              <label>Вопросы:</label>
              {newQuestions.map((q, qIndex) => (
                <div key={qIndex} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Вопрос #{qIndex + 1}:</strong>
                    <button
                      style={{ float: 'right', backgroundColor: 'red', color: '#fff' }}
                      onClick={() => handleRemoveQuestion(qIndex)}
                    >
                      Удалить вопрос
                    </button>
                  </div>
                  <textarea
                    value={q.question}
                    onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                    placeholder="Текст вопроса"
                    style={{ width: '100%', marginBottom: '8px' }}
                  />

                  <p>Ответы:</p>
                  {q.answers.map((ans, ansIndex) => (
                    <div key={ansIndex} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                      <span>{ansIndex + 1})</span>
                      <input
                        type="text"
                        value={ans}
                        onChange={(e) => handleAnswerChange(qIndex, ansIndex, e.target.value)}
                      />
                      <button
                        style={{ backgroundColor: '#dc3545', color: '#fff' }}
                        onClick={() => handleRemoveAnswer(qIndex, ansIndex)}
                      >
                        -
                      </button>
                    </div>
                  ))}

                  <button
                    style={{ backgroundColor: '#007bff', color: '#fff', marginTop: '5px' }}
                    onClick={() => handleAddAnswer(qIndex)}
                  >
                    Добавить ответ
                  </button>

                  <div style={{ marginTop: '10px' }}>
                    <label>Номер правильного ответа:</label>
                    <input
                      type="number"
                      style={{ width: '60px', marginLeft: '10px' }}
                      value={q.correctAnswer}
                      onChange={(e) => handleCorrectAnswerChange(qIndex, e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <button
                style={{ backgroundColor: '#28a745', color: '#fff', marginTop: '10px' }}
                onClick={handleAddQuestion}
              >
                Добавить вопрос
              </button>
            </div>

            <div className="actions" style={{ display: 'flex', gap: '10px' }}>
              <button style={{ backgroundColor: '#007bff', color: '#fff' }} onClick={handleCreateTest}>
                Создать
              </button>
              <button
                style={{ backgroundColor: '#007bff', color: '#fff' }}
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTitle('');
                  setNewDescription('');
                  setNewSuccessRate(75);
                  setNewInstructionId('');
                  setNewQuestions([]);
                  setCreateTestErrors({
                    title: false,
                    successRate: false,
                    instruction: false,
                  });
                }}
              >
                Отменить
              </button>
            </div>
          </div>
        )}

        {/* ФОРМА РЕДАКТИРОВАНИЯ (при showEditForm) */}
        {showEditForm && selectedTest && (
          <div className="form-container outlined-box" style={{ maxWidth: '80%', margin: '0 auto' }}>
            <h3>Редактировать тест (ID={selectedTest.id})</h3>

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
            <div className="field">
              <label>Уровень (success_rate):</label>
              <input
                type="number"
                value={editSuccessRate}
                onChange={(e) => setEditSuccessRate(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Инструкция:</label>
              <select
                value={editInstructionId}
                onChange={(e) => setEditInstructionId(e.target.value)}
              >
                <option value="">-- Выберите инструкцию --</option>
                {instructionsList.map((instr) => (
                  <option key={instr.id} value={instr.id}>
                    {instr.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Вопросы (editQuestions) */}
            <div className="field">
              <label>Вопросы:</label>
              {editQuestions.map((q, qIndex) => (
                <div key={qIndex} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Вопрос #{qIndex + 1}:</strong>
                    <button
                      style={{ float: 'right', backgroundColor: 'red', color: '#fff' }}
                      onClick={() => handleEditRemoveQuestion(qIndex)}
                    >
                      Удалить вопрос
                    </button>
                  </div>
                  <textarea
                    value={q.question}
                    onChange={(e) => handleEditQuestionChange(qIndex, e.target.value)}
                    style={{ width: '100%', marginBottom: '8px' }}
                  />

                  <p>Ответы:</p>
                  {q.answers.map((ans, ansIndex) => (
                    <div
                      key={ansIndex}
                      style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}
                    >
                      <span>{ansIndex + 1})</span>
                      <input
                        type="text"
                        value={ans}
                        onChange={(e) => handleEditAnswerChange(qIndex, ansIndex, e.target.value)}
                      />
                      <button
                        style={{ backgroundColor: '#dc3545', color: '#fff' }}
                        onClick={() => handleEditRemoveAnswer(qIndex, ansIndex)}
                      >
                        -
                      </button>
                    </div>
                  ))}

                  <button
                    style={{ backgroundColor: '#007bff', color: '#fff', marginTop: '5px' }}
                    onClick={() => handleEditAddAnswer(qIndex)}
                  >
                    Добавить ответ
                  </button>

                  <div style={{ marginTop: '10px' }}>
                    <label>Номер правильного ответа:</label>
                    <input
                      type="number"
                      style={{ width: '60px', marginLeft: '10px' }}
                      value={q.correctAnswer}
                      onChange={(e) => handleEditCorrectAnswerChange(qIndex, e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <button
                style={{ backgroundColor: '#28a745', color: '#fff', marginTop: '10px' }}
                onClick={handleEditAddQuestion}
              >
                Добавить вопрос
              </button>
            </div>

            <div className="actions" style={{ display: 'flex', gap: '10px' }}>
              <button
                style={{ backgroundColor: '#007bff', color: '#fff' }}
                onClick={handleSaveEditTest}
              >
                Сохранить
              </button>
              <button
                style={{ backgroundColor: '#007bff', color: '#fff' }}
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedTest(null);
                }}
              >
                Отменить
              </button>
            </div>
          </div>
        )}

        {/* Таблица */}
        <DataTable
          columns={[
            { name: 'ID', selector: row => row.id, sortable: true },
            { name: 'Название', selector: row => row.title, sortable: true },
            { name: 'Описание', selector: row => row.description, sortable: true },
            {
              name: 'Уровень',
              selector: row => row.success_rate,
              cell: row => `${row.success_rate}%`,
              sortable: true,
            },
            {
              name: 'Инструкция',
              selector: row => row.instruction?.title || 'Нет',
              sortable: true,
            },
            {
              name: 'Вопросы',
              cell: row => (
                <button onClick={() => handleEditClick(row)}>
                  Вопросы
                </button>
              ),
              ignoreRowClick: true,
              allowOverflow: true,
              button: true,
            },
          ]}
          data={tests}
          progressPending={loading}
          pagination
          selectableRows
          selectableRowsSingle
          onSelectedRowsChange={(state) => {
            if (state.selectedRows && state.selectedRows.length > 0) {
              setSelectedTest(state.selectedRows[0]);
            } else {
              setSelectedTest(null);
            }
          }}
          highlightOnHover
          pointerOnHover
        />
      </div>
    </Container>
  );
};

export default Tests;
