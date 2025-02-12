import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';

const APP_ID = 'a178b220f82a4fcea128db18db32efc5';
const SERVER_URL = 'http://localhost:5000';

function StudentPage() {
    const { channelName } = useParams();
    const videoContainerRef = useRef(null); // Video container reference
    const clientRef = useRef(null);
    const [remoteUsers, setRemoteUsers] = useState({});

    useEffect(() => {
        const initAgora = async () => {
            try {
                console.log("Initializing Agora...");

                const agoraClient = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
                clientRef.current = agoraClient;

                // 🔹 Fetch the token
                const uid = 0;
                const response = await fetch(`${SERVER_URL}/generate-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ channelName, uid, role: 'subscriber' }),
                });

                const { token } = await response.json();
                if (!token) throw new Error("Failed to fetch token!");

                console.log('Token received:', token);

                // 🔹 Join Agora Channel
                await agoraClient.join(APP_ID, channelName, token, uid);
                console.log('Joined Agora channel:', channelName);

                // 📌 Handle new remote user joining
                agoraClient.on('user-published', async (user, mediaType) => {
                    console.log('User Published:', user.uid, mediaType);
                    await agoraClient.subscribe(user, mediaType);
                    console.log('Subscribed to user:', user.uid);

                    if (mediaType === 'video') {
                        const videoTrack = user.videoTrack;
                        console.log('Remote Video Track:', videoTrack);

                        if (videoTrack && videoContainerRef.current) {
                            try {
                                // Clear existing video and play new one
                                videoContainerRef.current.innerHTML = '';
                                videoTrack.play(videoContainerRef.current);
                                console.log('Video playing successfully');
                            } catch (err) {
                                console.error('Error playing video:', err);
                            }
                        }

                        setRemoteUsers((prevUsers) => ({ ...prevUsers, [user.uid]: { videoTrack } }));
                    } 

                    // 🎤 Handle audio track
                    if (mediaType === 'audio') {
                        const audioTrack = user.audioTrack;
                        if (audioTrack) {
                            audioTrack.play(); // Play the audio
                            console.log('Audio playing successfully');
                        }

                        setRemoteUsers((prevUsers) => ({
                            ...prevUsers,
                            [user.uid]: { ...prevUsers[user.uid], audioTrack },
                        }));
                    }
                });

                // 📌 Handle user leaving/unpublishing
                agoraClient.on('user-unpublished', (user, mediaType) => {
                    console.log('User Unpublished:', user.uid);

                    setRemoteUsers((prevUsers) => {
                        const updatedUsers = { ...prevUsers };
                        if (updatedUsers[user.uid]) {
                            if (mediaType === 'video' && updatedUsers[user.uid].videoTrack) {
                                updatedUsers[user.uid].videoTrack.stop();
                            }
                            if (mediaType === 'audio' && updatedUsers[user.uid].audioTrack) {
                                updatedUsers[user.uid].audioTrack.stop();
                            }
                            delete updatedUsers[user.uid];
                        }
                        return updatedUsers;
                    });
                });

            } catch (error) {
                console.error('Agora Error:', error);
            }
        };

        initAgora();

        return () => {
            if (clientRef.current) {
                clientRef.current.leave().then(() => console.log('Left channel'));
            }
        };
    }, [channelName]);

    return (
        <div>
            <h2>Viewer</h2>
            {/* 🔹 Ensure only one video instance is inside this div */}
            <div ref={videoContainerRef} style={{ width: '640px', height: '480px', backgroundColor: 'black' }}></div>
        </div>
    );
}

export default StudentPage;
