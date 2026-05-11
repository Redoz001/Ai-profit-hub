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

      // load history
      if (data?.session?.user) {
        loadHistory(data.session.user.id);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;

        setUser(currentUser);

        if (currentUser) {
          await loadHistory(currentUser.id);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 📜 LOAD HISTORY
  const loadHistory = async (userId) => {
    const { data } = await supabase
      .from("ai_outputs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setHistory(data || []);
  };

  // 📊 ANALYTICS LOGGER
  const logEvent = async (event, metadata = {}) => {
    if (!user) return;

    await supabase.from("analytics").insert({
      user_id: user.id,
      event,
      metadata,
    });
  };

  // 📩 LOGIN
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

    setStatus("Check your email 📩");

    // 📊 track login attempt
    await supabase.from("analytics").insert({
      event: "magic_link_sent",
      metadata: { email },
    });

    // ⏱ anti-spam cooldown
    setTimeout(() => {
      setLoading(false);
    }, 60000);
  };

  // 🤖 GENERATE AI
  const generate = async () => {
    if (!user) {
      setStatus("Login required");
      return;
    }

    if (!skill) {
      setStatus("Enter a skill");
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

    const result = data?.plan?.join("\n") || "No output";

    setPlan(result);

    // 💾 SAVE HISTORY
    await supabase.from("ai_outputs").insert({
      user_id: user.id,
      input: skill,
      output: result,
    });

    // 📊 TRACK GENERATION
    await logEvent("generate_plan", {
      skill,
    });

    // 🔄 reload history
    await loadHistory(user.id);

    setStatus("Done ✅");
  };

  // 💳 UPGRADE
  const upgrade = async () => {
    try {
      setStatus("Redirecting to payment...");

      // 📊 track upgrade click
      await logEvent("upgrade_clicked");

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

  // 🚪 LOGOUT
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHistory([]);
    setPlan("");
  };

  // 🔴 LOGIN SCREEN
  if (!user) {
    return (
      <div style={styles.center}>
        <h1>Reuben AI</h1>

        <p style={{ marginBottom: 20 }}>
          Generate AI-powered learning roadmaps
        </p>

        <input
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <button
          onClick={login}
          disabled={loading}
          style={styles.button}
        >
          {loading ? "Wait..." : "Send Magic Link"}
        </button>

        <p>{status}</p>
      </div>
    );
  }

  // 🟢 DASHBOARD
  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2>Reuben AI</h2>

        <p style={{ fontSize: 12 }}>
          {user.email}
        </p>

        <button
          onClick={upgrade}
          style={styles.upgradeBtn}
        >
          Upgrade 🚀
        </button>

        <button
          onClick={logout}
          style={styles.logoutBtn}
        >
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        <h2>AI Generator</h2>

        <input
          placeholder="Enter a skill"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          style={styles.input}
        />

        <button
          onClick={generate}
          style={styles.button}
        >
          Generate
        </button>

        <p>{status}</p>

        {/* OUTPUT */}
        <pre style={styles.output}>
          {plan}
        </pre>

        {/* HISTORY */}
        <h3>History</h3>

        {history.length === 0 ? (
          <p>No history yet</p>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              style={styles.card}
            >
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
    width: 220,
    background: "#111",
    color: "white",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  main: {
    flex: 1,
    padding: 20,
    background: "#f5f5f5",
    overflowY: "auto",
  },

  input: {
    padding: 10,
    width: 320,
    marginBottom: 10,
    display: "block",
  },

  button: {
    padding: 10,
    background: "black",
    color: "white",
    border: "none",
    cursor: "pointer",
  },

  upgradeBtn: {
    padding: 10,
    background: "gold",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },

  logoutBtn: {
    padding: 10,
    background: "#333",
    color: "white",
    border: "none",
    cursor: "pointer",
  },

  output: {
    marginTop: 20,
    padding: 15,
    background: "#111",
    color: "#0f0",
    whiteSpace: "pre-wrap",
    borderRadius: 8,
  },

  card: {
    background: "white",
    padding: 15,
    marginTop: 10,
    borderRadius: 8,
  },

  center: {
    textAlign: "center",
    marginTop: 100,
    fontFamily: "Arial",
  },
};