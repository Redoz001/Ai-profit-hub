import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    setLoading(true);
    setPlan(null);

    const { data, error } = await supabase.functions.invoke("Reuben", {
      body: { skill },
    });

    setLoading(false);

    if (error) {
      setPlan({ error: error.message });
    } else {
      setPlan(data);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Reuben AI 🚀</h1>

      <input
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        placeholder="Enter skill (e.g. beginner)"
        style={{ padding: 10, width: 250 }}
      />

      <br /><br />

      <button onClick={generatePlan} style={{ padding: 10 }}>
        {loading ? "Generating..." : "Generate Plan"}
      </button>

      <hr />

      <pre style={{ whiteSpace: "pre-wrap" }}>
        {plan ? JSON.stringify(plan, null, 2) : ""}
      </pre>
    </div>
  );
}