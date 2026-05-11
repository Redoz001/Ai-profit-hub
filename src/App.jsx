import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);

  // 🤖 AI PLAN GENERATOR
  const generatePlan = async () => {
    if (!skill.trim()) {
      setPlan("Please enter a skill level (e.g. beginner)");
      return;
    }

    try {
      setLoadingPlan(true);
      setPlan("");

      const { data, error } = await supabase.functions.invoke("Reuben", {
        body: { skill },
      });

      if (error) {
        console.error(error);
        setPlan("Error generating plan.");
        setLoadingPlan(false);
        return;
      }

      const result = data?.plan;

      if (!Array.isArray(result)) {
        setPlan("Invalid response from AI.");
      } else {
        setPlan(result.join("\n"));
      }

      setLoadingPlan(false);
    } catch (err) {
      console.error(err);
      setPlan("Something went wrong.");
      setLoadingPlan(false);
    }
  };

  // 💳 STRIPE UPGRADE
  const upgrade = async () => {
    try {
      setLoadingUpgrade(true);

      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session"
      );

      if (error) {
        console.error(error);
        alert("Payment error");
        setLoadingUpgrade(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("No checkout URL returned");
      }

      setLoadingUpgrade(false);
    } catch (err) {
      console.error(err);
      alert("Upgrade failed");
      setLoadingUpgrade(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          background: "#1e293b",
          padding: 25,
          borderRadius: 15,
        }}
      >
        <h1 style={{ textAlign: "center" }}>Reuben AI</h1>

        {/* INPUT */}
        <input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="beginner, student, freelancer..."
          style={{
            width: "100%",
            padding: 12,
            marginTop: 10,
            borderRadius: 8,
            border: "none",
          }}
        />

        {/* BUTTONS */}
        <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
          <button
            onClick={generatePlan}
            disabled={loadingPlan}
            style={{
              flex: 1,
              padding: 12,
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {loadingPlan ? "Generating..." : "Generate Plan"}
          </button>

          <button
            onClick={upgrade}
            disabled={loadingUpgrade}
            style={{
              flex: 1,
              padding: 12,
              background: "#22c55e",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {loadingUpgrade ? "Loading..." : "Upgrade"}
          </button>
        </div>

        {/* OUTPUT */}
        <pre
          style={{
            marginTop: 20,
            background: "#0f172a",
            padding: 15,
            borderRadius: 10,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          {plan}
        </pre>
      </div>
    </div>
  );
}