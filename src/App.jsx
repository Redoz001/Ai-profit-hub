import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [skill, setSkill] = useState("");
  const [result, setResult] = useState("Ready ✅");
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    try {
      setLoading(true);
      setResult("Generating...");

      const { data, error } = await supabase.functions.invoke("Reuben", {
        body: { skill },
      });

      if (error) {
        setResult("Error: " + error.message);
        console.error(error);
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setResult("Crash: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Arial",
        maxWidth: 700,
        margin: "auto",
      }}
    >
      <h1>Reuben AI 🚀</h1>

      <p>Enter your level:</p>

      <input
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        placeholder="beginner / freelancer / student"
        style={{
          padding: 10,
          width: "100%",
          marginBottom: 10,
        }}
      />

      <button
        onClick={generatePlan}
        disabled={loading}
        style={{
          padding: 10,
          cursor: "pointer",
        }}
      >
        {loading ? "Generating..." : "Generate Plan"}
      </button>

      <hr />

      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: "#111",
          color: "#0f0",
          padding: 15,
          borderRadius: 10,
        }}
      >
        {result}
      </pre>
    </div>
  );
}