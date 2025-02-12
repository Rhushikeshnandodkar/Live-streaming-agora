import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SERVER_URL = 'http://localhost:5000';

function TutorPage() {
  const [channelName, setChannelName] = useState('');
  const navigate = useNavigate();

  const startClass = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/generate-channel`);
      const { channelName: newChannelName } = await response.json();
      setChannelName(newChannelName);
      navigate(`/broadcast/${newChannelName}`); // Navigate to Broadcaster with channelName

    } catch (error) {
      console.error("Error starting class:", error);
    }
  };

  return (
    <div>
      <h2>Tutor</h2>
      <button onClick={startClass}>Start Class</button>
      {/* Remove the Share URL display from here */}
    </div>
  );
}

export default TutorPage;