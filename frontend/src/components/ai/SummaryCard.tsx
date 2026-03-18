import type { AiSummaryResult } from "../../types";

interface SummaryCardProps {
  summary: AiSummaryResult;
  onResummarize: () => void;
  isResummarizing: boolean;
}

const sentimentConfig = {
  positive: {
    label: "Positive",
    color: "bg-green-100 text-green-700",
    icon: "😊",
  },
  negative: { label: "Negative", color: "bg-red-100 text-red-700", icon: "😟" },
  mixed: { label: "Mixed", color: "bg-yellow-100 text-yellow-700", icon: "🤔" },
  neutral: { label: "Neutral", color: "bg-zinc-100 text-zinc-700", icon: "😐" },
};

export function SummaryCard({
  summary,
  onResummarize,
  isResummarizing,
}: SummaryCardProps) {
  const sentiment =
    sentimentConfig[summary.sentiment] || sentimentConfig.neutral;

  return (
    <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="font-semibold text-zinc-900">AI Summary</h3>
        </div>
        <div className="flex items-center gap-2">
          {summary.provider && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                summary.provider === "gemini"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-orange-100 text-orange-600"
              }`}
            >
              {summary.provider === "gemini" ? "✨ Gemini" : "⚡ Groq"}
            </span>
          )}
          {summary.cached && (
            <span className="text-xs text-zinc-400">cached</span>
          )}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${sentiment.color}`}
          >
            {sentiment.icon} {sentiment.label}
          </span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-zinc-700 leading-relaxed mb-4">
        {summary.summary}
      </p>

      {/* Key Points */}
      {summary.keyPoints.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Key Points
          </h4>
          <ul className="space-y-1.5">
            {summary.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-700">
                <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-blue-200/50">
        <span className="text-xs text-zinc-400">
          Based on {summary.commentCount} comments
        </span>
        <button
          onClick={onResummarize}
          disabled={isResummarizing}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 transition-colors"
        >
          {isResummarizing ? "Regenerating..." : "🔄 Re-summarize"}
        </button>
      </div>
    </div>
  );
}
