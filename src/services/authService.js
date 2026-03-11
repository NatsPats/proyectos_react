import axios from 'axios';

const API_URL = 'http://localhost:3001/auth';

// withCredentials: true es CLAVE → le dice a axios que envíe las cookies
// en requests cross-origin (necesario para que el refreshToken cookie viaje)
const authAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const registerUser = (data) =>
  authAxios.post('/register', data);

export const loginUser = (data) =>
  authAxios.post('/login', data);

export const refreshToken = () =>
  authAxios.post('/refresh');

export const logoutUser = () =>
  authAxios.post('/logout');

export const resendVerification = (email) =>
  authAxios.post('/resend-verification', { email });

