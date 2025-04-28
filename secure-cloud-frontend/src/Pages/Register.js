import React, { useState } from 'react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate input
        if (!username || !password) {
            setError("Username and password are required");
            return;
        }

        // Send POST request to the backend
        try {
            const response = await fetch("https://securecloudstorage-production.up.railway.app/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
                setUsername('');
                setPassword('');
                setError('');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Error occurred while registering the user.");
        }
    };

    return (
        <div className="page-container">
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center',
          }}>
            <h1 style={{ marginBottom: '20px' }}>Register</h1>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="username" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username</label>
                <input
                  type="email"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '16px'
                }}
              >
                Register
              </button>
            </form>
      
            {error && <div style={{ color: 'red', marginTop: '15px' }}>{error}</div>}
            {message && <div style={{ color: 'green', marginTop: '15px' }}>{message}</div>}
          </div>
        </div>
      );
      
};

export default Register;
