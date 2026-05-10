import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [leads, setLeads] = useState([]);

  const [skill, setSkill] = useState("");
  const [plan, setPlan] = useState("");

  const tools = [
    { name: "AI Writing Engine", desc: "Create blogs, ads, scripts, and emails." },
    { name: "AI Design Studio", desc: "Generate branding assets instantly." },
    { name: "AI Resume Optimizer", desc: "Build ATS-optimized resumes." }
  ];

  const fetchLeads = async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setLeads(data);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const submitEmail = async () => {
    if (!email) return alert("Enter email");

    const { error } = await supabase
      .from("leads")
      .insert([{ email }]);

    if (!error) {
      setSuccess("🎉 You're in!");
      setUnlocked(true);
      setEmail("");
      fetchLeads();
    } else {
      console.log(error);
    }
  };

  // 🔥 REAL AI CALL (via Supabase Edge Function)
  const generatePlan = async () => {
    if (!skill) return setPlan("Select a skill level first.");

    setPlan("Generating your AI plan...");

    const { data, error } = await supabase.functions.invoke("generate-plan", {
      body: { skill }
    });

    if (error) {
      console.log(error);
      setPlan("Failed to generate plan.");
    } else {
      setPlan(data.plan);
    }
  };

  return (
    <div>
      {/* HERO */}
      <div className="hero">
        <h1>Build Real Online Income Using AI</h1>
        <p>Learn how to earn online using AI tools and simple systems.</p>
      </div>

      <div className="container">

        {/* EMAIL */}
        <div className="section">
          <h2>Get Started Free</h2>

          <div className="card">
            <input
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button className="btn" onClick={submitEmail}>
              Join Free
            </button>

            {success && <p style={{ color: "green" }}>{success}</p>}
          </div>
        </div>

        {/* AI GENERATOR */}
        <div className="section">
          <h2>🧠 AI Income Plan Generator</h2>

          <div className="card">
            <select value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">Select skill level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <button className="btn" onClick={generatePlan}>
              Generate Plan
            </button>

            {plan && <p style={{ marginTop: "10px" }}>{plan}</p>}
          </div>
        </div>

        {/* DASHBOARD */}
        <div className="section">
          <h2>Leads</h2>

          <div className="card">
            {leads.map((l, i) => (
              <p key={i}>{l.email}</p>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}