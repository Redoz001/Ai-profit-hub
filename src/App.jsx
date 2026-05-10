import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [skill, setSkill] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    if (!skill) {
      setResult("Enter a skill first (e.g. beginner)");
      return;
    }

    try {
      setLoading(true);
      setResult("");

      const { data, error } = await supabase.functions.invoke("Reuben", {
        body: { skill },
      });

      if (error) {
        setResult("Error: " + error.message);
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setResult("Crash: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Reuben AI 🚀</h1>

      <input
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        placeholder="Enter skill (beginner, freelancer...)"
        style={{ padding: 10, width: 250 }}
      />

      <br /><br />

      <button onClick={generatePlan} style={{ padding: 10 }}>
        {loading ? "Generating..." : "Generate Plan"}
      </button>

      <hr />

      <pre style={{ whiteSpace: "pre-wrap" }}>
        {result}
      </pre>
    </div>
  );
}