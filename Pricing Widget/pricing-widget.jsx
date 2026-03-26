import { useState, useEffect } from "react";

const UTILITIES = ["BGE", "Pepco", "Delmarva Power", "SMECO", "Other"];

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 2, marginRight: 8 }}>
    <circle cx="9" cy="9" r="9" fill="#E8F5E9" />
    <path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DiamondIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 2, marginRight: 8 }}>
    <circle cx="9" cy="9" r="9" fill="#EDE9FE" />
    <path d="M9 4.5l3.2 3.2L9 13.5 5.8 7.7z" fill="#7C3AED" opacity="0.7" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ display: "block", flexShrink: 0 }}>
    <path d="M8 0l2.47 4.94L16 5.77l-4 3.83L12.94 16 8 13.27 3.06 16 4 9.6 0 5.77l5.53-.83z" />
  </svg>
);

const ArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9h10M10 5l4 4-4 4" />
  </svg>
);

const ArrowDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1B6B3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v10M4 9l4 4 4-4" />
  </svg>
);

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ verticalAlign: "middle", marginRight: 4, flexShrink: 0 }}>
    <circle cx="7" cy="7" r="6.5" stroke="#94a3b8" />
    <path d="M7 6v4M7 4.5v.01" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const STEPS = [
  { label: "Building Info", num: 1 },
  { label: "Contact Details", num: 2 },
  { label: "Choose Plan", num: 3 },
  { label: "Checkout", num: 4 },
];

