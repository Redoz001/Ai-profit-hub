import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function App() {
  const [role, setRole] = useState('beginner');
  const [field, setField] = useState('general');
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([]);

  const getSystemPrompt = (userRole, userField) => {
    const fieldGuidance = {
      marketing: "Focus on ROI, CAC, brand positioning, and conversion funnels. Speak in terms of growth and audience.",
      engineering: "Focus on scalability, technical debt, MVP architecture, and product-market fit from a build perspective.",
      general: "Focus on standard business operations, legal basics, and general strategy."
    };

    const roleGuidance = {
      student: "Explain academic concepts and focus on career-starting moves.",
      beginner: "Keep it simple, avoid heavy jargon, and provide clear 'First Steps'.",
      freelancer: "Focus on personal branding, invoicing, and client management.",
      pro: "Focus on high-level optimization, delegation, and exit strategies."
    };

    return `You are an elite Business Consultant. 
    The user is a ${userRole} in the ${userField} field. 
    ${fieldGuidance[userField] || fieldGuidance.general} 
    ${roleGuidance[userRole]}. 
    Guide them step-by-step to the end of their goal.`;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to UI
    const userMsg = { role: 'user', content: input };
    setChat(prev => [...prev, userMsg]);
    
    // UI placeholder for AI response
    const aiMsg = { role: 'assistant', content: "Thinking..." };
    setChat(prev => [...prev, aiMsg]);

    // TODO: Connect your OpenAI/Claude API call here using getSystemPrompt(role, field)
    
    setInput('');
  };

  return (
    <div className="advisor-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>Global Business Mentor AI</h1>
        <p>Expert guidance for every stage of your journey.</p>
      </header>

      <div className="settings-bar" style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#f4f4f4', padding: '15px', borderRadius: '8px' }}>
        <div>
          <label>I am a: </label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="beginner">Beginner</option>
            <option value="freelancer">Freelancer</option>
            <option value="pro">Professional</option>
          </select>
        </div>
        
        <div>
          <label> My Field: </label>
          <select value={field} onChange={(e) => setField(e.target.value)}>
            <option value="general">General Business</option>
            <option value="marketing">Marketing</option>
            <option value="engineering">Engineering / Tech</option>
          </select>
        </div>
      </div>

      <div className="chat-box" style={{ border: '1px solid #ddd', borderRadius: '8px', height: '400px', overflowY: 'auto', padding: '20px', marginBottom: '20px', background: '#fff' }}>
        {chat.map((m, i) => (
          <div key={i} style={{ marginBottom: '15px', textAlign: m.role === 'user' ? 'right' : 'left' }}>
            <span style={{ 
              display: 'inline-block', 
              padding: '10px 15px', 
              borderRadius: '15px', 
              background: m.role === 'user' ? '#007bff' : '#eee', 
              color: m.role === 'user' ? '#fff' : '#333' 
            }}>
              {m.content}
            </span>
          </div>
        ))}
      </div>

      <div className="input-area" style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Describe your business goal..." 
          style={{ flex: 1, padding: '12px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button onClick={handleSendMessage} style={{ padding: '10px 25px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Get Advice
        </button>
      </div>
    </div>
  );
}