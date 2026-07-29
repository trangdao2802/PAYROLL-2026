import { useState } from "react";
import { useNavigate } from "react-router";

export function Dashboard() {
  const navigate = useNavigate();

  const [hiddenCards, setHiddenCards] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("dashboard_hidden_cards");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleCardVisibility = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenCards((prev) => {
      const next = prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path];
      localStorage.setItem("dashboard_hidden_cards", JSON.stringify(next));
      return next;
    });
  };

  const cards = [
    {
      title: "Master AE",
      path: "/master-ae",
      desc: "Manage AE data sheets",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
      )
    },
    {
      title: "Bulk Payment",
      path: "/payment",
      desc: "Process bank exports",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
      )
    },
    {
      title: "Audit Center",
      path: "/audit",
      desc: "Compare payroll data",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
      )
    },
    {
      title: "Balance",
      path: "/hold-dashboard",
      desc: "Track & adjust trial balance",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
      )
    }
  ];

  return (
    <div id="dashboard-container" className="grid grid-cols-1 lg:grid-cols-[1fr_400px] grid-rows-1 h-full overflow-hidden bg-background">
      <div className="p-6 md:p-10 lg:p-12 xl:p-16 overflow-y-auto border-r border-primary/10 relative">
        {hiddenCards.length > 0 && (
          <button
            onClick={() => {
              setHiddenCards([]);
              localStorage.removeItem("dashboard_hidden_cards");
            }}
            className="absolute top-6 right-6 md:top-10 md:right-10 lg:top-12 lg:right-12 xl:top-16 xl:right-16 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-primary/50 hover:text-primary transition-colors cursor-pointer bg-transparent border border-primary/20 px-3 py-1.5"
          >
            Restore Hidden
          </button>
        )}
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-primary/50 mb-3 block">
          Primary View
        </span>
        <h1 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.95] font-normal tracking-[-0.04em] mb-4 md:mb-6 text-primary">
          Dashboard
        </h1>
        <p className="text-[1rem] md:text-[1.1rem] leading-[1.6] max-w-[500px] text-primary/60 mb-8 md:mb-12">
          Quản lý lương và kiểm toán chuyên nghiệp. Theo dõi phân phối thời gian thực và phát hiện các sai lệch.
        </p>

        <div 
          className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-primary/10 border border-primary/10 stat-group"
          style={{ paddingTop: "0px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px" }}
        >
          {cards.filter(c => !hiddenCards.includes(c.path)).map(c => (
            <div 
              key={c.path}
              onClick={() => navigate(c.path)}
              className="stat-card dashboard-card bg-background p-6 md:p-8 transition-colors duration-200 relative cursor-pointer hover:bg-accent/5 group text-primary"
            >
              <button 
                onClick={(e) => toggleCardVisibility(c.path, e)}
                className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-primary/30 hover:text-primary p-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L14.12 14.12"/><path d="M2 2l20 20"/><path d="M10.37 4.14a10.74 10.74 0 0 1 11.21 6.57c.1.25.15.52.15.79s-.05.54-.15.79a10.75 10.75 0 0 1-1.45 2.49"/><path d="M7.74 7.74a3 3 0 0 0 4.24 4.24"/><path d="M17.48 17.48a10.75 10.75 0 0 1-15.42-5.15c-.1-.25-.15-.52-.15-.79s.05-.54.15-.79A10.74 10.74 0 0 1 6.51 6.51"/></svg>
              </button>
              <div className="w-10 h-10 border border-primary/10 flex items-center justify-center mb-6 md:mb-10 text-accent">
                {c.icon}
              </div>
              <h3 className="font-display text-[1.25rem] md:text-[1.5rem] font-normal mb-1">{c.title}</h3>
              <p className="text-[0.75rem] uppercase tracking-[0.05em] text-primary/60">{c.desc}</p>
              <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 opacity-20 group-hover:opacity-100 transition-opacity">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-10 lg:p-12 xl:p-16 bg-[#FFFEFA] flex flex-col justify-between">
        <div className="flex flex-col gap-6 md:gap-10">
          <div className="border-l-[2px] border-accent pl-5">
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-primary/50 block mb-1">System Status</span>
            <div className="font-display text-[1.25rem] md:text-[1.5rem] italic text-primary">Operational</div>
          </div>

          <div className="border-l-[2px] border-accent pl-5">
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-primary/50 block mb-1">Last Audit</span>
            <div className="font-display text-[1.25rem] md:text-[1.5rem] italic text-primary">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/audit')}
          className="w-full bg-primary text-background border-none p-4 md:p-5 text-[0.75rem] font-bold uppercase tracking-[0.2em] cursor-pointer flex items-center justify-center gap-3 transition-transform hover:-translate-y-[2px] mt-8"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>
          Run Audit Process
        </button>
      </div>
    </div>
  );
}