function RebateFlowVisual({ units }) {
  const amt = (160 * units).toLocaleString();
  return (
    <div style={{
      background: "linear-gradient(135deg, #f0faf3 0%, #e6f4ea 100%)",
      borderRadius: 12, padding: "16px 18px", marginBottom: 18,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#64748b", marginBottom: 12 }}>
        Here's how it works
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#374151" }}>You pay today</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1a2b3c" }}>${amt}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}><ArrowDown /></div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#374151" }}>Your utility rebate</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1B6B3A" }}>−${amt}</span>
        </div>
        <div style={{ borderTop: "2px solid #1B6B3A", marginTop: 6, paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2b3c" }}>Your net cost</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#1B6B3A" }}>$0</span>
        </div>
      </div>
    </div>
  );
}

export default function PricingWidget() {
  const [step, setStep] = useState(1);
  const [units, setUnits] = useState(3);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", utility: "" });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [errors, setErrors] = useState({});
  const [animate, setAnimate] = useState(false);

  useEffect(() => { setAnimate(true); const t = setTimeout(() => setAnimate(false), 400); return () => clearTimeout(t); }, [step]);

  const goNext = () => {
    if (step === 2) {
      const errs = {};
      if (!form.name.trim()) errs.name = "Required";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Valid email required";
      if (!form.phone.trim()) errs.phone = "Required";
      if (!form.address.trim()) errs.address = "Required";
      if (!form.utility) errs.utility = "Please select your utility";
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
    }
    setStep(s => Math.min(s + 1, 4));
  };
  const goBack = () => setStep(s => Math.max(s - 1, 1));

  const tier1Total = units * 160;
  const tier2Total = units * 54;
  const tier3Base = units <= 5 ? 2400 : 2400 + (units - 5) * 160;

  const getPlanData = (id) => ({
    "zero-cost": { name: "Zero-Cost Tune-Up", total: tier1Total, perUnit: 160 },
    "standard": { name: "Standard Tune-Up", total: tier2Total, perUnit: 54 },
    "premium": { name: "Total Building Energy Plan", total: tier3Base, perUnit: null },
  }[id]);

  const selectedPlanData = selectedPlan ? getPlanData(selectedPlan) : null;

  // Tier 3 value stack
  const tier3ValueStack = [
    { item: `4 quarterly HVAC tune-ups (${units} units)`, value: units * 214 * 4, category: "core" },
    { item: "Programmable thermostat install + optimization", value: units * 229, category: "equipment" },
    { item: "BAS review & controls optimization (engineer-led)", value: 1500, category: "equipment" },
    { item: "Walk-in refrigeration sensor & controls assessment", value: 800, category: "equipment" },
    { item: "Comprehensive lighting efficiency walkthrough", value: 500, category: "addon" },
    { item: "Energy supply rate analysis & procurement review", value: 400, category: "addon" },
    { item: "Community solar feasibility assessment", value: 400, category: "addon" },
    { item: "BEPS benchmarking compliance setup & filing", value: 1200, category: "addon" },
    { item: "Annual energy performance report", value: 600, category: "addon" },
    { item: "Dedicated utility advisor (year-round)", value: 1200, category: "addon" },
  ];
  const tier3TotalValue = tier3ValueStack.reduce((a, b) => a + b.value, 0);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", maxWidth: 1160, margin: "0 auto", padding: "0 16px", color: "#1a2b3c" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .mse-fade{animation:mseFade .35s ease-out both}
        @keyframes mseFade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes mseGlow{0%,100%{box-shadow:0 8px 32px rgba(27,107,58,.12)}50%{box-shadow:0 8px 44px rgba(27,107,58,.22)}}
        .mse-card{background:#fff;border:2px solid #e2e8f0;border-radius:16px;padding:28px 24px;transition:border-color .2s,box-shadow .2s,transform .15s;cursor:pointer;position:relative;display:flex;flex-direction:column}
        .mse-card:hover{border-color:#94b8d4;box-shadow:0 4px 20px rgba(30,80,130,.08);transform:translateY(-2px)}
        .mse-hero{border:3px solid #1B6B3A;animation:mseGlow 3s ease-in-out infinite;transform:scale(1.02);z-index:2}
        .mse-hero:hover{transform:scale(1.03) translateY(-2px)}
        .mse-badge{position:absolute;top:-14px;left:50%;transform:translateX(-50%);padding:5px 18px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
        .mse-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;border:none;cursor:pointer;transition:all .2s;font-family:inherit}
        .mse-pri{background:#1B6B3A;color:#fff}.mse-pri:hover{background:#145a2f}
        .mse-sec{background:#f1f5f9;color:#475569}.mse-sec:hover{background:#e2e8f0}
        .mse-out{background:transparent;color:#1B6B3A;border:2px solid #1B6B3A}.mse-out:hover{background:#f0faf3}
        .mse-out-purple{background:transparent;color:#5B21B6;border:2px solid #7C3AED}.mse-out-purple:hover{background:#f5f3ff}
        .mse-input{width:100%;padding:12px 16px;border:2px solid #e2e8f0;border-radius:10px;font-size:15px;font-family:inherit;color:#1a2b3c;transition:border-color .2s;outline:none;box-sizing:border-box}
        .mse-input:focus{border-color:#1B6B3A}
        .mse-err{border-color:#dc2626}
        .mse-sel{appearance:none;background:#fff url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748B' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 16px center;padding-right:40px}
        .mse-step{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:10px;border:2px solid #e2e8f0;background:#fff;font-size:20px;cursor:pointer;font-family:inherit;color:#1a2b3c;font-weight:600;transition:all .15s;user-select:none}
        .mse-step:hover{background:#f0faf3;border-color:#1B6B3A}
        .mse-disclaimer{display:flex;align-items:flex-start;gap:2px;font-size:11px;color:#94a3b8;line-height:1.5;margin-top:4px}
        @media(max-width:860px){.mse-grid{flex-direction:column!important}.mse-hero{transform:scale(1)!important}.mse-hero:hover{transform:translateY(-2px)!important}}
      `}</style>

      {/* PROGRESS BAR */}
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 40, flexWrap: "wrap" }}>
        {STEPS.map((s, i) => (
          <div key={s.num} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8,
              background: step >= s.num ? "#f0faf3" : "#f8fafc",
              border: step === s.num ? "2px solid #1B6B3A" : "2px solid transparent",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, background: step >= s.num ? "#1B6B3A" : "#cbd5e1", color: "#fff",
              }}>{step > s.num ? "✓" : s.num}</div>
              <span style={{ fontSize: 13, fontWeight: step === s.num ? 600 : 400, color: step >= s.num ? "#1a2b3c" : "#94a3b8" }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ width: 24, height: 2, background: step > s.num ? "#1B6B3A" : "#e2e8f0", borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      <div className={animate ? "mse-fade" : ""}>

        {/* ——— STEP 1 ——— */}
        {step === 1 && (
          <div style={{ maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Let's Get Started</h2>
            <p style={{ color: "#64748b", fontSize: 16, marginBottom: 40, lineHeight: 1.6 }}>Tell us about your building so we can customize your plan and pricing.</p>
            <div style={{ background: "#f8faf9", borderRadius: 16, padding: "40px 32px", border: "1px solid #e8efe8" }}>
              <label style={{ display: "block", fontSize: 16, fontWeight: 600, marginBottom: 20 }}>How many HVAC units does your building have?</label>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20 }}>
                <button className="mse-step" onClick={() => setUnits(u => Math.max(1, u - 1))}>−</button>
                <span style={{ width: 72, textAlign: "center", fontSize: 28, fontWeight: 700, color: "#1B6B3A" }}>{units}</span>
                <button className="mse-step" onClick={() => setUnits(u => Math.min(50, u + 1))}>+</button>
              </div>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>Standard pricing covers 3-ton to 20-ton units.<br />For units outside this range, we'll customize a quote.</p>
            </div>
            <button className="mse-btn mse-pri" onClick={goNext} style={{ marginTop: 32, width: "100%", maxWidth: 320 }}>See My Pricing <ArrowRight /></button>
          </div>
        )}

        {/* ——— STEP 2 ——— */}
        {step === 2 && (
          <div style={{ maxWidth: 540, margin: "0 auto" }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Where should we send your plan details?</h2>
            <p style={{ color: "#64748b", fontSize: 16, marginBottom: 32, textAlign: "center", lineHeight: 1.6 }}>We'll customize your pricing for {units} unit{units !== 1 ? "s" : ""} and send you a summary.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "name", label: "Full Name", type: "text", ph: "John Smith" },
                { key: "email", label: "Email Address", type: "email", ph: "john@company.com" },
                { key: "phone", label: "Phone Number", type: "tel", ph: "(301) 555-0123" },
                { key: "address", label: "Building Address", type: "text", ph: "123 Main St, Baltimore, MD 21201" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{f.label}</label>
                  <input className={`mse-input ${errors[f.key] ? "mse-err" : ""}`} type={f.type} placeholder={f.ph} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                  {errors[f.key] && <span style={{ fontSize: 12, color: "#dc2626", marginTop: 4, display: "block" }}>{errors[f.key]}</span>}
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Utility Provider</label>
                <select className={`mse-input mse-sel ${errors.utility ? "mse-err" : ""}`} value={form.utility} onChange={e => setForm({ ...form, utility: e.target.value })}>
                  <option value="">Select your utility...</option>
                  {UTILITIES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                {errors.utility && <span style={{ fontSize: 12, color: "#dc2626", marginTop: 4, display: "block" }}>{errors.utility}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <button className="mse-btn mse-sec" onClick={goBack}>Back</button>
              <button className="mse-btn mse-pri" onClick={goNext} style={{ flex: 1 }}>Show My Options <ArrowRight /></button>
            </div>
          </div>
        )}

        {/* ——— STEP 3 — PLAN SELECTION ——— */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Choose Your Plan</h2>
            <p style={{ color: "#64748b", fontSize: 16, marginBottom: 36, textAlign: "center", lineHeight: 1.6 }}>
              Pricing for {units} HVAC unit{units !== 1 ? "s" : ""}. All plans include full EmPOWER rebate filing.
            </p>

            <div className="mse-grid" style={{ display: "flex", gap: 20, alignItems: "stretch", justifyContent: "center" }}>

              {/* ★ CARD 1 — ZERO-COST (HERO) */}
              <div className="mse-card mse-hero" onClick={() => { setSelectedPlan("zero-cost"); setStep(4); }} style={{ flex: "1 1 0", maxWidth: 370, minWidth: 270 }}>
                <div className="mse-badge" style={{ background: "#1B6B3A", color: "#fff", padding: "6px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><StarIcon />Most Popular</div>

                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.8, color: "#1B6B3A", opacity: 0.65, marginBottom: 2 }}>Net Cost Per Unit</div>
                  <div style={{ fontSize: 64, fontWeight: 800, color: "#1B6B3A", lineHeight: 1, letterSpacing: -3 }}>$0</div>
                  <div style={{ fontSize: 14, color: "#475569", fontWeight: 500, marginTop: 4, marginBottom: 16 }}>after your EmPOWER Maryland rebate</div>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14, textAlign: "center" }}>Zero-Cost Tune-Up</h3>

                <RebateFlowVisual units={units} />

                <div style={{ background: "#fef3c7", borderRadius: 8, padding: "7px 14px", marginBottom: 16, textAlign: "center", fontSize: 12, fontWeight: 700, color: "#92400e" }}>
                  25% INSTANT DISCOUNT — <span style={{ textDecoration: "line-through" }}>$213</span> → $160/unit
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px 0", flex: 1 }}>
                  {["Full HVAC tune-up & system optimization", "We handle all EmPOWER rebate paperwork", "$160/unit rebate mailed directly to you", "Priority scheduling", "For 3-ton to 20-ton units"].map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", fontSize: 14, marginBottom: 8, lineHeight: 1.5, color: "#374151" }}><CheckIcon />{f}</li>
                  ))}
                </ul>

                <div className="mse-disclaimer"><InfoIcon /><span>EmPOWER HVAC tune-up rebate available once every 3 years per unit. We'll verify your eligibility.</span></div>

                <button className="mse-btn mse-pri" style={{ width: "100%", padding: "16px 28px", fontSize: 16, marginTop: 16 }}>
                  Get Started — $0 Net Cost <ArrowRight />
                </button>
              </div>

              {/* CARD 2 — STANDARD */}
              <div className="mse-card" onClick={() => { setSelectedPlan("standard"); setStep(4); }} style={{ flex: "1 1 0", maxWidth: 340, minWidth: 260 }}>
                <div style={{ textAlign: "center", marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "#94a3b8", marginBottom: 2 }}>Your Out-of-Pocket</div>
                  <div><span style={{ fontSize: 46, fontWeight: 800, color: "#1a2b3c", letterSpacing: -1 }}>$54</span><span style={{ fontSize: 15, color: "#64748b", fontWeight: 500 }}>/unit</span></div>
                  <div style={{ fontSize: 14, color: "#475569", fontWeight: 500, marginTop: 2, marginBottom: 16 }}>EmPOWER rebate covers the rest</div>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, textAlign: "center" }}>Standard Tune-Up</h3>

                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>Total for {units} unit{units !== 1 ? "s" : ""}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#1a2b3c" }}>${tier2Total.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>You pay ${tier2Total.toLocaleString()} today. We file the EmPOWER rebate, which covers our remaining service cost. Nothing else owed.</div>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px 0", flex: 1 }}>
                  {["Full HVAC tune-up & system optimization", "We handle all EmPOWER rebate paperwork", "Rebate covers remaining service cost", "For 3-ton to 20-ton units", "Service scheduled within 2 weeks"].map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", fontSize: 14, marginBottom: 8, lineHeight: 1.5, color: "#374151" }}><CheckIcon />{f}</li>
                  ))}
                </ul>

                <div className="mse-disclaimer"><InfoIcon /><span>EmPOWER HVAC tune-up rebate available once every 3 years per unit. We'll verify your eligibility.</span></div>

                <button className="mse-btn mse-out" style={{ width: "100%", marginTop: 16 }}>Select Standard <ArrowRight /></button>
              </div>

              {/* CARD 3 — TOTAL BUILDING ENERGY PLAN */}
              <div className="mse-card" onClick={() => { setSelectedPlan("premium"); setStep(4); }} style={{ flex: "1 1 0", maxWidth: 370, minWidth: 270 }}>
                <div className="mse-badge" style={{ background: "linear-gradient(135deg, #5B21B6, #7C3AED)", color: "#fff" }}>Complete Building Solution</div>

                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "#94a3b8", marginBottom: 2 }}>Starting At</div>
                  <div><span style={{ fontSize: 42, fontWeight: 800, color: "#1a2b3c", letterSpacing: -1 }}>${tier3Base.toLocaleString()}</span><span style={{ fontSize: 15, color: "#64748b", fontWeight: 500 }}>/year</span></div>
                  <div style={{ fontSize: 14, color: "#475569", fontWeight: 500, marginTop: 2, marginBottom: 16 }}>Everything your building needs, handled</div>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, textAlign: "center" }}>Total Building Energy Plan</h3>

                {/* Grouped value stack */}
                <div style={{ background: "#faf8ff", borderRadius: 10, padding: 14, marginBottom: 12, border: "1px solid #ede9fe" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                    HVAC & Mechanical
                  </div>
                  {tier3ValueStack.filter(v => v.category === "core" || v.category === "equipment").map((v, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: "#475569" }}>
                      <span style={{ flex: 1 }}>{v.item}</span>
                      <span style={{ fontWeight: 600, color: "#b0b8c4", textDecoration: "line-through", marginLeft: 8, whiteSpace: "nowrap" }}>${v.value.toLocaleString()}</span>
                    </div>
                  ))}

                  <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 12, marginBottom: 8 }}>
                    Energy Advisory & Compliance
                  </div>
                  {tier3ValueStack.filter(v => v.category === "addon").map((v, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: "#475569" }}>
                      <span style={{ flex: 1 }}>{v.item}</span>
                      <span style={{ fontWeight: 600, color: "#b0b8c4", textDecoration: "line-through", marginLeft: 8, whiteSpace: "nowrap" }}>${v.value.toLocaleString()}</span>
                    </div>
                  ))}

                  <div style={{ borderTop: "2px solid #7C3AED", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13, alignItems: "center" }}>
                    <span>Total Value</span>
                    <span style={{ color: "#dc2626", textDecoration: "line-through", fontSize: 15 }}>${tier3TotalValue.toLocaleString()}</span>
                  </div>
                  <div style={{ textAlign: "center", marginTop: 10 }}>
                    <span style={{ fontSize: 15, color: "#64748b" }}>Your price: </span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#5B21B6" }}>${tier3Base.toLocaleString()}/year</span>
                  </div>
                  <div style={{ textAlign: "center", marginTop: 4 }}>
                    <span style={{
                      display: "inline-block", background: "#f0fdf4", color: "#166534",
                      padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                    }}>
                      You save ${(tier3TotalValue - tier3Base).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={{
                  background: "#f0faf3", borderRadius: 8, padding: "8px 12px", marginBottom: 12,
                  textAlign: "center", fontSize: 12, color: "#1B6B3A", fontWeight: 600,
                }}>
                  First-year HVAC tune-up qualifies for $160/unit rebate — up to ${(units * 160).toLocaleString()} back
                </div>

                <div className="mse-disclaimer" style={{ marginBottom: 6 }}>
                  <InfoIcon /><span>HVAC tune-up rebate applies to first-year service (once per 3 years). Subsequent quarterly visits maintain performance at plan rate. Additional program rebates assessed based on building eligibility.</span>
                </div>

                <div style={{ marginTop: "auto" }}>
                  <button className="mse-btn mse-out-purple" style={{ width: "100%" }}>Select Annual Plan <ArrowRight /></button>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button className="mse-btn mse-sec" onClick={goBack}>Back</button>
            </div>
          </div>
        )}

        {/* ——— STEP 4 — CHECKOUT ——— */}
        {step === 4 && selectedPlanData && (
          <div style={{ maxWidth: 580, margin: "0 auto" }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Confirm & Pay</h2>
            <p style={{ color: "#64748b", fontSize: 16, marginBottom: 32, textAlign: "center", lineHeight: 1.6 }}>Review your order, then complete payment.</p>

            <div style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: 14, padding: 28, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 4 }}>{selectedPlanData.name}</h3>
                  <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>{units} HVAC unit{units !== 1 ? "s" : ""}</p>
                </div>
                {selectedPlan === "zero-cost" && (
                  <span style={{ display: "inline-block", background: "#1B6B3A", color: "#fff", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>MOST POPULAR</span>
                )}
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "#64748b" }}>Units</span>
                  <span style={{ fontWeight: 600 }}>{units}</span>
                </div>
                {selectedPlanData.perUnit && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#64748b" }}>Price per unit</span>
                    <span style={{ fontWeight: 600 }}>${selectedPlanData.perUnit}/unit</span>
                  </div>
                )}
                {selectedPlan === "zero-cost" && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#64748b" }}>Discount (25%)</span>
                    <span style={{ fontWeight: 600, color: "#1B6B3A" }}>-${(units * 53).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ borderTop: "2px solid #1B6B3A", marginTop: 8, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 17, fontWeight: 700 }}>Total Due Today</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: selectedPlan === "premium" ? "#5B21B6" : "#1B6B3A" }}>${selectedPlanData.total.toLocaleString()}</span>
                </div>
              </div>

              {selectedPlan === "zero-cost" && (
                <div style={{ background: "linear-gradient(135deg, #f0faf3, #e6f4ea)", borderRadius: 10, padding: 16, marginTop: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>Your utility will mail you a <strong>${tier1Total.toLocaleString()} rebate</strong>.</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#1B6B3A" }}>Net cost: $0</div>
                </div>
              )}
              {selectedPlan === "standard" && (
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginTop: 16, textAlign: "center", fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
                  Your out-of-pocket is ${tier2Total.toLocaleString()}. The EmPOWER rebate covers the remaining service cost through us.
                </div>
              )}
              {selectedPlan === "premium" && (
                <div style={{ background: "#faf8ff", borderRadius: 10, padding: 14, marginTop: 16, border: "1px solid #ede9fe" }}>
                  <div style={{ textAlign: "center", fontSize: 14, color: "#5B21B6", fontWeight: 600, lineHeight: 1.5, marginBottom: 6 }}>
                    Your first-year HVAC tune-up qualifies for the $160/unit rebate — up to ${(units * 160).toLocaleString()} back.
                  </div>
                  <div style={{ textAlign: "center", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                    Includes 4 quarterly visits, thermostat optimization, BAS review, refrigeration assessment, lighting walkthrough, energy supply analysis, community solar feasibility, BEPS compliance, and your dedicated utility advisor — all year.
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: "#f8fafc", border: "2px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", marginBottom: 24 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#475569", margin: 0, marginBottom: 8 }}>Stripe Payment Form</p>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>Stripe Elements will be embedded here.<br />Accepts all major credit cards and ACH transfers.</p>
            </div>

            <button className="mse-btn mse-pri" style={{ width: "100%", padding: "16px 28px", fontSize: 17 }}>
              Complete Payment — ${selectedPlanData.total.toLocaleString()}
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 16, lineHeight: 1.6 }}>
              Secure payment powered by Stripe. By completing this purchase, you agree to our Terms of Service.<br />We'll contact you within 1 business day to schedule your first visit.
            </p>
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button className="mse-btn mse-sec" onClick={() => { setSelectedPlan(null); setStep(3); }}>Change Plan</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
