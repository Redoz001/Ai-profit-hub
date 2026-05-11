import { Routes, Route } from "react-router-dom";

import Landing from "src/pages/Landing";
import App from "src/pages/App.jsx";

export default function Main() {
  return (
    <Routes>
      <Route path="/" element={<Landing.jsx />} />
      <Route path="/app" element={<App.jsx />} />
    </Routes>
  );
}