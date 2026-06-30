"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  Home,
  FileText,
  Sparkles,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/workspace", label: "Workspace", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      className="h-screen sticky top-0 flex flex-col glass border-r border-glass-border z-40"
      initial={false}
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-glass-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <h2 className="text-sm font-bold text-gradient-neon whitespace-nowrap">
              DocuWiki.AI
            </h2>
            <p className="text-[10px] text-text-muted">OKF v0.1</p>
          </motion.div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200 group
                ${
                  isActive
                    ? "bg-neon-cyan/10 text-neon-cyan"
                    : "text-text-secondary hover:text-text-primary hover:bg-glass-white-hover"
                }
              `}
            >
              {isActive && (
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-neon-cyan rounded-full"
                  layoutId="activeNav"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                />
              )}

              <Icon
                className={`w-[18px] h-[18px] flex-shrink-0 ${
                  isActive ? "text-neon-cyan" : ""
                }`}
              />

              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Info */}
      {!collapsed && (
        <div className="p-4 border-t border-glass-border">
          <div className="flex items-center gap-2 text-text-muted">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-xs">Open Knowledge Format</span>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
