import express from 'express';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import cors from 'cors';
import dotenv from 'dotenv';
import cache from 'memory-cache';  // Import memory-cache

const app = express();
app.use(bodyParser.json());
app.use(cors());
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


const cacheDuration = 15 * 60 * 1000;

async function writeIdeaData(name, idea, desc) {
    try {
      const ideaData = {
        name: name,
        idea: idea,
        desc: desc,
        createdAt: new Date()
      };
  
      const ideaRef = db.collection('ideas').doc('ideasCollection');

      await ideaRef.set({
        ideas: admin.firestore.FieldValue.arrayUnion(ideaData)
      }, { merge: true });
  
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

        // Clear the cache for /view after a new idea is submitted
        cache.del('/view');
        
        res.send("Idea submitted successfully!");
    } catch (error) {
        console.error("Error submitting idea: ", error);
        res.status(500).send("Error submitting idea");
    }
});

app.get("/view", async (req, res) => {
    // Check if cached data exists
    const cachedIdeas = cache.get('/view');
    if (cachedIdeas) {
        return res.json(cachedIdeas); // Return cached data if available
    }

    try {
        const docRef = db.collection('ideas').doc('ideasCollection');
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            const ideas = data.ideas.map(idea => ({
                name: idea.name,
                idea: idea.idea,
                desc: idea.desc
            }));

            // Store the result in cache
            cache.put('/view', ideas, cacheDuration);

            res.json(ideas); 
        } else {
            console.log("No such document!");
            res.status(404).send("No such document!");
        }
    } catch (error) {
        console.error("Error retrieving document: ", error);
        res.status(500).send("Error retrieving document");
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
