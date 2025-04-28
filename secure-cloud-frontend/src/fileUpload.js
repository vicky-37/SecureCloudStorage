import React, { useState, useEffect } from "react";
import axios from "axios";

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [publicKey, setPublicKey] = useState("");

    useEffect(() => {
        async function fetchPublicKey() {
            const response = await axios.get("https://securecloudstorage-production.up.railway.app/public-key");
            setPublicKey(response.data.ecPublicKey);
        }
        fetchPublicKey();
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            await axios.post("https://securecloudstorage-production.up.railway.app/upload", formData);
            alert("File uploaded and encrypted!");
        } catch (error) {
            console.error("Upload failed:", error);
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
            <h2>Upload a File</h2>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
                Upload
            </button>
        </div>
    );
};

export default FileUpload;
