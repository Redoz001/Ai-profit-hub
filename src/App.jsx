import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");

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
      setSuccess("🎉 Welcome! You're on the list.");
      setEmail("");
    }
  };

  return (
    <div>
      <div className="hero">
        <h1>AI Profit Hub</h1>
        <p>
          AI tools + freelancing + affiliate income + digital business systems.
        </p>

        <button className="btn">Start Now</button>
      </div>

      <div className="container">
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

        <div className="section">
          <h2>🚀 Freelance Services</h2>

          <div className="card" style={{ marginTop: "20px" }}>
            <p>• Website Setup</p>
            <p>• AI Automation</p>
            <p>• Resume Creation</p>
            <p>• Cybersecurity Beginner Help</p>
          </div>
        </div>

        <div className="section">
          <h2>📧 Join The Newsletter</h2>

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
      </div>

      <div className="footer">
        AI Profit Hub © 2026
      </div>
    </div>
  );
}