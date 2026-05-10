import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    if (!skill) {
      setPlan("Please enter a skill level (e.g. beginner)");
      return;
    }

    setLoading(true);
    setPlan("");

    const { data, error } = await supabase.functions.invoke("generate-plan", {
      body: { skill }
    });

    setLoading(false);

    if (error) {
      console.log(error);
      setPlan("Something went wrong. Check function deployment.");
    } else {
      setPlan(
        Array.isArray(data.plan)
          ? data.plan.join("\n")
          : data.plan
      );
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>AI Profit Hub</h1>

      <p>Enter your level (beginner, student, freelancer)</p>

      <input
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        placeholder="e.g. beginner"
        style={{ padding: 10, width: "250px" }}
      />

      <br /><br />

      <button onClick={generatePlan} style={{ padding: 10 }}>
        {loading ? "Generating..." : "Generate Plan"}
      </button>

      <hr />

      <pre style={{ whiteSpace: "pre-wrap" }}>
        {plan}
      </pre>
    </div>
  );
}