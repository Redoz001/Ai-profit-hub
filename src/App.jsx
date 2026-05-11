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

  // 🔐 LOAD USER + DATA
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user || null;

      setUser(currentUser);

      if (!currentUser) return;

      // PROFILE
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", currentUser.id)
        .single();

      setIsPremium(profile?.is_premium || false);

      // USAGE
      const { data: usageData } = await supabase
        .from("usage_limits")
        .select("requests_used")
        .eq("user_id", currentUser.id)
        .single();

      setUsage(usageData?.requests_used || 0);

      // HISTORY (STEP 8 CORE FEATURE)
      const { data: outputs } = await supabase
        .from("ai_outputs")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      setHistory(outputs || []);
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
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
    try {
      setStatus("Checking access...");

      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        setStatus("Not logged in");
        return;
      }

      const canUse = isPremium || usage < 10;

      if (!canUse) {
        setStatus("Limit reached 🔒 Upgrade required");
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

      // 💾 SAVE HISTORY (STEP 8 CORE)
      await supabase.from("ai_outputs").insert({
        user_id: userData.user.id,
        input: skill,
        output: result,
      });

      // 📊 UPDATE USAGE
      await supabase.from("usage_limits").upsert({
        user_id: userData.user.id,
        requests_used: usage + 1,
      });

      setUsage((prev) => prev + 1);

      // 📈 LOG EVENT
      await supabase.from("analytics").insert({
        user_id: userData.user.id,
        event: "generate_ai",
      });

      // 🔄 REFRESH HISTORY (REAL-TIME UX)
      const { data: refreshed } = await supabase
        .from("ai_outputs")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      setHistory(refreshed || []);

      setStatus("Generated + Saved to History ✅");
    } catch (err) {
      console.log(err);
      setStatus("Unexpected error");
    }
  };

  // 💳 UPGRADE
  const upgrade = async () => {
    setStatus("Redirecting...");

    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session"
    );

    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = data.url;
  };

  // 🔴 LOGIN SCREEN
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

        <button onClick={login}>Send Magic Link</button>

        <p>{status}</p>
      </div>
    );
  }

  // 🟢 DASHBOARD
  return (
    <div style={{ padding: 20 }}>
      <h1>Reuben AI</h1>

      <p>User: {user.email}</p>
      <p>
        Plan: {isPremium ? "Premium 🟢" : "Free 🔒"} | Usage: {usage}/10
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

      {/* CURRENT OUTPUT */}
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

      {/* 📜 HISTORY (STEP 8 CORE FEATURE) */}
      <div style={{ marginTop: 30 }}>
        <h2>📜 History</h2>

        {history.length === 0 ? (
          <p>No history yet</p>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#1a1a1a",
                padding: 12,
                marginBottom: 10,
                borderRadius: 8,
              }}
            >
              <strong>Input:</strong>
              <p>{item.input}</p>

              <strong>Output:</strong>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {item.output}
              </pre>

              <small style={{ color: "gray" }}>
                {new Date(item.created_at).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}