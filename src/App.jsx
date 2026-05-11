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

  const [tab, setTab] = useState("generate");

  // 🔐 LOAD USER DATA
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user || null;

      setUser(currentUser);

      if (!currentUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", currentUser.id)
        .single();

      setIsPremium(profile?.is_premium || false);

      const { data: usageData } = await supabase
        .from("usage_limits")
        .select("requests_used")
        .eq("user_id", currentUser.id)
        .single();

      setUsage(usageData?.requests_used || 0);

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
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) setStatus(error.message);
    else setStatus("Check your email 📩");
  };

  // 🤖 GENERATE
  const generate = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return setStatus("Not logged in");

    const canUse = isPremium || usage < 10;
    if (!canUse) return setStatus("Upgrade required 🔒");

    setStatus("Generating...");

    const { data, error } = await supabase.functions.invoke("Reuben", {
      body: { skill },
    });

    if (error) return setStatus(error.message);

    const result = data?.plan?.join("\n");
    setPlan(result);

    await supabase.from("ai_outputs").insert({
      user_id: userData.user.id,
      input: skill,
      output: result,
    });

    setStatus("Done ✅");

    const { data: refreshed } = await supabase
      .from("ai_outputs")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    setHistory(refreshed || []);
  };

  // 💳 UPGRADE
  const upgrade = async () => {
    const { data } = await supabase.functions.invoke(
      "create-checkout-session"
    );

    window.location.href = data.url;
  };

  // 🔴 LOGIN SCREEN
  if (!user) {
    return (
      <div style={styles.center}>
        <h1>Reuben AI</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <button onClick={login} style={styles.button}>
          Login
        </button>

        <p>{status}</p>
      </div>
    );
  }

  // 🧭 MAIN LAYOUT
  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2>Reuben AI</h2>

        <button onClick={() => setTab("generate")} style={styles.navBtn}>
          Generate
        </button>

        <button onClick={() => setTab("history")} style={styles.navBtn}>
          History
        </button>

        <button onClick={upgrade} style={styles.upgradeBtn}>
          Upgrade
        </button>

        <p style={{ fontSize: 12, marginTop: 10 }}>
          {isPremium ? "Premium 🟢" : "Free 🔒"} <br />
          Usage: {usage}/10
        </p>
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        {/* GENERATE TAB */}
        {tab === "generate" && (
          <div>
            <h2>Generate AI Plan</h2>

            <input
              placeholder="Enter skill (e.g. beginner, coding)"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              style={styles.input}
            />

            <br />

            <button onClick={generate} style={styles.button}>
              Generate
            </button>

            <p>{status}</p>

            <div style={styles.outputBox}>
              {plan}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div>
            <h2>History</h2>

            {history.length === 0 ? (
              <p>No history yet</p>
            ) : (
              history.map((item) => (
                <div key={item.id} style={styles.card}>
                  <strong>{item.input}</strong>
                  <pre style={{ whiteSpace: "pre-wrap" }}>
                    {item.output}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 🎨 STYLES
const styles = {
  app: {
    display: "flex",
    height: "100vh",
    fontFamily: "Arial",
  },
  sidebar: {
    width: 220,
    background: "#111",
    color: "#fff",
    padding: 20,
  },
  main: {
    flex: 1,
    padding: 30,
    background: "#f5f5f5",
    overflowY: "auto",
  },
  input: {
    padding: 10,
    width: "100%",
    marginBottom: 10,
  },
  button: {
    padding: 10,
    background: "black",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  upgradeBtn: {
    marginTop: 20,
    padding: 10,
    background: "gold",
    border: "none",
    cursor: "pointer",
  },
  navBtn: {
    display: "block",
    marginTop: 10,
    padding: 10,
    width: "100%",
    background: "#333",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  outputBox: {
    marginTop: 20,
    padding: 15,
    background: "#111",
    color: "#00ff88",
    whiteSpace: "pre-wrap",
  },
  card: {
    background: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  center: {
    textAlign: "center",
    marginTop: 100,
  },
};