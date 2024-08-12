// src/api/axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://networking-server.vercel.app/', // Ensure this matches your backend port
});

export default instance;
