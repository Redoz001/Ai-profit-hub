import { useState } from "react";

export default function App() {
  const [skill, setSkill] = useState("");

  return (
    <div style={{ padding: 20 }}>
      <h1>App is still alive ✅</h1>

      <input
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        placeholder="Type something"
      />

      <p>{skill}</p>
    </div>
  );
}