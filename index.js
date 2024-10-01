import express from 'express';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import cors from 'cors';
import dotenv from 'dotenv';

const app = express();
dotenv.config();

try {
    const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    if (serviceAccountKey.private_key.includes('\\n')) {
        serviceAccountKey.private_key = serviceAccountKey.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
    });
    console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    process.exit(1);
}

const db = admin.firestore();
app.use(bodyParser.json());
app.use(cors());

async function writeIdeaData(name, idea, desc) {
  try {
    await db.collection('ideas').add({
      name: name,
      idea: idea,
      desc: desc,
      createdAt: new Date()
    });
    console.log("Idea saved successfully.");
  } catch (error) {
    console.error("Error writing document: ", error);
    throw error;
  }
}

app.post('/submit', async (req, res) => {
    const { name, idea, desc } = req.body;

    if (!name || !idea || !desc) {
        return res.status(400).send("Missing name, idea, or desc");
    }

    try {
        await writeIdeaData(name, idea, desc);
        res.send("Idea submitted successfully!");
    } catch (error) {
        console.error("Error submitting idea: ", error);
        res.status(500).send("Error submitting idea");
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
