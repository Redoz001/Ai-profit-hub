import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);
  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");

  // 🔐 CHECK SESSION ON LOAD
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 📩 SEND LOGIN LINK
  const login = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://ai-profit-hub.vercel.app",
      },
    });

    if (error) {
      alert("Login failed");
    } else {
      alert("Check your email for login link");
    }
  };

  // 🤖 GENERATE PLAN
  const generatePlan = async () => {
    const { data } = await supabase.functions.invoke("Reuben", {
      body: { skill },
    });

    setPlan(data.plan.join("\n"));
  };

  // 💳 UPGRADE
  const upgrade = async () => {
    const { data } = await supabase.functions.invoke(
      "create-checkout-session"
    );

    window.location.href = data.url;
  };

  // 🔴 NOT LOGGED IN → SHOW LOGIN SCREEN
  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Login to Reuben AI</h2>

        <input
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, width: 250 }}
        />

        <br /><br />

        <button onClick={login}>Send Magic Link</button>
      </div>
    );
  }

  // 🟢 LOGGED IN → SHOW APP
  return (
    <div style={{ padding: 20 }}>
      <h1>Reuben AI</h1>

      <p>Logged in as: {user.email}</p>

      <input
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        placeholder="beginner, student..."
      />

      <br /><br />

      <button onClick={generatePlan}>Generate</button>
      <button onClick={upgrade}>Upgrade</button>

      <pre>{plan}</pre>
    </div>
  );
}