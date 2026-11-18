import { useState } from 'react';
import { Bot, Send, X, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
  mode?: 'ai' | 'deterministic-fallback';
}

const SUGGESTED_QUESTIONS = [
  'Which hackathons can I apply for?',
  'Which opportunities are closing soon?',
  'Which opportunities match my skills and interests?',
  'Compare my saved opportunities by deadline and mode.',
];

export function AssistantDrawer() {
  const {
    assistantOpen,
    setAssistantOpen,
    profile,
    opportunities,
    userOpportunities,
    geminiConfigured,
  } = useApp();

  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!assistantOpen) return null;

  async function sendQuestion(questionText: string) {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    setError(null);
    const nextHistory: ChatTurn[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          profile,
          opportunities,
          savedRecords: userOpportunities,
          history: nextHistory.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = (await res.json()) as {
        answer?: string;
        mode?: 'ai' | 'deterministic-fallback';
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Could not reach Univanta Assistant.');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || 'No response received.',
          mode: data.mode,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assistant request failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Univanta Opportunity Assistant"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/35"
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">
              <Bot className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Univanta Assistant</h2>
              <p className="text-xs text-slate-500">
                Grounded in {opportunities.filter((o) => o.verificationStatus !== 'Archived').length} catalog items & your Year {profile.academicYear} profile
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setError(null);
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-700"
                aria-label="Clear conversation"
                title="Clear conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setAssistantOpen(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-700"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!geminiConfigured && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-xs text-amber-900">
            Server GEMINI_API_KEY is not active; replies will use deterministic catalog reasoning.
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-5 pt-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Ask about deadlines, eligibility, or your saved opportunities
                </p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Responses use only opportunities stored in Univanta and your profile ({profile.course} {profile.branch}, Year {profile.academicYear}). Missing facts are explicitly flagged.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Suggested questions</p>
                <div className="flex flex-col gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendQuestion(q)}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left text-xs font-medium text-slate-800 hover:border-blue-300 hover:bg-blue-50/40 transition-colors focus-visible:outline-2 focus-visible:outline-blue-700"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-700 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'assistant' && msg.mode === 'deterministic-fallback' && (
                  <span className="mt-1 text-[11px] text-slate-500">
                    Answered via deterministic catalog matching
                  </span>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-blue-700" aria-hidden="true" />
              <span>Evaluating catalog and student profile...</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="border-t border-slate-200 p-4"
        >
          <label htmlFor="assistant-question-input" className="sr-only">
            Ask Univanta Assistant
          </label>
          <div className="flex items-center gap-2">
            <input
              id="assistant-question-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about eligibility, deadlines, or compare saved..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
              maxLength={1200}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-blue-700 whitespace-nowrap"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>Ask</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
