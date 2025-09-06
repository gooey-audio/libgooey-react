import React from "react";

export interface Tab {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, activeTab, onTabChange, className = "" }: TabsProps) => {
  return (
    <div className={`border-b border-white/20 ${className}`}>
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-2 rounded-t-md border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-white/80 text-white font-bold"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
