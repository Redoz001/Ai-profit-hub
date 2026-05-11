import { useEffect, useState } from "react";
import { supabase } from '../lib/supabase;

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");

  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [history, setHistory] = useState([]);

  const [isPremium, setIsPremium] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const [usage, setUsage] = useState(0);
  const FREE_LIMIT = 3;

  const [lastGen, setLastGen] = useState(0);

  // ⚡ STEP 19 — CACHE SYSTEM
  const [cache, setCache] = useState({});

  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState(0);

  // 🔑 CACHE KEY
  const getCacheKey = (input) => input.trim().toLowerCase();

  // 🛡 SAFE REQUEST
  const safeRequest = async (fn, fallback = null) => {
    try {
      return await fn();
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong.");
      return fallback;
    }
  };

  // 🔐 SESSION
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data?.session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        await loadHistory(currentUser.id);
        await loadPremium(currentUser.id);
        await checkNewUser(currentUser.id);
        await loadUsage(currentUser.id);
        await loadReferrals(currentUser.id);

        const code =
          currentUser.id.slice(0, 6) +
          Math.random().toString(36).substring(2, 6);

        setReferralCode(code);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;

        setUser(currentUser);

        if (currentUser) {
          await loadHistory(currentUser.id);
          await loadPremium(currentUser.id);
          await checkNewUser(currentUser.id);
          await loadUsage(currentUser.id);
          await loadReferrals(currentUser.id);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 📜 HISTORY (OPTIMIZED)
  const loadHistory = async (userId) => {
    const { data } = await safeRequest(() =>
      supabase
        .from("ai_outputs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
    , []);

    setHistory(data || []);
  };

  // 💎 PREMIUM
  const loadPremium = async (userId) => {
    const { data } = await safeRequest(() =>
      supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", userId)
        .single()
    );

    setIsPremium(data?.is_premium || false);
  };

  // 👋 NEW USER
  const checkNewUser = async (userId) => {
    const { data } = await safeRequest(() =>
      supabase
        .from("analytics")
        .select("*")
        .eq("user_id", userId)
        .eq("event", "first_login")
    , []);

    if (!data || data.length === 0) {
      setIsNewUser(true);

      await supabase.from("analytics").insert({
        user_id: userId,
        event: "first_login",
      });
    }
  };

  // 📊 USAGE
  const loadUsage = async (userId) => {
    const { data } = await safeRequest(() =>
      supabase
        .from("analytics")
        .select("*")
        .eq("user_id", userId)
        .eq("event", "generate_plan")
    , []);

    setUsage(data?.length || 0);
  };

  // 👥 REFERRALS
  const loadReferrals = async (userId) => {
    const { data } = await safeRequest(() =>
      supabase
        .from("analytics")
        .select("*")
        .eq("user_id", userId)
        .eq("event", "referral_signup")
    , []);

    setReferrals(data?.length || 0);
  };

  // 📊 LOG EVENT
  const logEvent = async (event, metadata = {}) => {
    if (!user) return;

    await safeRequest(() =>
      supabase.from("analytics").insert({
        user_id: user.id,
        event,
        metadata,
      })
    );
  };

  // ⚡ COOLDOWN
  const checkCooldown = () => {
    const now = Date.now();

    if (now - lastGen < 5000) {
      setStatus("Slow down ⏳");
      return false;
    }

    setLastGen(now);
    return true;
  };

  // 📩 LOGIN
  const login = async () => {
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

    setStatus("Check email 📩");
    setTimeout(() => setLoading(false), 60000);
  };

  // 🤖 GENERATE (STEP 19 OPTIMIZED)
  const generate = async () => {
    if (!user) return setStatus("Login required");
    if (!skill) return setStatus("Enter a skill");

    if (isGenerating) return;
    if (!checkCooldown()) return;

    const key = getCacheKey(skill);

    // ⚡ CACHE HIT (FREE + INSTANT)
    if (cache[key]) {
      setPlan(cache[key]);
      setStatus("Loaded from cache ⚡");
      return;
    }

    if (!isPremium && usage >= FREE_LIMIT) {
      setStatus("Free limit reached 🚀 Upgrade required");
      return;
    }

    setIsGenerating(true);
    setStatus("Generating...");

    const { data, error } = await safeRequest(() =>
      supabase.functions.invoke("Reuben", {
        body: { skill },
      })
    );

    if (error || !data) {
      setStatus("AI failed. Try again.");
      setIsGenerating(false);
      return;
    }

    const result = data?.plan?.join("\n") || "No output";

    setPlan(result);

    // 💾 CACHE STORE
    setCache((prev) => ({
      ...prev,
      [key]: result,
    }));

    // ⚡ WRITE DB (MINIMAL USAGE)
    await safeRequest(() =>
      supabase.from("ai_outputs").insert({
        user_id: user.id,
        input: skill,
        output: result,
      })
    );

    await logEvent("generate_plan", { skill });

    setUsage((prev) => prev + 1);

    // ⚡ LOCAL HISTORY UPDATE (NO EXTRA DB CALL)
    setHistory((prev) => [
      {
        id: Date.now(),
        input: skill,
        output: result,
      },
      ...prev,
    ]);

    setIsGenerating(false);
    setStatus("Done ✅");
  };

  // 💳 UPGRADE
  const upgrade = async () => {
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
    setCache({});
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
          {loading ? "Sending..." : "Send Magic Link"}
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

        <button onClick={() => setIsNewUser(false)} style={styles.button}>
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

        <div style={styles.card}>
          <p>Referral Code:</p>
          <strong>{referralCode}</strong>

          <p>Referrals: {referrals}</p>
        </div>

        <p>Usage: {usage}/{FREE_LIMIT}</p>

        <button onClick={upgrade} style={styles.button}>
          Upgrade
        </button>

        <button onClick={logout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <div style={styles.main}>
        <div style={styles.card}>
          <h2>AI Generator</h2>

          <input
            placeholder="Enter skill"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            style={styles.input}
          />

          <button
            onClick={generate}
            disabled={isGenerating}
            style={styles.button}
          >
            {isGenerating ? "Generating..." : "Generate"}
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
  logoutBtn: {
    padding: 12,
    background: "#333",
    border: "none",
    borderRadius: 8,
    color: "white",
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
  center: {
    textAlign: "center",
    marginTop: 100,
  },
};