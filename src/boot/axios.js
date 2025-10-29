// src/boot/axios.js
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.API_URL, // cambia esto por tu URL real
})
// Interceptor para agregar token
api.interceptors.request.use(config => {
  // No agregar token si es la ruta de login
  if (!config.url.includes('/login')) {
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
}, error => {
  return Promise.reject(error)
})

export {api}
