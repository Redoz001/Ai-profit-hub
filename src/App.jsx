import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const tools = [
    {
      name: "AI Writing Engine",
      desc: "Create blogs, ads, scripts, and emails.",
    },
    {
      name: "AI Design Studio",
      desc: "Generate branding assets instantly.",
    },
    {
      name: "AI Resume Optimizer",
      desc: "Build ATS-optimized resumes.",
    },
  ];

  const submitEmail = async () => {
    console.log("button clicked");

    if (!email) {
      alert("Please enter an email");
      return;
    }

    const { error } = await supabase
      .from("leads")
      .insert([{ email }]);

    if (error) {
      console.log(error);
      alert("Error saving email");
    } else {
      setSuccess("🎉 You're in! Unlocking your free resources...");
      setUnlocked(true);
      setEmail("");
    }
  };

  return (
    <div>
      {/* HERO */}
      <div className="hero">
        <h1>Build Income with AI — Fast & Simple</h1>

        <p>
          Get access to AI tools, freelancing systems, and digital business ideas that help you start earning online.
        </p>

        <button className="btn">Join Free & Start</button>
      </div>

      {/* MAIN CONTENT */}
      <div className="container">

        {/* TOOLS */}
        <div className="section">
          <h2>🔥 AI Income Tools</h2>

          <div className="grid grid-3" style={{ marginTop: "20px" }}>
            {tools.map((tool, i) => (
              <div className="card" key={i}>
                <h3>{tool.name}</h3>
                <p>{tool.desc}</p>

                <button className="btn">Access Tool</button>
              </div>
            ))}
          </div>
        </div>

        {/* SERVICES */}
        <div className="section">
          <h2>🚀 Freelance Services</h2>

          <div className="card" style={{ marginTop: "20px" }}>
            <p>• Website Setup</p>
            <p>• AI Automation</p>
            <p>• Resume Creation</p>
            <p>• Cybersecurity Beginner Help</p>
          </div>
        </div>

        {/* EMAIL SECTION */}
        <div className="section">
          <h2>📧 Get Free AI Income Updates</h2>

          <div className="card" style={{ marginTop: "20px" }}>
            <input
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button className="btn" onClick={submitEmail}>
              Join Free
            </button>

            {success && (
              <p style={{ color: "green", marginTop: "10px" }}>
                {success}
              </p>
            )}
          </div>
        </div>

        {/* REWARD SECTION (NEW) */}
        {unlocked && (
          <div className="section">
            <h2>🎁 Your Free AI Starter Pack</h2>

            <div className="card" style={{ marginTop: "20px" }}>
              <p>✔ 5 AI tools to start earning online</p>
              <p>✔ Beginner freelancing roadmap</p>
              <p>✔ Simple business ideas using AI</p>
              <p>✔ Step-by-step getting started guide</p>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="footer">
        AI Profit Hub © 2026
      </div>
    </div>
  );
}