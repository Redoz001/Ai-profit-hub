import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);

  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");

  // 🔐 LOAD USER SESSION
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };

    loadUser();

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
      setStatus(error.message);
      return;
    }

    setStatus("Check your email 📩");
  };

  // 🤖 GENERATE + SAVE AI PLAN
  const generate = async () => {
    try {
      setStatus("Generating...");

      const { data, error } = await supabase.functions.invoke("Reuben", {
        body: { skill },
      });

      if (error) {
        console.log("AI ERROR:", error);
        setStatus(error.message);
        return;
      }

      const result = data?.plan?.join("\n");

      if (!result) {
        setStatus("No AI response");
        return;
      }

      setPlan(result);

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData?.user) {
        setStatus("User not found");
        return;
      }

      const { error: dbError } = await supabase
        .from("ai_outputs")
        .insert({
          user_id: userData.user.id,
          input: skill,
          output: result,
        });

      if (dbError) {
        console.log("DB ERROR:", dbError);
        setStatus("Saved but DB failed");
        return;
      }

      setStatus("Generated + Saved ✅");
    } catch (err) {
      console.log(err);
      setStatus("Unexpected error");
    }
  };

  // 💳 UPGRADE (Stripe)
  const upgrade = async () => {
    setStatus("Redirecting...");

    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session"
    );

    if (error) {
      console.log(error);
      setStatus(error.message);
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

  // 🟢 DASHBOARD
  return (
    <div style={{ padding: 20 }}>
      <h1>Reuben AI</h1>

      <p>Logged in: {user.email}</p>

      <input
        placeholder="skill (beginner, student, freelancer)"
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        style={{ padding: 10, width: 300 }}
      />

      <br /><br />

      <button onClick={generate}>Generate Plan</button>
      <button onClick={upgrade} style={{ marginLeft: 10 }}>
        Upgrade
      </button>

      <p>{status}</p>

      <pre
        style={{
          marginTop: 20,
          background: "#111",
          color: "#00ff88",
          padding: 15,
          whiteSpace: "pre-wrap",
        }}
      >
        {plan}
      </pre>
    </div>
  );
}