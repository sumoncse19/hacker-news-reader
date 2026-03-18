import type { FeedType } from "../../types";

interface FeedTabsProps {
  active: FeedType;
  onChange: (type: FeedType) => void;
}

const tabs: { label: string; value: FeedType }[] = [
  { label: "Top", value: "top" },
  { label: "New", value: "new" },
  { label: "Best", value: "best" },
];

export function FeedTabs({ active, onChange }: FeedTabsProps) {
  return (
    <div className="flex gap-1 border-b mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            active === tab.value
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
