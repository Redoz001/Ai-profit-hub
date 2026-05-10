import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [skill, setSkill] = useState("");
  const [result, setResult] = useState("Your results will appear here...");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // AUTH CHECK
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // LOGIN
  const login = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for login link");
    }
  };

  // LOGOUT
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHistory([]);
  };

  // LOAD HISTORY
  const loadHistory = async (uid) => {
    const { data } = await supabase
      .from("plans")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    setHistory(data || []);
  };

  // LOAD WHEN USER LOGS IN
  useEffect(() => {
    if (user?.id) {
      loadHistory(user.id);
    }
  }, [user]);

  // GENERATE PLAN (WITH PAYWALL)
  const generatePlan = async () => {
    try {
      setLoading(true);
      setResult("Generating...");

      // FREE LIMIT (3 USES)
      if (!user?.is_premium) {
        const { count } = await supabase
          .from("plans")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (count >= 3) {
          setResult("🚀 Upgrade to Premium to continue using Reuben AI");
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke("Reuben", {
        body: { skill },
      });

      if (error) {
        setResult("Error: " + error.message);
        return;
      }

      const planText = data?.plan || JSON.stringify(data, null, 2);
      setResult(planText);

      await supabase.from("plans").insert([
        {
          skill,
          plan: planText,
          user_id: user.id,
        },
      ]);

      loadHistory(user.id);
    } catch (err) {
      setResult("Crash: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // NOT LOGGED IN UI
  if (!user) {
    return (
      <div style={{ padding: 20, fontFamily: "Arial" }}>
        <h1>Reuben AI 🔐</h1>

        <p>Login to continue</p>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          style={{ padding: 10, width: "100%" }}
        />

        <button onClick={login} style={{ marginTop: 10, padding: 10 }}>
          Send Login Link
        </button>
      </div>
    );
  }

  // MAIN APP
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial",
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 700, margin: "auto" }}>
        <h1>Reuben AI 🚀</h1>

        <p>Logged in as: {user.email}</p>

        <button onClick={logout} style={{ marginBottom: 10 }}>
          Logout
        </button>

        {!user.is_premium && (
          <div
            style={{
              background: "#facc15",
              color: "black",
              padding: 10,
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            Free plan: limited to 3 generations
          </div>
        )}

        <input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="beginner / freelancer / student"
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
          }}
        />

        <button
          onClick={generatePlan}
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            background: loading ? "#555" : "#22c55e",
            color: "white",
            border: "none",
          }}
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>

        <pre
          style={{
            background: "#000",
            padding: 10,
            marginTop: 10,
            whiteSpace: "pre-wrap",
          }}
        >
          {result}
        </pre>

        <h2>History</h2>

        {history.length === 0 && <p>No history yet.</p>}

        {history.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#1f2937",
              padding: 10,
              marginBottom: 10,
              borderRadius: 8,
            }}
          >
            <b>{item.skill}</b>
            <p style={{ whiteSpace: "pre-wrap" }}>{item.plan}</p>
          </div>
        ))}
      </div>
    </div>
  );
}