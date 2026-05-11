import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);

  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");

  const [status, setStatus] = useState("");

  // 🔐 CHECK USER SESSION
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 📩 LOGIN
  const login = async () => {
    setStatus("Sending magic link...");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      console.log(error);
      setStatus("Login failed");
    } else {
      setStatus("Check your email");
    }
  };

  // 🤖 GENERATE PLAN
  const generatePlan = async () => {
    setStatus("Generating plan...");

    const { data, error } = await supabase.functions.invoke("Reuben", {
      body: { skill },
    });

    if (error) {
      console.log(error);
      setStatus("Failed to generate");
      return;
    }

    setPlan(data.plan.join("\n"));
    setStatus("Plan ready");
  };

  // 💳 UPGRADE
  const upgrade = async () => {
    setStatus("Redirecting to payment...");

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
      <div style={{ padding: 20, fontFamily: "Arial" }}>
        <h2>Login to Reuben AI</h2>

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: 10,
            width: 260,
            marginBottom: 10,
          }}
        />

        <br />

        <button onClick={login}>
          Send Magic Link
        </button>

        <p>{status}</p>
      </div>
    );
  }

  // 🟢 MAIN APP
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Reuben AI SaaS</h1>

      <p>
        Logged in as: <b>{user.email}</b>
      </p>

      <input
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        placeholder="beginner, student, freelancer"
        style={{
          padding: 10,
          width: 300,
          marginBottom: 10,
        }}
      />

      <br />

      <button onClick={generatePlan}>
        Generate Plan
      </button>

      <button
        onClick={upgrade}
        style={{ marginLeft: 10 }}
      >
        Upgrade
      </button>

      <p>{status}</p>

      <pre
        style={{
          marginTop: 20,
          background: "#111",
          color: "#00ff88",
          padding: 15,
          borderRadius: 10,
          whiteSpace: "pre-wrap",
        }}
      >
        {plan}
      </pre>
    </div>
  );
}