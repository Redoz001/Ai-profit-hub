import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);

  // 🤖 GENERATE PLAN
  const generatePlan = async () => {
    if (!skill.trim()) {
      setPlan("Enter a level like beginner, student, freelancer");
      return;
    }

    try {
      setLoadingPlan(true);
      setPlan("");

      const { data, error } = await supabase.functions.invoke("Reuben", {
        body: { skill },
      });

      if (error) {
        console.log(error);
        setPlan("Error generating plan");
        setLoadingPlan(false);
        return;
      }

      const result = data?.plan;

      if (!Array.isArray(result)) {
        setPlan("Invalid response from server");
      } else {
        setPlan(result.join("\n"));
      }

      setLoadingPlan(false);
    } catch (err) {
      console.log(err);
      setPlan("Something went wrong");
      setLoadingPlan(false);
    }
  };

  // 💳 UPGRADE (STRIPE)
  const upgrade = async () => {
    try {
      setLoadingUpgrade(true);

      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session"
      );

      if (error) {
        console.log(error);
        alert("Payment error");
        setLoadingUpgrade(false);
        return;
      }

      if (!data?.url) {
        alert("No checkout URL returned");
        setLoadingUpgrade(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.log(err);
      alert("Upgrade failed");
    } finally {
      setLoadingUpgrade(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial", maxWidth: 600, margin: "auto" }}>
      <h1>Reuben AI</h1>

      {/* INPUT */}
      <input
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        placeholder="beginner, student, freelancer"
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      {/* BUTTONS */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={generatePlan} disabled={loadingPlan}>
          {loadingPlan ? "Generating..." : "Generate Plan"}
        </button>

        <button onClick={upgrade} disabled={loadingUpgrade}>
          {loadingUpgrade ? "Loading..." : "Upgrade"}
        </button>
      </div>

      {/* OUTPUT */}
      <pre
        style={{
          marginTop: 20,
          padding: 15,
          background: "#111",
          color: "#0f0",
          whiteSpace: "pre-wrap",
        }}
      >
        {plan}
      </pre>
    </div>
  );
}