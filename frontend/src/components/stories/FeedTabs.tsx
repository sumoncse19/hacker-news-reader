import type { FeedType } from "../../types";

interface FeedTabsProps {
  active: FeedType;
  onChange: (type: FeedType) => void;
}

const tabs: { label: string; value: FeedType }[] = [
  { label: "🔥 Top", value: "top" },
  { label: "🕐 New", value: "new" },
  { label: "⭐ Best", value: "best" },
];

export function FeedTabs({ active, onChange }: FeedTabsProps) {
  return (
    <div className="flex gap-2 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            active === tab.value
              ? "bg-orange-500 text-white shadow-sm"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
