import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [skill, setSkill] = useState("");
  const [result, setResult] = useState("Your results will appear here...");
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    try {
      setLoading(true);
      setResult("Generating your plan...");

      const { data, error } = await supabase.functions.invoke("Reuben", {
        body: { skill },
      });

      if (error) {
        setResult("Error: " + error.message);
      } else {
        setResult(data?.plan || JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setResult("Crash: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "white",
      fontFamily: "Arial",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: 20
    }}>
      <div style={{
        width: "100%",
        maxWidth: 600,
        background: "#111827",
        padding: 20,
        borderRadius: 12
      }}>
        <h1>Reuben AI 🚀</h1>

        <p>Enter your level:</p>

        <input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="beginner / freelancer / student"
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
            border: "none"
          }}
        />

        <button
          onClick={generatePlan}
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            background: loading ? "#555" : "#22c55e",
            color: "white"
          }}
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>

        <pre style={{
          marginTop: 20,
          background: "#000",
          padding: 15,
          borderRadius: 8,
          whiteSpace: "pre-wrap"
        }}>
          {result}
        </pre>
      </div>
    </div>
  );
}