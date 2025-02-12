const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;
const APP_ID = 'a178b220f82a4fcea128db18db32efc5'; // ***REPLACE WITH YOUR APP ID***
const APP_CERTIFICATE = 'f5d740928ea14b41a8df2368972d93a0'; // ***REPLACE WITH YOUR APP CERTIFICATE***

const corsOptions = {
    origin: 'http://localhost:5173', // Or your React app's URL (use * only in dev)
    methods: ['POST', 'GET'], // Add GET for /generate-channel
};

app.use(cors(corsOptions));
app.use(express.json());

app.post('/generate-token', (req, res) => {
    const { channelName, uid, role } = req.body;
    const roleType = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    console.log("Role:", role, "Mapped RoleType:", roleType);

    const expirationTimeInSeconds = 3600; // Token valid for 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    let token;
    if (!uid || uid === 0 || uid === "0") { 
        // Use UID 0 for anonymous viewers
        token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID, APP_CERTIFICATE, channelName, 0, roleType, privilegeExpiredTs
        );
    } else {
        token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID, APP_CERTIFICATE, channelName, parseInt(uid), roleType, privilegeExpiredTs
        );
    }

    console.log("Generated Token:", token); // Log for debugging
    res.json({ token });
});


app.get('/generate-channel', (req, res) => {
    const channelName = uuidv4();
    res.json({ channelName });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});