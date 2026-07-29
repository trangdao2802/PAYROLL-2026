import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { HoldAddDashboard } from "./components/HoldAddDashboard";

export function HoldDashboardPage(): React.ReactElement {
  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key="hold-dashboard-main"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute inset-0 flex flex-col min-h-0 bg-transparent px-4 md:px-6 pt-4 pb-4 items-center overflow-hidden"
          style={{ paddingBottom: "16px" }}
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] -z-10" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] -z-10" />

          {/* Main Content Card matching Master AE and Pivot Sheet styles */}
          <div 
            className="bg-white dark:bg-card force-light dark:force-dark flex-1 flex flex-col min-h-0 relative z-10 w-full overflow-hidden border border-border/40 shadow-sm hold-dashboard-card"
            style={{ borderRadius: "0px" }}
          >
            <HoldAddDashboard />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
