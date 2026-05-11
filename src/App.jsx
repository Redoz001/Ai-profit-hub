import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);

  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");

  // 🔐 LOGIN (KEEP SIMPLE — THIS WAS WORKING BEFORE)
  const login = async () => {
    setStatus("Sending login link...");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://ai-profit-hub.vercel.app",
      },
    });

    if (error) {
      console.log(error);
      setStatus(error.message);
    } else {
      setStatus("Check your email 📩");
    }
  };

  // 🤖 GENERATE
  const generatePlan = async () => {
    setStatus("Generating...");

    const { data, error } = await supabase.functions.invoke("Reuben", {
      body: { skill },
    });

    if (error) {
      console.log(error);
      setStatus("Generate failed");
      return;
    }

    setPlan(data.plan.join("\n"));
    setStatus("Done ✅");
  };

  // 💳 UPGRADE
  const upgrade = async () => {
    setStatus("Redirecting...");

    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session"
    );

    if (error) {
      console.log(error);
      setStatus("Payment error");
      return;
    }

    window.location.href = data.url;
  };

  // 🔴 LOGIN SCREEN
  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Reuben AI Login</h2>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          style={{ padding: 10 }}
        />

        <br /><br />

        <button onClick={login}>Send Magic Link</button>

        <p>{status}</p>
      </div>
    );
  }

  // 🟢 APP
  return (
    <div style={{ padding: 20 }}>
      <h1>Reuben AI</h1>

      <input
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        placeholder="beginner"
      />

      <br /><br />

      <button onClick={generatePlan}>Generate</button>
      <button onClick={upgrade}>Upgrade</button>

      <p>{status}</p>

      <pre>{plan}</pre>
    </div>
  );
}