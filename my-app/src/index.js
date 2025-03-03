import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // react-router-dom import
import SubwayInfo from './SubwayInfo'; // SubwayInfo 컴포넌트 import
import reportWebVitals from './reportWebVitals'; // reportWebVitals import

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/main" element={<SubwayInfo />} /> {/* SubwayInfo 컴포넌트 렌더링 */}
      </Routes>
    </Router>
  </React.StrictMode>
);

reportWebVitals();
