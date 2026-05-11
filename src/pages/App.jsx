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

  // 🚀 PREMIUM
  const [isPremium, setIsPremium] = useState(false);

  // 📊 ADMIN STATS
  const [stats, setStats] = useState({
    users: 0,
    generations: 0,
    upgrades: 0,
  });

  // 🔐 SESSION HANDLING
  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();

      const currentUser = data?.session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        await loadHistory(currentUser.id);
        await loadStats();
        await loadPremiumStatus(currentUser.id);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;

        setUser(currentUser);

        if (currentUser) {
          await loadHistory(currentUser.id);
          await loadStats();
          await loadPremiumStatus(currentUser.id);
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

  // 🚀 LOAD PREMIUM STATUS
  const loadPremiumStatus = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", userId)
      .single();

    setIsPremium(data?.is_premium || false);
  };

  // 📊 LOAD ADMIN STATS
  const loadStats = async () => {
    const { count: users } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: generations } = await supabase
      .from("analytics")
      .select("*", { count: "exact", head: true })
      .eq("event", "generate_plan");

    const { count: upgrades } = await supabase
      .from("analytics")
      .select("*", { count: "exact", head: true })
      .eq("event", "upgrade_clicked");

    setStats({
      users: users || 0,
      generations: generations || 0,
      upgrades: upgrades || 0,
    });
  };

  // 📊 EVENT LOGGER
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

    // 📊 Track login
    await supabase.from("analytics").insert({
      event: "magic_link_sent",
      metadata: { email },
    });

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

    // 🚀 FREE PLAN LIMIT
    if (!isPremium && history.length >= 3) {
      setStatus(
        "Free plan limit reached. Upgrade to Premium 🚀"
      );
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

    // 💾 SAVE OUTPUT
    await supabase.from("ai_outputs").insert({
      user_id: user.id,
      input: skill,
      output: result,
    });

    // 📊 TRACK EVENT
    await logEvent("generate_plan", {
      skill,
    });

    // 🔄 RELOAD
    await loadHistory(user.id);
    await loadStats();

    setStatus("Done ✅");
  };

  // 💳 UPGRADE
  const upgrade = async () => {
    try {
      setStatus("Redirecting to payment...");

      await logEvent("upgrade_clicked");

      await loadStats();

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
    setIsPremium(false);
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

        <div style={styles.badge}>
          {isPremium ? "Premium User 🚀" : "Free Plan"}
        </div>

        <p style={{ fontSize: 12 }}>
          {user.email}
        </p>

        {!isPremium && (
          <button
            onClick={upgrade}
            style={styles.upgradeBtn}
          >
            Upgrade 🚀
          </button>
        )}

        <button
          onClick={logout}
          style={styles.logoutBtn}
        >
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        {/* 📊 ADMIN DASHBOARD */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3>Total Users</h3>
            <p>{stats.users}</p>
          </div>

          <div style={styles.statCard}>
            <h3>AI Generations</h3>
            <p>{stats.generations}</p>
          </div>

          <div style={styles.statCard}>
            <h3>Upgrade Clicks</h3>
            <p>{stats.upgrades}</p>
          </div>
        </div>

        {/* 🤖 AI GENERATOR */}
        <h2>AI Generator</h2>

        {!isPremium && (
          <p style={{ color: "red" }}>
            Free Plan: 3 generations maximum
          </p>
        )}

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

  badge: {
    background: "#222",
    color: "white",
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
    marginBottom: 10,
  },

  statsGrid: {
    display: "flex",
    gap: 20,
    marginBottom: 30,
    flexWrap: "wrap",
  },

  statCard: {
    background: "white",
    padding: 20,
    borderRadius: 10,
    minWidth: 180,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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