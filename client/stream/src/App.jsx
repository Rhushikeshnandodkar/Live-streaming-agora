import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TutorPage from './components/TutorPage';
import StudentPage from './components/StudentPage';
import Broadcaster from './components/Broadcaster'; // Import Broadcaster

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TutorPage />} />
        <Route path="/:channelName" element={<StudentPage />} />
        <Route path="/broadcast/:channelName" element={<Broadcaster />} /> {/* Broadcaster route */}
      </Routes>
    </Router>
  );
}

export default App;