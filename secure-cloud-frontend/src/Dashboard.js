import './Dashboard.css';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, removeToken } from './Auth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Toastify styling

const Dashboard = () => {

  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/files", {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setFiles(data.files || []);
      } else {
        console.error("Error fetching files:", data.error);
        setFiles([]);
      }
    } catch (err) {
      console.error(err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("File uploaded successfully!");
        setMessage(data.message);
        fetchFiles(); // Refresh file list
      } else {
        toast.error("Error uploading file!");
        setMessage("Error uploading file.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error during file upload!");
      setMessage("Error uploading file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (filename) => {
    window.open(`http://localhost:5000/download/${filename}`, "_blank");
  };

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>
      <button onClick={handleLogout} style={{ marginBottom: "20px" }}>
        Logout
      </button>

      <div style={{ marginBottom: "20px" }}>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
      </div>

      {loading && (
      <div style={{ margin: "20px", textAlign: "center" }}>
      <div className="spinner"></div>
      <p>Loading...</p>
      </div>
      )}


      {/* 🟢 Upload Message */}
      {message && (
        <div style={{ color: "green", marginBottom: "20px" }}>
          {message}
        </div>
      )}

      <h2>Uploaded Files:</h2>
      <ul>
        {Array.isArray(files) && files.length > 0 ? (
          files.map(file => (
            <li key={file} style={{ marginBottom: "10px" }}>
              {file}
              <button style={{ marginLeft: "10px" }} onClick={() => handleDownload(file)}>
                Download
              </button>
            </li>
          ))
        ) : (
          <li>No files uploaded yet.</li>
        )}
      </ul>
    </div>
  );
};

export default Dashboard;
