// import React, { useEffect, useState } from 'react';
// import axios from '../httpClient';
// import DataTable from 'react-data-table-component';
// import AsyncSelect from 'react-select/async';
// import '../styles/Professions.css';
// import { apiBaseUrl } from '../config';
//
// const Professions = () => {
//   const [professions, setProfessions] = useState([]);
//   const [loading, setLoading] = useState(true);
//
//   // Выбранная профессия (для редактирования, удаления)
//   const [selectedProfession, setSelectedProfession] = useState(null);
//
//   // Показ формы создания / редактирования
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [showEditForm, setShowEditForm] = useState(false);
//
//   // Поля формы создания (обязательное поле title)
//   const [newTitle, setNewTitle] = useState('');
//   const [newDescription, setNewDescription] = useState('');
//
//   // Ошибки формы создания (только title обязателен)
//   const [createErrors, setCreateErrors] = useState({
//     title: false,
//   });
//
//   // Поля формы редактирования
//   const [editTitle, setEditTitle] = useState('');
//   const [editDescription, setEditDescription] = useState('');
//
//   // Показывать ли окошко подтверждения удаления
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//
//   // Выбранные инструкции при создании
//   const [selectedInstructions, setSelectedInstructions] = useState([]);
//
//   // Выбранные инструкции при редактировании
//   const [editSelectedInstructions, setEditSelectedInstructions] = useState([]);
//
//   // Привязки (rules) для редактируемой профессии
//   const [currentRules, setCurrentRules] = useState([]);
//
//   // ------------------ HOOK: При загрузке ------------------
//   useEffect(() => {
//     fetchProfessions();
//   }, []);
//
//   // Получение списка профессий (возвращаем массив)
//   const fetchProfessions = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem('token');
//       const response = await axios.get(`${apiBaseUrl}/api/v1/professions/`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           Accept: 'application/json',
//         },
//       });
//       const data = response.data;
//       setProfessions(data);
//       console.log('Fetched professions:', data);
//       return data;
//     } catch (error) {
//       console.error('Error fetching professions:', error);
//       return [];
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   // Функция для загрузки всех инструкций, используя пагинацию
//   const loadAllInstructions = async (inputValue) => {
//     const token = localStorage.getItem('token');
//     let page = 1;
//     const size = 50; // Размер страницы
//     let allInstructions = [];
//     let hasMore = true;
//
//     try {
//       while (hasMore) {
//         const response = await axios.get(`${apiBaseUrl}/api/v1/instructions/`, {
//           params: { page, size, search: inputValue },
//           headers: {
//             Authorization: `Bearer ${token}`,
//             Accept: 'application/json',
//           },
//         });
//         const data = response.data.items || [];
//         const options = data.map((instruction) => ({
//           value: instruction.id,
//           label: instruction.title,
//         }));
//         allInstructions = [...allInstructions, ...options];
//         // Проверяем, есть ли еще страницы
//         if (data.length < size) {
//           hasMore = false;
//         } else {
//           page += 1;
//         }
//       }
//       console.log('Loaded all instructions:', allInstructions);
//       return allInstructions;
//     } catch (error) {
//       console.error('Error loading all instructions:', error);
//       return [];
//     }
//   };
//
//   // Функция для асинхронной загрузки инструкций по запросу (Promise-основанный подход)
//   const loadInstructions = async (inputValue) => {
//     // Если хотите загружать все инструкции при любом поиске, используйте loadAllInstructions
//     // Однако это может быть неэффективно при большом количестве инструкций
//     return await loadAllInstructions(inputValue);
//   };
//
//   // ------------------ Валидация формы создания ------------------
//   const validateCreateForm = () => {
//     let hasError = false;
//     const errors = { title: false };
//
//     if (!newTitle.trim()) {
//       errors.title = true;
//       hasError = true;
//     }
//
//     setCreateErrors(errors);
//     return !hasError;
//   };
//
//   // ------------------ Создание профессии ------------------
//   const handleCreateProfession = async () => {
//     if (!validateCreateForm()) {
//       return; // если есть ошибки, не отправляем запрос
//     }
//
//     try {
//       const token = localStorage.getItem('token');
//       // Тело JSON
//       const body = {
//         title: newTitle,
//         description: newDescription,
//       };
//
//       // Создаем профессию
//       const createResponse = await axios.post(`${apiBaseUrl}/api/v1/professions/`, body, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
//
//       const createdProfession = createResponse.data;
//       console.log('Created profession:', createdProfession);
//
//       // Привязываем выбранные инструкции
//       const bindPromises = selectedInstructions.map((instruction) => {
//         return axios.post(
//           `${apiBaseUrl}/api/v1/rules/`,
//           {
//             profession_id: createdProfession.id,
//             instruction_id: instruction.value,
//             description: 'string', // При необходимости можно сделать поле для описания
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               'Content-Type': 'application/json',
//             },
//           }
//         );
//       });
//
//       await Promise.all(bindPromises);
//       console.log('Bound selected instructions to profession.');
//
//       // Обновляем список
//       await fetchProfessions();
//
//       // Сброс полей
//       setNewTitle('');
//       setNewDescription('');
//       setCreateErrors({ title: false });
//       setShowCreateForm(false);
//       setSelectedInstructions([]);
//     } catch (error) {
//       console.error('Error creating profession:', error);
//     }
//   };
//
//   // ------------------ Редактирование ------------------
//   const handleEditClick = async () => {
//     if (!selectedProfession) return;
//     setEditTitle(selectedProfession.title || '');
//     setEditDescription(selectedProfession.description || '');
//     setShowEditForm(true);
//
//     // Получаем текущие привязки (rules) для выбранной профессии
//     try {
//       const token = localStorage.getItem('token');
//       const response = await axios.get(`${apiBaseUrl}/api/v1/rules/`, {
//         params: { profession_id__in: selectedProfession.id },
//         headers: {
//           Authorization: `Bearer ${token}`,
//           Accept: 'application/json',
//         },
//       });
//       const rules = response.data;
//       setCurrentRules(rules);
//       const boundInstructionIds = rules.map((rule) => rule.instruction_id);
//       console.log('Current bound instruction IDs:', boundInstructionIds);
//
//       // Используем названия инструкций из selectedProfession.instructions
//       const boundInstructions = boundInstructionIds.map((id) => {
//         const instruction = selectedProfession.instructions.find(instr => instr.id === id);
//         return {
//           value: id,
//           label: instruction ? instruction.title : 'Без названия',
//         };
//       });
//       console.log('Bound instructions for edit:', boundInstructions);
//       setEditSelectedInstructions(boundInstructions);
//     } catch (error) {
//       console.error('Error fetching rules for profession:', error);
//     }
//   };
//
//   const handleSaveEdit = async () => {
//     if (!selectedProfession) return;
//
//     try {
//       const token = localStorage.getItem('token');
//       const body = {
//         title: editTitle,
//         description: editDescription,
//       };
//
//       // Обновляем профессию
//       await axios.patch(`${apiBaseUrl}/api/v1/professions/${selectedProfession.id}`, body, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
//       console.log('Updated profession.');
//
//       // Получаем текущие привязки (rules)
//       const response = await axios.get(`${apiBaseUrl}/api/v1/rules/`, {
//         params: { profession_id__in: selectedProfession.id },
//         headers: {
//           Authorization: `Bearer ${token}`,
//           Accept: 'application/json',
//         },
//       });
//       const currentRulesData = response.data;
//       setCurrentRules(currentRulesData);
//
//       const currentInstructionIds = currentRulesData.map((rule) => rule.instruction_id);
//       const newSelectedIds = editSelectedInstructions.map((instr) => instr.value);
//
//       console.log('Current instruction IDs:', currentInstructionIds);
//       console.log('New selected instruction IDs:', newSelectedIds);
//
//       // Определяем инструкции, которые нужно добавить и удалить
//       const instructionsToAdd = newSelectedIds.filter((id) => !currentInstructionIds.includes(id));
//       const instructionsToRemove = currentInstructionIds.filter((id) => !newSelectedIds.includes(id));
//
//       console.log('Instructions to add:', instructionsToAdd);
//       console.log('Instructions to remove:', instructionsToRemove);
//
//       // Добавляем новые привязки
//       const addPromises = instructionsToAdd.map((instructionId) => {
//         return axios.post(
//           `${apiBaseUrl}/api/v1/rules/`,
//           {
//             profession_id: selectedProfession.id,
//             instruction_id: instructionId,
//             description: 'string', // При необходимости можно сделать поле для описания
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               'Content-Type': 'application/json',
//             },
//           }
//         );
//       });
//
//       // Удаляем привязки
//       const removePromises = instructionsToRemove.map((instructionId) => {
//         const rule = currentRulesData.find((r) => r.instruction_id === instructionId);
//         if (rule) {
//           return axios.delete(`${apiBaseUrl}/api/v1/rules/${rule.id}`, {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           });
//         }
//         return Promise.resolve();
//       });
//
//       await Promise.all([...addPromises, ...removePromises]);
//       console.log('Updated instruction bindings.');
//
//       // Обновляем список
//       await fetchProfessions();
//
//       setShowEditForm(false);
//       setSelectedProfession(null);
//       setCurrentRules([]);
//       setEditSelectedInstructions([]);
//     } catch (error) {
//       console.error('Error editing profession:', error);
//     }
//   };
//
//   // ------------------ Удаление ------------------
//   const handleDeleteClick = () => {
//     if (!selectedProfession) return;
//     setShowDeleteConfirm(true);
//   };
//
//   const confirmDelete = async () => {
//     if (!selectedProfession) {
//       setShowDeleteConfirm(false);
//       return;
//     }
//
//     try {
//       const token = localStorage.getItem('token');
//       await axios.delete(`${apiBaseUrl}/api/v1/professions/${selectedProfession.id}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       console.log('Deleted profession:', selectedProfession.id);
//       await fetchProfessions();
//       setSelectedProfession(null);
//     } catch (error) {
//       console.error('Error deleting profession:', error);
//     } finally {
//       setShowDeleteConfirm(false);
//     }
//   };
//
//   const cancelDelete = () => {
//     setShowDeleteConfirm(false);
//   };
//
//   // ------------------ Обработка выбора инструкций при создании ------------------
//   const handleCreateInstructionsChange = (selectedOptions) => {
//     setSelectedInstructions(selectedOptions || []);
//     console.log('Selected instructions:', selectedOptions);
//   };
//
//   // ------------------ Обработка выбора инструкций при редактировании ------------------
//   const handleEditInstructionsChange = (selectedOptions) => {
//     setEditSelectedInstructions(selectedOptions || []);
//     console.log('Edit selected instructions:', selectedOptions);
//   };
//
//   // ------------------ Таблица ------------------
//   const columns = [
//     { name: 'ID', selector: (row) => row.id, sortable: true },
//     { name: 'Название', selector: (row) => row.title, sortable: true },
//     { name: 'Описание', selector: (row) => row.description, sortable: true },
//     {
//       name: 'Инструкции',
//       // Выводим названия инструкций, каждую на новой строке
//       cell: (row) => {
//         if (!row.instructions || row.instructions.length === 0) {
//           return 'Нет';
//         }
//         // Если есть инструкции, покажем их заголовки, каждый с новой строки
//         const titles = row.instructions.map((instr) => instr.title).join('\n');
//
//         // Чтобы переносы \n работали в HTML, нужно обернуть в <div style={{whiteSpace: 'pre-wrap'}} >
//         return <div style={{ whiteSpace: 'pre-wrap' }}>{titles}</div>;
//       },
//     },
//   ];
//
//   const handleSelectedRowsChange = (state) => {
//     if (state.selectedRows && state.selectedRows.length > 0) {
//       setSelectedProfession(state.selectedRows[0]);
//     } else {
//       setSelectedProfession(null);
//     }
//   };
//
//   // ------------------ РЕНДЕР ------------------
//   return (
//     <div className="professions-wrapper">
//       <div className="professions-header">
//         <h2>Профессии</h2>
//       </div>
//
//       {/* Кнопки */}
//       <div className="professions-buttons">
//         <button
//           onClick={() => {
//             setShowCreateForm(true);
//             setShowEditForm(false);
//           }}
//         >
//           Создать
//         </button>
//         <button onClick={handleEditClick} disabled={!selectedProfession}>
//           Редактировать
//         </button>
//         <button onClick={handleDeleteClick} disabled={!selectedProfession}>
//           Удалить
//         </button>
//       </div>
//
//       {/* Форма создания */}
//       {showCreateForm && (
//         <div className="form-container outlined-box" style={{ maxWidth: '50%', margin: '0 auto' }}>
//           <h3>Создать профессию</h3>
//
//           {/* Поле Title (обязательное) */}
//           <div className={`field ${createErrors.title ? 'error' : ''}`}>
//             <label>Название (обязательное поле):</label>
//             <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
//             {createErrors.title && <div className="error-hint">Название обязательно</div>}
//           </div>
//
//           <div className="field">
//             <label>Описание:</label>
//             <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
//           </div>
//
//           {/* Секция выбора инструкций */}
//           <div className="field">
//             <label>Инструкции:</label>
//             <AsyncSelect
//               isMulti
//               cacheOptions
//               defaultOptions
//               loadOptions={loadInstructions}
//               value={selectedInstructions}
//               onChange={handleCreateInstructionsChange}
//               placeholder="Выберите инструкции..."
//               getOptionLabel={(option) => option.label}
//               getOptionValue={(option) => option.value}
//             />
//           </div>
//
//           <div className="actions" style={{ display: 'flex', gap: '10px' }}>
//             <button style={{ backgroundColor: '#007bff', color: '#fff' }} onClick={handleCreateProfession}>
//               Создать
//             </button>
//             <button
//               style={{ backgroundColor: '#007bff', color: '#fff' }}
//               onClick={() => {
//                 setShowCreateForm(false);
//                 setCreateErrors({ title: false });
//                 setNewTitle('');
//                 setNewDescription('');
//                 setSelectedInstructions([]);
//               }}
//             >
//               Отменить
//             </button>
//           </div>
//         </div>
//       )}
//
//       {/* Форма редактирования */}
//       {showEditForm && (
//         <div className="form-container outlined-box" style={{ maxWidth: '50%', margin: '0 auto' }}>
//           <h3>Редактировать профессию</h3>
//
//           <div className="field">
//             <label>Название:</label>
//             <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
//           </div>
//
//           <div className="field">
//             <label>Описание:</label>
//             <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
//           </div>
//
//           {/* Секция выбора инструкций */}
//           <div className="field">
//             <label>Инструкции:</label>
//             <AsyncSelect
//               isMulti
//               cacheOptions
//               defaultOptions
//               loadOptions={loadInstructions}
//               value={editSelectedInstructions}
//               onChange={handleEditInstructionsChange}
//               placeholder="Выберите инструкции..."
//               getOptionLabel={(option) => option.label}
//               getOptionValue={(option) => option.value}
//             />
//           </div>
//
//           <div className="actions" style={{ display: 'flex', gap: '10px' }}>
//             <button style={{ backgroundColor: '#007bff', color: '#fff' }} onClick={handleSaveEdit}>
//               Сохранить
//             </button>
//             <button
//               style={{ backgroundColor: '#007bff', color: '#fff' }}
//               onClick={() => {
//                 setShowEditForm(false);
//                 setSelectedProfession(null);
//                 setCurrentRules([]);
//                 setEditSelectedInstructions([]);
//               }}
//             >
//               Отменить
//             </button>
//           </div>
//         </div>
//       )}
//
//       {/* Таблица */}
//       <DataTable
//         columns={columns}
//         data={professions}
//         progressPending={loading}
//         pagination
//         selectableRows
//         selectableRowsSingle
//         onSelectedRowsChange={handleSelectedRowsChange}
//         highlightOnHover
//         pointerOnHover
//       />
//
//       {/* Модалка подтверждения удаления */}
//       {showDeleteConfirm && (
//         <div className="confirm-overlay">
//           <div className="confirm-box">
//             <p>Вы уверены, что хотите удалить профессию {selectedProfession?.title}?</p>
//             <div className="confirm-actions">
//               <button onClick={confirmDelete}>Да</button>
//               <button onClick={cancelDelete}>Нет</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
//
// export default Professions;
