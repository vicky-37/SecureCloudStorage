require("dotenv").config();  // Load environment variables from .env
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const cors = require("cors");
const { ec: EC } = require("elliptic");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT||5000;

const AWS = require('aws-sdk'); // Add this below your other imports

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1', // ✅ Or whatever region your bucket is created in
});

const s3 = new AWS.S3(); // ✅ Now S3 is ready to use


// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // allow requests only from the React app's URL
    methods: ['GET', 'POST'], // allow GET and POST requests
    credentials: true, // allow cookies to be sent with requests (if needed)
}));
app.use(express.json());

// User loading and saving functions
function loadUsers() {
    if (!fs.existsSync("users.json")) {
        fs.writeFileSync("users.json", "[]");  // Create file with empty array
    }
    const usersData = fs.readFileSync("users.json", "utf8");
    console.log("Loaded users data:", usersData);
    try {
        const users = JSON.parse(usersData);
        if (!Array.isArray(users)) {
            throw new Error("Data is not an array");
        }

        // NEW: Filter out invalid users
        const validUsers = users.filter(u => u.username && u.password);

        return validUsers;
    } catch (err) {
        console.error("Error parsing users.json:", err);
        return [];  // Return an empty array if parsing fails
    }
}



function saveUsers(users) {
    console.log("Saving users:", users);  // Log the entire users array
    try {
        fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
        console.log("Users data saved successfully.");
    } catch (err) {
        console.error("Error saving users data:", err);
    }
}



// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Load and Setup Keys
const ec = new EC("p256");
let keyPair;
let aesKey;

function loadKeysFromEnv() {
    try {
        aesKey = Buffer.from(process.env.AES_KEY, "hex");
        keyPair = ec.keyFromPrivate(process.env.EC_PRIVATE_KEY);
        console.log("Keys loaded successfully from .env.");
    } catch (err) {
        console.error("Failed to load keys from .env:", err);
        process.exit(1);
    }
}
loadKeysFromEnv();

// Routes for User Registration and Login
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }
    const users = loadUsers(); // Load the users array from file

    // Check if the username already exists
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: "User already exists" });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Add the new user to the array
    users.push({ username, password: hashedPassword });

    // Save the updated array to users.json
    saveUsers(users);

    // Respond with success message
    res.json({ message: "User registered successfully!" });

});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();

    const user = users.find(u => u.username === username);
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
});

// Multer Setup for file uploads
const storage = multer.memoryStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// Encrypt File
function encryptFile(inputFile, outputFile, callback) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);

    const input = fs.createReadStream(inputFile);
    const output = fs.createWriteStream(outputFile);

    output.write(iv);  // Save IV at the start of file
    input.pipe(cipher).pipe(output).on("finish", () => {
        console.log(`File encrypted: ${outputFile}`);
        if (callback) callback();
    });
}

// Routes for file handling (upload, list files, download and decrypt)
app.get("/public-key", (req, res) => {
    res.json({ ecPublicKey: process.env.ECC_PUBLIC_KEY });
});

app.post("/upload", authenticateToken, upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
    const encryptedData = Buffer.concat([iv, cipher.update(req.file.buffer), cipher.final()]);

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `encrypted-${Date.now()}-${req.file.originalname}`,
        Body: encryptedData,
    };

    s3.upload(params, (err, data) => {
        if (err) {
            console.error("Error uploading to S3:", err);
            return res.status(500).json({ error: "Upload failed" });
        }

        console.log("File uploaded successfully:", data.Location);
        res.json({ message: "File uploaded and encrypted successfully!", fileUrl: data.Location });
    });
});


app.get("/files", authenticateToken, (req, res) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
    };

    s3.listObjectsV2(params, (err, data) => {
        if (err) {
            console.error("Error listing files:", err);
            return res.status(500).json({ error: "Error listing files" });
        }

        const files = data.Contents.map(item => item.Key);
        res.json({ files });
    });
});


app.get("/download/:filename", authenticateToken, (req, res) => {
    const filename = req.params.filename;

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: filename,
    };

    s3.getObject(params, (err, data) => {
        if (err) {
            console.error("Error fetching file from S3:", err);
            return res.status(404).json({ error: "File not found" });
        }

        const encryptedData = data.Body;
        const iv = encryptedData.slice(0, 16);
        const cipherText = encryptedData.slice(16);

        try {
            const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, iv);
            const decryptedData = Buffer.concat([decipher.update(cipherText), decipher.final()]);

            res.set('Content-Disposition', `attachment; filename="${filename.replace('encrypted-', '')}"`);
            res.send(decryptedData);
        } catch (error) {
            console.error("Decryption failed:", error);
            return res.status(500).json({ error: "Decryption failed!" });
        }
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
