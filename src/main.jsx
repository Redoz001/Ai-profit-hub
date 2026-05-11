import { Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing";
import App from "../pages/App";

export default function Main() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<App />} />
    </Routes>
  );
}