import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    if (!skill.trim()) {
      setPlan("Enter a valid level (beginner, student, freelancer)");
      return;
    }

    try {
      setLoading(true);
      setPlan("");

      const { data, error } = await supabase.functions.invoke("Reuben", {
        body: { skill },
      });

      if (error) {
        console.log(error);
        setPlan("Server error. Try again.");
        setLoading(false);
        return;
      }

      // SAFE extraction
      const result =
        typeof data === "string"
          ? data
          : data?.plan || data?.url || JSON.stringify(data);

      // LIMIT SIZE (prevents UI crash/enlarge)
      const safeResult =
        result.length > 1500 ? result.slice(0, 1500) + "..." : result;

      setPlan(safeResult);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setPlan("Unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial", maxWidth: "600px", margin: "auto" }}>
      <h1>Reuben AI</h1>

      <input
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        placeholder="beginner, student, freelancer"
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      <button onClick={generatePlan} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>

      <div
        style={{
          marginTop: 20,
          padding: 15,
          border: "1px solid #ccc",
          borderRadius: 10,
          maxHeight: "300px",
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {plan}
      </div>
    </div>
  );
}