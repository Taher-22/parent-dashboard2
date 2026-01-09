import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  Bot,
  Layers
} from "lucide-react";

const navItems = [
  {
    label: "Overview",
    path: "/overview",
    icon: LayoutDashboard
  },
  {
    label: "Time Control",
    path: "/time-control",
    icon: Clock
  },
    {
    label: "Subjects",        
    path: "/subjects",        
    icon: Layers,             
  },
  {
    label: "Reports",
    path: "/reports",
    icon: BarChart3
  },
  {
    label: "AI Assistant",
    path: "/ai",
    icon: Bot
  }
];

export default function Sidebar() {
  return (
    <aside className="panel stroke rounded-2xl p-4 flex flex-col gap-2">
      
      {/* Title */}
      <div className="px-2 py-3 mb-2">
        <div className="text-lg font-extrabold tracking-tight">
          Parent Dashboard
        </div>
        <div className="text-xs opacity-70 mt-1">
          control center
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink key={item.path} to={item.path} end>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 6, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer
                    ${isActive
                      ? "bg-white/30 dark:bg-white/10 shadow-md"
                      : "hover:bg-white/20 dark:hover:bg-white/5"
                    }
                  `}
                >
                  {/* Active glow */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(0,220,130,0.25), rgba(255,200,60,0.25), rgba(170,90,255,0.25))",
                        zIndex: -1
                      }}
                    />
                  )}

                  <Icon className="h-5 w-5 opacity-90" />

                  <span className="font-semibold tracking-tight">
                    {item.label}
                  </span>
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 text-xs opacity-60 px-2">
        EduGalaxy © 2025  
        <br />
        Parent supervision system
      </div>
    </aside>
  );
}
