import { useState } from "react";

export default function App() {
  const [message, setMessage] = useState("Testing...");

  const test = async () => {
    try {
      // IMPORT SUPABASE ONLY INSIDE FUNCTION
      const { supabase } = await import("./lib/supabase");

      setMessage("Supabase imported successfully ✅");

      console.log(supabase);
    } catch (err) {
      console.error(err);

      setMessage("ERROR: " + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Reuben AI 🚀</h1>

      <button onClick={test}>
        Test Supabase
      </button>

      <p>{message}</p>
    </div>
  );
}