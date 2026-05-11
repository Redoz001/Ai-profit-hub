import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");

  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState([]);

  // 🔐 SESSION HANDLING
  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 📩 LOGIN (ANTI-SPAM SAFE)
  const login = async () => {
    if (loading) return;

    setLoading(true);
    setStatus("Sending magic link...");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/app",
      },
    });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    setStatus("Check your email 📩 (wait before retry)");

    setTimeout(() => {
      setLoading(false);
    }, 60000);
  };

  // 🤖 GENERATE AI
  const generate = async () => {
    if (!user) return setStatus("Login required");

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

    await supabase.from("ai_outputs").insert({
      user_id: user.id,
      input: skill,
      output: result,
    });

    const { data: refreshed } = await supabase
      .from("ai_outputs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setHistory(refreshed || []);

    setStatus("Done ✅");
  };

  // 💳 UPGRADE (STEP 6.2 FIXED)
  const upgrade = async () => {
    try {
      setStatus("Redirecting to payment...");

      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session"
      );

      if (error) {
        setStatus(error.message);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        setStatus("Payment session failed");
      }
    } catch (err) {
      setStatus(err.message);
    }
  };

  // 🔴 LOGIN SCREEN
  if (!user) {
    return (
      <div style={styles.center}>
        <h1>Reuben AI</h1>

        <input
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <button onClick={login} disabled={loading} style={styles.button}>
          {loading ? "Wait..." : "Send Magic Link"}
        </button>

        <p>{status}</p>
      </div>
    );
  }

  // 🟢 DASHBOARD
  return (
    <div style={styles.app}>
      <div style={styles.sidebar}>
        <h2>Reuben AI</h2>

        <button onClick={upgrade} style={styles.upgradeBtn}>
          Upgrade 🚀
        </button>
      </div>

      <div style={styles.main}>
        <h2>AI Generator</h2>

        <input
          placeholder="Enter skill"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          style={styles.input}
        />

        <button onClick={generate} style={styles.button}>
          Generate
        </button>

        <p>{status}</p>

        <pre style={styles.output}>{plan}</pre>

        <h3>History</h3>

        {history.length === 0 ? (
          <p>No history yet</p>
        ) : (
          history.map((item) => (
            <div key={item.id} style={styles.card}>
              <strong>{item.input}</strong>
              <pre>{item.output}</pre>
            </div>
          ))
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
    width: 200,
    background: "#111",
    color: "#fff",
    padding: 20,
  },
  main: {
    flex: 1,
    padding: 20,
    background: "#f5f5f5",
  },
  input: {
    padding: 10,
    width: 300,
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
    fontWeight: "bold",
  },
  output: {
    marginTop: 20,
    padding: 10,
    background: "#111",
    color: "#0f0",
    whiteSpace: "pre-wrap",
  },
  card: {
    background: "white",
    padding: 10,
    marginTop: 10,
  },
  center: {
    textAlign: "center",
    marginTop: 100,
  },
};