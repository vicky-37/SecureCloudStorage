// src/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser } from './api';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    try {
      const response = await registerUser({ username, password });

      if (response.status === 200) {
        // 🔐 AUTO-LOGIN after successful registration
        try {
          const loginResponse = await loginUser({ username, password });
          if (loginResponse.status === 200) {
            localStorage.setItem("token", loginResponse.data.token);
            navigate("/dashboard");
          } else {
            setMessage("Registered. Please log in manually.");
            navigate("/login");
          }
        } catch (loginErr) {
          setMessage("Registered. Please log in manually.");
          navigate("/login");
        }
      } else {
        setError(response.data.error || "Registration failed");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error occurred while registering the user.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-gray-700 text-left font-medium mb-1">Email</label>
            <input
              type="email"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-left font-medium mb-1">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
          >
            Register
          </button>
        </form>

        {error && <div className="text-red-600 mt-4">{error}</div>}
        {message && <div className="text-green-600 mt-4">{message}</div>}
      </div>
    </div>
  );
};

export default Register;
