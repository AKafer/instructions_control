import axios from 'axios';

// Создаём экземпляр axios (или используем axios напрямую)
const instance = axios.create({
  // Можно указать базовый URL, таймаут и т.д.
});

// Добавляем interceptor на ответы
instance.interceptors.response.use(
  (response) => {
    // Если статус 2xx, просто возвращаем ответ
    return response;
  },
  (error) => {
    // Если у ошибки есть response
    if (error.response && error.response.status === 401) {
      // Например, перенаправляем на /login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
