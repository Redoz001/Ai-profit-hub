import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [skill, setSkill] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // CHECK AUTH
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  // LOGIN
  const login = async () => {
    await supabase.auth.signInWithOtp({
      email,
    });

    alert("Check your email for login link");
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

  // WHEN USER CHANGES
  useEffect(() => {
    if (user) {
      loadHistory(user.id);
    }
  }, [user]);

  // GENERATE PLAN
  const generatePlan = async () => {
    try {
      setLoading(true);

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
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

        <p>Welcome: {user.email}</p>

        <button onClick={logout}>Logout</button>

        <hr />

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
          }}
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>

        <pre style={{ background: "#000", padding: 10, marginTop: 10 }}>
          {result}
        </pre>

        <h2>History</h2>

        {history.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#1f2937",
              padding: 10,
              marginBottom: 10,
            }}
          >
            <b>{item.skill}</b>
            <p>{item.plan}</p>
          </div>
        ))}
      </div>
    </div>
  );
}