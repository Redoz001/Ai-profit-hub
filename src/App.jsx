import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);

  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");

  const [isPremium, setIsPremium] = useState(false);
  const [usage, setUsage] = useState(0);

  const [history, setHistory] = useState([]);

  // 🔐 LOAD USER DATA
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user || null;

      setUser(currentUser);

      if (!currentUser) return;

      // profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", currentUser.id)
        .single();

      setIsPremium(profile?.is_premium || false);

      // usage
      const { data: usageData } = await supabase
        .from("usage_limits")
        .select("requests_used")
        .eq("user_id", currentUser.id)
        .single();

      setUsage(usageData?.requests_used || 0);

      // history
      const { data: outputs } = await supabase
        .from("ai_outputs")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      setHistory(outputs || []);
    };

    load();
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
      setStatus(error.message);
      return;
    }

    setStatus("Check your email 📩");
  };

  // 🤖 GENERATE AI
  const generate = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      setStatus("Not logged in");
      return;
    }

    const canUse = isPremium || usage < 10;

    if (!canUse) {
      setStatus("Limit reached 🔒");
      return;
    }

    setStatus("Generating...");

    const { data, error } = await supabase.functions.invoke("Reuben", {
      body: { skill },
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    const result = data?.plan?.join("\n");
    setPlan(result);

    // save output
    await supabase.from("ai_outputs").insert({
      user_id: userData.user.id,
      input: skill,
      output: result,
    });

    // usage update
    await supabase.from("usage_limits").upsert({
      user_id: userData.user.id,
      requests_used: usage + 1,
    });

    setUsage((prev) => prev + 1);

    // reload history
    const { data: outputs } = await supabase
      .from("ai_outputs")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    setHistory(outputs || []);

    setStatus("Done ✅");
  };

  // 💳 UPGRADE (STEP 3 CONNECTED)
  const upgrade = async () => {
    setStatus("Redirecting to payment...");

    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session"
    );

    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = data.url;
  };

  // 🔴 LOGIN UI
  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Reuben AI</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, width: 250 }}
        />

        <br /><br />

        <button onClick={login}>Login</button>

        <p>{status}</p>
      </div>
    );
  }

  // 🟢 DASHBOARD
  return (
    <div style={{ padding: 20 }}>
      <h1>Reuben AI</h1>

      <p>
        {user.email} | {isPremium ? "Premium 🟢" : "Free 🔒"} | {usage}/10
      </p>

      <input
        placeholder="skill"
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        style={{ padding: 10, width: 300 }}
      />

      <br /><br />

      <button onClick={generate}>Generate</button>
      <button onClick={upgrade} style={{ marginLeft: 10 }}>
        Upgrade
      </button>

      <p>{status}</p>

      <pre style={{ background: "#111", color: "#0f0", padding: 10 }}>
        {plan}
      </pre>

      <h3>History</h3>
      {history.map((h) => (
        <div key={h.id} style={{ marginBottom: 10 }}>
          <b>{h.input}</b>
          <pre>{h.output}</pre>
        </div>
      ))}
    </div>
  );
}