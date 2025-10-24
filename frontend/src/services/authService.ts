import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    username,
    password,
  });
  return response.data;
};

export const registerUser = async (
  username: string,
  email: string,
  password: string
): Promise<RegisterResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, {
    username,
    email,
    password,
  });
  return response.data;
};
