import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [skill, setSkill] = useState("");
  const [result, setResult] = useState("Your results will appear here...");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // LOAD HISTORY
  const loadHistory = async () => {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setHistory(data || []);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // GENERATE PLAN
  const generatePlan = async () => {
    try {
      setLoading(true);
      setResult("Generating...");

      const { data, error } = await supabase.functions.invoke("Reuben", {
        body: { skill },
      });

      if (error) {
        setResult("Error: " + error.message);
        return;
      }

      const planText = data?.plan || JSON.stringify(data, null, 2);

      setResult(planText);

      // SAVE TO SUPABASE
      await supabase.from("plans").insert([
        {
          skill,
          plan: planText,
        },
      ]);

      // REFRESH HISTORY
      loadHistory();

    } catch (err) {
      setResult("Crash: " + err.message);
    } finally {
      setLoading(false);
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
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 700,
          background: "#111827",
          padding: 20,
          borderRadius: 12,
        }}
      >
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
            border: "none",
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
            color: "white",
          }}
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>

        <pre
          style={{
            marginTop: 20,
            background: "#000",
            padding: 15,
            borderRadius: 8,
            whiteSpace: "pre-wrap",
          }}
        >
          {result}
        </pre>

        <h2 style={{ marginTop: 30 }}>History</h2>

        {history.length === 0 && <p>No history yet.</p>}

        {history.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#1f2937",
              padding: 10,
              marginBottom: 10,
              borderRadius: 8,
            }}
          >
            <b>{item.skill}</b>
            <p style={{ whiteSpace: "pre-wrap" }}>{item.plan}</p>
            <small>
              {new Date(item.created_at).toLocaleString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}