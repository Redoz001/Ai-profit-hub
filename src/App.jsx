import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);
  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // 🔐 CHECK SESSION
  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.log("Auth error:", error);
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

  // 📩 LOGIN
  const login = async () => {
    setStatus("Sending login link...");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      console.log(error);
      setStatus("Login failed ❌");
    } else {
      setStatus("Check your email 📩");
    }
  };

  // 🤖 GENERATE PLAN
  const generatePlan = async () => {
    try {
      setLoading(true);
      setStatus("Generating plan...");

      console.log("Calling Reuben function...");

      const { data, error } = await supabase.functions.invoke("Reuben", {
        body: { skill },
      });

      console.log("Response:", data, error);

      if (error) {
        setStatus("Generate failed ❌");
        setPlan("");
        return;
      }

      if (!data?.plan) {
        setStatus("No plan returned ❌");
        setPlan("");
        return;
      }

      setPlan(data.plan.join("\n"));
      setStatus("Plan generated ✅");
    } catch (err) {
      console.log(err);
      setStatus("Unexpected error ❌");
    } finally {
      setLoading(false);
    }
  };

  // 💳 UPGRADE
  const upgrade = async () => {
    try {
      setStatus("Redirecting to payment...");

      console.log("Calling Stripe function...");

      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session"
      );

      console.log("Stripe response:", data, error);

      if (error) {
        setStatus("Payment error ❌");
        return;
      }

      if (!data?.url) {
        setStatus("No checkout URL ❌");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.log(err);
      setStatus("Upgrade failed ❌");
    }
  };

  // 🔴 LOGIN SCREEN
  if (!user) {
    return (
      <div style={{ padding: 20, fontFamily: "Arial" }}>
        <h2>Reuben AI Login</h2>

        <input
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, width: 250 }}
        />

        <br /><br />

        <button onClick={login}>Send Magic Link</button>

        <p>{status}</p>
      </div>
    );
  }

  // 🟢 APP SCREEN
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Reuben AI SaaS</h1>

      <p>Logged in: {user.email}</p>

      <input
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        placeholder="beginner, student..."
        style={{ padding: 10, width: 250 }}
      />

      <br /><br />

      <button onClick={generatePlan} disabled={loading}>
        {loading ? "Generating..." : "Generate Plan"}
      </button>

      <button onClick={upgrade} style={{ marginLeft: 10 }}>
        Upgrade
      </button>

      <p>{status}</p>

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