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

  const [isPremium, setIsPremium] = useState(false);

  const [isNewUser, setIsNewUser] = useState(false);

  const [stats, setStats] = useState({
    users: 0,
    generations: 0,
    upgrades: 0,
  });

  // 🔐 SESSION
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data?.session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        await loadHistory(currentUser.id);
        await loadStats();
        await loadPremium(currentUser.id);
        await checkNewUser(currentUser.id);
        await trackDailyActive(currentUser.id);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;

        setUser(currentUser);

        if (currentUser) {
          await loadHistory(currentUser.id);
          await loadStats();
          await loadPremium(currentUser.id);
          await checkNewUser(currentUser.id);
          await trackDailyActive(currentUser.id);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 📜 HISTORY
  const loadHistory = async (userId) => {
    const { data } = await supabase
      .from("ai_outputs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setHistory(data || []);
  };

  // 💎 PREMIUM
  const loadPremium = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", userId)
      .single();

    setIsPremium(data?.is_premium || false);
  };

  // 📊 STATS
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

  // 📊 LOG EVENT
  const logEvent = async (event, metadata = {}) => {
    if (!user) return;

    await supabase.from("analytics").insert({
      user_id: user.id,
      event,
      metadata,
    });
  };

  // 👋 NEW USER DETECTION
  const checkNewUser = async (userId) => {
    const { data } = await supabase
      .from("analytics")
      .select("*")
      .eq("user_id", userId)
      .eq("event", "first_login");

    if (!data || data.length === 0) {
      setIsNewUser(true);

      await supabase.from("analytics").insert({
        user_id: userId,
        event: "first_login",
      });
    }
  };

  // 🔁 DAILY ACTIVE TRACKING
  const trackDailyActive = async (userId) => {
    const today = new Date().toDateString();

    const { data } = await supabase
      .from("analytics")
      .select("*")
      .eq("user_id", userId)
      .eq("event", "active_day")
      .eq("metadata->date", today);

    if (!data || data.length === 0) {
      await supabase.from("analytics").insert({
        user_id: userId,
        event: "active_day",
        metadata: { date: today },
      });
    }
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

    await supabase.from("analytics").insert({
      event: "magic_link_sent",
      metadata: { email },
    });

    setTimeout(() => setLoading(false), 60000);
  };

  // 🤖 GENERATE
  const generate = async () => {
    if (!user) return setStatus("Login required");
    if (!skill) return setStatus("Enter a skill");

    if (!isPremium && history.length >= 3) {
      setStatus("Free limit reached. Upgrade 🚀");
      return;
    }

    setStatus("Generating...");

    const { data, error } = await supabase.functions.invoke("Reuben", {
      body: { skill },
    });

    if (error) return setStatus(error.message);

    const result = data?.plan?.join("\n") || "No output";

    setPlan(result);

    await supabase.from("ai_outputs").insert({
      user_id: user.id,
      input: skill,
      output: result,
    });

    await logEvent("generate_plan", { skill });

    // 🚀 STEP 14: USER ACTIVATION EVENT
    await supabase.from("analytics").insert({
      user_id: user.id,
      event: "user_activated",
      metadata: { skill },
    });

    await loadHistory(user.id);
    await loadStats();

    setStatus("Done ✅");
  };

  // 💳 UPGRADE
  const upgrade = async () => {
    setStatus("Redirecting...");

    await logEvent("upgrade_clicked");

    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: { user: userData.user },
      }
    );

    if (error) return setStatus(error.message);

    if (data?.url) window.location.href = data.url;
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

  // 👋 ONBOARDING
  if (isNewUser) {
    return (
      <div style={styles.center}>
        <h1>Welcome 🚀</h1>
        <p>Your AI system is ready.</p>

        <button
          onClick={() => setIsNewUser(false)}
          style={styles.button}
        >
          Get Started
        </button>
      </div>
    );
  }

  // 🟢 DASHBOARD
  return (
    <div style={styles.app}>
      <div style={styles.sidebar}>
        <h2>Reuben AI</h2>

        <div style={styles.badge}>
          {isPremium ? "Premium 🚀" : "Free Plan"}
        </div>

        <p style={styles.email}>{user.email}</p>

        {!isPremium && (
          <button onClick={upgrade} style={styles.upgradeBtn}>
            Upgrade
          </button>
        )}

        <button onClick={logout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <div style={styles.main}>
        <div style={styles.card}>
          <h2>AI Generator</h2>

          {!isPremium && (
            <p style={styles.warning}>
              Free plan: max 3 generations
            </p>
          )}

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
        </div>

        <div style={styles.card}>
          <h3>History</h3>

          {history.map((h) => (
            <div key={h.id} style={styles.historyItem}>
              <strong>{h.input}</strong>
              <p>{h.output}</p>
            </div>
          ))}
        </div>
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
    background: "#0f0f10",
    color: "#fff",
  },
  sidebar: {
    width: 240,
    background: "#151517",
    padding: 20,
  },
  main: {
    flex: 1,
    padding: 20,
    overflowY: "auto",
  },
  card: {
    background: "#1a1a1d",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "none",
    marginBottom: 10,
  },
  button: {
    padding: 12,
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: 8,
  },
  upgradeBtn: {
    padding: 12,
    background: "#facc15",
    border: "none",
    borderRadius: 8,
  },
  logoutBtn: {
    padding: 12,
    background: "#333",
    border: "none",
    borderRadius: 8,
    color: "white",
  },
  badge: {
    background: "#222",
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
    marginBottom: 10,
  },
  email: {
    fontSize: 12,
    opacity: 0.7,
  },
  output: {
    background: "#000",
    padding: 15,
    borderRadius: 8,
    whiteSpace: "pre-wrap",
  },
  historyItem: {
    background: "#111",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  warning: {
    color: "#f87171",
  },
  center: {
    textAlign: "center",
    marginTop: 100,
  },
};