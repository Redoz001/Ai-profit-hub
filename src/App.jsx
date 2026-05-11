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

  // 🔐 LOAD USER + PROFILE + USAGE
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

  // 🤖 GENERATE (WITH LIMIT + PREMIUM CHECK)
  const generate = async () => {
    try {
      setStatus("Checking access...");

      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        setStatus("Not logged in");
        return;
      }

      // 🔒 PREMIUM CHECK
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", userData.user.id)
        .single();

      if (!profile?.is_premium && usage >= 10) {
        setStatus("Free limit reached 🔒 Upgrade required");
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

      // 💾 SAVE OUTPUT
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

      setStatus("Generated successfully ✅");
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
          placeholder="Enter email"
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
        placeholder="skill (beginner, student, freelancer)"
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        style={{ padding: 10, width: 300 }}
      />

      <br /><br />

      <button onClick={generate}>Generate Plan</button>
      <button onClick={upgrade} style={{ marginLeft: 10 }}>
        Upgrade
      </button>

      <p>{status}</p>

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
    </div>
  );
}