import React, { useEffect, useState, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useNavigate, useParams } from "react-router-dom";

const APP_ID = "a178b220f82a4fcea128db18db32efc5";
const SERVER_URL = "http://localhost:5000";

function Broadcaster() {
    const [client, setClient] = useState(null);
    const [localTracks, setLocalTracks] = useState([]);
    const videoRef = useRef(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const navigate = useNavigate();
    const { channelName } = useParams();

    const startStreaming = async () => {
        try {
            const uid = Math.floor(Math.random() * 100000);
            const response = await fetch(`${SERVER_URL}/generate-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelName, uid, role: "publisher" }),
            });

            const { token } = await response.json();
            await client.setClientRole("host");
            await client.join(APP_ID, channelName, token, uid);

            // ✅ Capture screen with system audio enabled
            const screenTrack = await AgoraRTC.createScreenVideoTrack({
                encoderConfig: "1080p_2",
                withAudio: "enable", // 🔥 Ensures system audio is captured
            });

            // ✅ Capture microphone audio separately (optional)
            let audioTrack;
            if (!screenTrack.hasAudio) {
                console.warn("Screen track does not have system audio, using microphone.");
                audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            }

            // Play screen share locally
            screenTrack.play(videoRef.current);

            // ✅ Publish both screen and audio tracks
            const tracksToPublish = [screenTrack];
            if (audioTrack) tracksToPublish.push(audioTrack);
            await client.publish(tracksToPublish);

            setLocalTracks(tracksToPublish);
            setIsStreaming(true);
            console.log("Screen sharing started");

            // Handle screen sharing stop event
            screenTrack.on("track-ended", () => {
                console.log("Screen sharing stopped!");
                stopStreaming();
            });

        } catch (error) {
            console.error("Error starting stream:", error);
        }
    };

    const stopStreaming = async () => {
        try {
            await client.unpublish(localTracks);
            localTracks.forEach((track) => {
                track.stop();
                track.close();
            });
            setLocalTracks([]);
            await client.leave();
            setClient(null);
            setIsStreaming(false);
            navigate("/");
            console.log("Broadcaster stopped stream");
        } catch (error) {
            console.error("Error stopping stream:", error);
        }
    };

    useEffect(() => {
        const initAgora = async () => {
            try {
                const agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
                setClient(agoraClient);
            } catch (error) {
                console.error("Error initializing Agora:", error);
            }
        };

        initAgora();

        return () => {
            if (client) {
                client.leave()
                    .then(() => console.log("Client left channel"))
                    .catch((e) => console.error("Leave error", e));
                localTracks.forEach((track) => {
                    track.stop();
                    track.close();
                });
                setLocalTracks([]);
                client.unpublish();
            }
        };
    }, []);

    return (
        <div>
            <h2>Broadcaster (Screen Sharing with Audio)</h2>
            {!isStreaming ? (
                <button onClick={startStreaming}>Start Screen Share</button>
            ) : (
                <button onClick={stopStreaming}>Stop Sharing</button>
            )}
            <video ref={videoRef} autoPlay playsInline style={{ width: "640px", height: "480px", background: "#000" }}></video>
        </div>
    );
}

export default Broadcaster;
