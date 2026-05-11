import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);

  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // 🔐 GET SESSION ON LOAD
  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.log("AUTH ERROR:", error);
      }

      setUser(data?.user || null);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 📩 LOGIN (MAGIC LINK)
  const login = async () => {
    setStatus("Sending login link...");

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    console.log("LOGIN DATA:", data);
    console.log("LOGIN ERROR:", error);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Check your email 📩");
  };

  // 🤖 GENERATE PLAN (REUBEN AI)
  const generatePlan = async () => {
    setLoading(true);
    setStatus("Generating plan...");

    const { data, error } = await supabase.functions.invoke("Reuben", {
      body: { skill },
    });

    console.log("AI RESPONSE:", data);
    console.log("AI ERROR:", error);

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    if (!data?.plan) {
      setStatus("No AI response received");
      setLoading(false);
      return;
    }

    setPlan(data.plan.join("\n"));
    setStatus("Plan ready ✅");
    setLoading(false);
  };

  // 💳 UPGRADE (STRIPE)
  const upgrade = async () => {
    setStatus("Opening payment...");

    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session"
    );

    console.log("STRIPE DATA:", data);
    console.log("STRIPE ERROR:", error);

    if (error) {
      setStatus(error.message);
      return;
    }

    if (!data?.url) {
      setStatus("No checkout URL returned");
      return;
    }

    window.location.href = data.url;
  };

  // 🔴 LOGIN SCREEN
  if (!user) {
    return (
      <div style={{ padding: 20, fontFamily: "Arial" }}>
        <h2>Reuben AI Login</h2>

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, width: 260 }}
        />

        <br /><br />

        <button onClick={login}>
          Send Magic Link
        </button>

        <p style={{ color: "blue" }}>{status}</p>
      </div>
    );
  }

  // 🟢 MAIN APP
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Reuben AI SaaS</h1>

      <p>Logged in as: <b>{user.email}</b></p>

      <input
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        placeholder="beginner, student, freelancer"
        style={{ padding: 10, width: 280 }}
      />

      <br /><br />

      <button onClick={generatePlan} disabled={loading}>
        {loading ? "Generating..." : "Generate Plan"}
      </button>

      <button onClick={upgrade} style={{ marginLeft: 10 }}>
        Upgrade
      </button>

      <p style={{ color: "green" }}>{status}</p>

      <pre
        style={{
          marginTop: 20,
          padding: 15,
          background: "#111",
          color: "#00ff88",
          whiteSpace: "pre-wrap",
        }}
      >
        {plan}
      </pre>
    </div>
  );
}