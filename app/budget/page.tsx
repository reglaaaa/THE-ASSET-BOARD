"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Coins,
  FolderKanban,
  Lock,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TriangleAlert,
  X
} from "lucide-react";
import {
  supabase,
  type BudgetSource,
  type Expense,
  type Project,
  type ProjectStatus
} from "@/lib/supabaseClient";
import { Logo } from "@/components/Logo";
import { EmptyState } from "@/components/EmptyState";
import { BudgetSkeleton } from "@/components/skeletons/BudgetSkeleton";

const PESO = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2
});

function money(n: number) {
  return PESO.format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

// yyyy-mm-dd for <input type="date"> — handles both plain dates and
// full timestamps coming back from Postgres.
function toDateInputValue(d: string) {
  return d.slice(0, 10);
}

const STATUS_META: Record<ProjectStatus, { label: string; dot: string; text: string }> = {
  planning: { label: "Planning", dot: "bg-ink-400", text: "text-ink-400" },
  executing: { label: "Executing", dot: "bg-gold-400", text: "text-gold-300" },
  executed: { label: "Executed", dot: "bg-gold-200", text: "text-gold-200" },
  cancelled: { label: "Cancelled", dot: "bg-blood-500", text: "text-blood-400" }
};

const STATUS_ORDER: ProjectStatus[] = ["planning", "executing", "cancelled", "executed"];

type TableName = "budget_sources" | "expenses" | "projects";

// Shared input styling to match the rest of the site's forms
// (see Composer.tsx / transparency page.tsx).
const inputClass =
  "rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-[#f2ecdb] placeholder:text-ink-400 focus:border-gold-500 focus:outline-none";

function ExpandCard({
  icon,
  title,
  subtitle,
  open,
  onToggle,
  accent = "gold",
  children
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  accent?: "gold" | "blood";
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-600 bg-ink-800/60">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
              accent === "gold"
                ? "border-gold-600/40 text-gold-300"
                : "border-blood-600/40 text-blood-400"
            }`}
          >
            {icon}
          </div>
          <div>
            <p className="font-display text-sm font-bold text-[#f2ecdb]">{title}</p>
            <p className="text-xs text-ink-400">{subtitle}</p>
          </div>
        </div>
        <ChevronDown
          size={16}
          strokeWidth={2.2}
          className={`shrink-0 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="border-t border-ink-600 p-4">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------
// Admin write helper — shared by every section. Returns null on success,
// or an error string. A 401 clears the cached password so the admin is
// prompted to re-unlock (e.g. it expired, or was wrong all along).
// ---------------------------------------------------------------------
function useAdminWrites(
  unlockedPassword: string | null,
  onWrongPassword: () => void,
  onChanged: () => void
) {
  async function run(
    method: "POST" | "PUT" | "DELETE",
    table: TableName,
    extra: { id?: string; payload?: unknown }
  ) {
    if (!unlockedPassword) return "Not unlocked.";
    try {
      const res = await fetch("/api/budget", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: unlockedPassword, table, ...extra })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) onWrongPassword();
        return json.error ?? "Something went wrong.";
      }
      onChanged();
      return null;
    } catch {
      return "Network error — please try again.";
    }
  }
  return run;
}

// ---------------------------------------------------------------------
// Admin unlock bar
// ---------------------------------------------------------------------
function AdminUnlockBar({
  unlockedPassword,
  onUnlock,
  onLock
}: {
  unlockedPassword: string | null;
  onUnlock: (password: string) => void;
  onLock: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  if (unlockedPassword) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-gold-600/40 bg-ink-800/60 px-3.5 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-300">
          <Lock size={13} strokeWidth={2.2} />
          Admin mode — you can add, edit, or remove entries below.
        </span>
        <button
          onClick={onLock}
          className="text-xs text-ink-400 hover:text-blood-400"
        >
          Lock
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-600 py-3 text-xs font-medium text-ink-400 hover:border-gold-600/50 hover:text-gold-300"
      >
        <Lock size={13} strokeWidth={2.2} />
        Council admin? Manage budget entries
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-ink-600 bg-ink-800/60 p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-300">
          <Lock size={13} strokeWidth={2.2} />
          Admin unlock
        </span>
        <button
          onClick={() => {
            setOpen(false);
            setPasswordInput("");
          }}
          aria-label="Close"
          className="text-ink-400 hover:text-blood-400"
        >
          <X size={16} strokeWidth={2.2} />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Admin password (same as Transparency)"
          className={`flex-1 ${inputClass}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && passwordInput) onUnlock(passwordInput);
          }}
        />
        <button
          onClick={() => passwordInput && onUnlock(passwordInput)}
          disabled={!passwordInput}
          className="shrink-0 rounded-lg bg-gold-liquid-soft px-3 text-sm font-medium text-ink-950 disabled:opacity-40"
        >
          Unlock
        </button>
      </div>
      <p className="mt-2 text-[11px] text-ink-400">
        Checked when you save your first change — nothing is verified until then.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------
// Budget sources (money in)
// ---------------------------------------------------------------------
function SourcesSection({
  sources,
  adminMode,
  unlockedPassword,
  onWrongPassword,
  onChanged
}: {
  sources: BudgetSource[];
  adminMode: boolean;
  unlockedPassword: string | null;
  onWrongPassword: () => void;
  onChanged: () => void;
}) {
  const write = useAdminWrites(unlockedPassword, onWrongPassword, onChanged);

  const [adding, setAdding] = useState(false);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [dateReceived, setDateReceived] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ source: "", amount: "", date_received: "" });
  const [rowError, setRowError] = useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    const amt = Number(amount);
    if (!source.trim() || !amount || !dateReceived || isNaN(amt) || amt < 0) {
      setError("Fill in a source, a valid amount, and a date.");
      return;
    }
    setBusy(true);
    const err = await write("POST", "budget_sources", {
      payload: { source: source.trim(), amount: amt, date_received: dateReceived }
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setSource("");
    setAmount("");
    setDateReceived("");
    setAdding(false);
  }

  function startEdit(s: BudgetSource) {
    setEditingId(s.id);
    setRowError(null);
    setDraft({
      source: s.source,
      amount: String(s.amount),
      date_received: toDateInputValue(s.date_received)
    });
  }

  async function saveEdit(id: string) {
    setRowError(null);
    const amt = Number(draft.amount);
    if (!draft.source.trim() || isNaN(amt) || amt < 0 || !draft.date_received) {
      setRowError("Fill in a valid source, amount, and date.");
      return;
    }
    const err = await write("PUT", "budget_sources", {
      id,
      payload: { source: draft.source.trim(), amount: amt, date_received: draft.date_received }
    });
    if (err) {
      setRowError(err);
      return;
    }
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this budget source? This can't be undone.")) return;
    const err = await write("DELETE", "budget_sources", { id });
    if (err) alert(err);
  }

  if (sources.length === 0 && !adminMode) {
    return (
      <EmptyState
        icon={<Coins size={18} strokeWidth={2} />}
        message="No budget sources recorded yet."
        className="py-4"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sources.length > 0 && (
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-1 text-[11px] uppercase tracking-wide text-ink-400">
          <span>Source</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Date</span>
        </div>
      )}

      {sources.map((s) =>
        editingId === s.id ? (
          <div key={s.id} className="flex flex-col gap-2 rounded-lg border border-gold-600/40 bg-ink-900/60 p-2.5">
            <input
              value={draft.source}
              onChange={(e) => setDraft({ ...draft, source: e.target.value })}
              placeholder="Source"
              className={inputClass}
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                placeholder="Amount"
                className={`flex-1 ${inputClass}`}
              />
              <input
                type="date"
                value={draft.date_received}
                onChange={(e) => setDraft({ ...draft, date_received: e.target.value })}
                className={`flex-1 ${inputClass}`}
              />
            </div>
            {rowError && <p className="text-xs text-blood-400">{rowError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => saveEdit(s.id)}
                className="flex-1 rounded-lg bg-gold-liquid-soft py-1.5 text-xs font-medium text-ink-950"
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 rounded-lg border border-ink-600 py-1.5 text-xs text-ink-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            key={s.id}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-ink-600 bg-ink-900/60 px-3 py-2 text-[13px]"
          >
            <span className="text-[#f2ecdb]/90">{s.source}</span>
            <span className="whitespace-nowrap text-right font-medium text-gold-300">
              {money(Number(s.amount))}
            </span>
            <span className="flex items-center justify-end gap-2 whitespace-nowrap text-right text-ink-400">
              {formatDate(s.date_received)}
              {adminMode && (
                <span className="flex items-center gap-1">
                  <button onClick={() => startEdit(s)} className="text-ink-400 hover:text-gold-300">
                    <Pencil size={13} strokeWidth={2.2} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="text-ink-400 hover:text-blood-400">
                    <Trash2 size={13} strokeWidth={2.2} />
                  </button>
                </span>
              )}
            </span>
          </div>
        )
      )}

      {adminMode &&
        (adding ? (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-gold-600/40 p-2.5">
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Source (e.g. University subsidy)"
              className={inputClass}
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className={`flex-1 ${inputClass}`}
              />
              <input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                className={`flex-1 ${inputClass}`}
              />
            </div>
            {error && <p className="text-xs text-blood-400">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={busy}
                className="flex-1 rounded-lg bg-gold-liquid-soft py-1.5 text-xs font-medium text-ink-950 disabled:opacity-40"
              >
                {busy ? "Saving…" : "Add source"}
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                className="flex-1 rounded-lg border border-ink-600 py-1.5 text-xs text-ink-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-600 py-2 text-xs text-ink-400 hover:border-gold-600/50 hover:text-gold-300"
          >
            <Plus size={13} strokeWidth={2.2} />
            Add budget source
          </button>
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Expenses (money out)
// ---------------------------------------------------------------------
function ExpensesSection({
  expenses,
  adminMode,
  unlockedPassword,
  onWrongPassword,
  onChanged
}: {
  expenses: Expense[];
  adminMode: boolean;
  unlockedPassword: string | null;
  onWrongPassword: () => void;
  onChanged: () => void;
}) {
  const write = useAdminWrites(unlockedPassword, onWrongPassword, onChanged);

  const [adding, setAdding] = useState(false);
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [dateSpent, setDateSpent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ item: "", amount: "", date_spent: "" });
  const [rowError, setRowError] = useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    const amt = Number(amount);
    if (!item.trim() || !amount || !dateSpent || isNaN(amt) || amt < 0) {
      setError("Fill in an item, a valid amount, and a date.");
      return;
    }
    setBusy(true);
    const err = await write("POST", "expenses", {
      payload: { item: item.trim(), amount: amt, date_spent: dateSpent }
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setItem("");
    setAmount("");
    setDateSpent("");
    setAdding(false);
  }

  function startEdit(e: Expense) {
    setEditingId(e.id);
    setRowError(null);
    setDraft({ item: e.item, amount: String(e.amount), date_spent: toDateInputValue(e.date_spent) });
  }

  async function saveEdit(id: string) {
    setRowError(null);
    const amt = Number(draft.amount);
    if (!draft.item.trim() || isNaN(amt) || amt < 0 || !draft.date_spent) {
      setRowError("Fill in a valid item, amount, and date.");
      return;
    }
    const err = await write("PUT", "expenses", {
      id,
      payload: { item: draft.item.trim(), amount: amt, date_spent: draft.date_spent }
    });
    if (err) {
      setRowError(err);
      return;
    }
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this expense? This can't be undone.")) return;
    const err = await write("DELETE", "expenses", { id });
    if (err) alert(err);
  }

  if (expenses.length === 0 && !adminMode) {
    return (
      <EmptyState
        icon={<TrendingDown size={18} strokeWidth={2} />}
        message="No expenses recorded yet."
        className="py-4"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {expenses.length > 0 && (
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-1 text-[11px] uppercase tracking-wide text-ink-400">
          <span>Item / Purpose</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Date</span>
        </div>
      )}

      {expenses.map((e) =>
        editingId === e.id ? (
          <div key={e.id} className="flex flex-col gap-2 rounded-lg border border-gold-600/40 bg-ink-900/60 p-2.5">
            <input
              value={draft.item}
              onChange={(ev) => setDraft({ ...draft, item: ev.target.value })}
              placeholder="Item / purpose"
              className={inputClass}
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={draft.amount}
                onChange={(ev) => setDraft({ ...draft, amount: ev.target.value })}
                placeholder="Amount"
                className={`flex-1 ${inputClass}`}
              />
              <input
                type="date"
                value={draft.date_spent}
                onChange={(ev) => setDraft({ ...draft, date_spent: ev.target.value })}
                className={`flex-1 ${inputClass}`}
              />
            </div>
            {rowError && <p className="text-xs text-blood-400">{rowError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => saveEdit(e.id)}
                className="flex-1 rounded-lg bg-gold-liquid-soft py-1.5 text-xs font-medium text-ink-950"
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 rounded-lg border border-ink-600 py-1.5 text-xs text-ink-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            key={e.id}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-ink-600 bg-ink-900/60 px-3 py-2 text-[13px]"
          >
            <span className="text-[#f2ecdb]/90">{e.item}</span>
            <span className="whitespace-nowrap text-right font-medium text-blood-400">
              {money(Number(e.amount))}
            </span>
            <span className="flex items-center justify-end gap-2 whitespace-nowrap text-right text-ink-400">
              {formatDate(e.date_spent)}
              {adminMode && (
                <span className="flex items-center gap-1">
                  <button onClick={() => startEdit(e)} className="text-ink-400 hover:text-gold-300">
                    <Pencil size={13} strokeWidth={2.2} />
                  </button>
                  <button onClick={() => handleDelete(e.id)} className="text-ink-400 hover:text-blood-400">
                    <Trash2 size={13} strokeWidth={2.2} />
                  </button>
                </span>
              )}
            </span>
          </div>
        )
      )}

      {adminMode &&
        (adding ? (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-gold-600/40 p-2.5">
            <input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="Item / purpose (e.g. Foundation Week supplies)"
              className={inputClass}
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className={`flex-1 ${inputClass}`}
              />
              <input
                type="date"
                value={dateSpent}
                onChange={(e) => setDateSpent(e.target.value)}
                className={`flex-1 ${inputClass}`}
              />
            </div>
            {error && <p className="text-xs text-blood-400">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={busy}
                className="flex-1 rounded-lg bg-gold-liquid-soft py-1.5 text-xs font-medium text-ink-950 disabled:opacity-40"
              >
                {busy ? "Saving…" : "Add expense"}
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                className="flex-1 rounded-lg border border-ink-600 py-1.5 text-xs text-ink-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-600 py-2 text-xs text-ink-400 hover:border-gold-600/50 hover:text-gold-300"
          >
            <Plus size={13} strokeWidth={2.2} />
            Add expense
          </button>
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------
function ProjectsSection({
  projects,
  adminMode,
  unlockedPassword,
  onWrongPassword,
  onChanged
}: {
  projects: Project[];
  adminMode: boolean;
  unlockedPassword: string | null;
  onWrongPassword: () => void;
  onChanged: () => void;
}) {
  const write = useAdminWrites(unlockedPassword, onWrongPassword, onChanged);

  const statusBreakdown = useMemo(() => {
    const map: Record<ProjectStatus, { count: number; budget: number }> = {
      planning: { count: 0, budget: 0 },
      executing: { count: 0, budget: 0 },
      cancelled: { count: 0, budget: 0 },
      executed: { count: 0, budget: 0 }
    };
    for (const p of projects) {
      map[p.status].count += 1;
      map[p.status].budget += Number(p.budget_used);
    }
    return map;
  }, [projects]);

  const emptyDraft = { name: "", description: "", status: "planning" as ProjectStatus, budget_used: "" };
  const [adding, setAdding] = useState(false);
  const [newProject, setNewProject] = useState(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [rowError, setRowError] = useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    const budget = Number(newProject.budget_used || 0);
    if (!newProject.name.trim() || !newProject.description.trim() || isNaN(budget) || budget < 0) {
      setError("Fill in a name, description, and a valid budget used.");
      return;
    }
    setBusy(true);
    const err = await write("POST", "projects", {
      payload: {
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        status: newProject.status,
        budget_used: budget
      }
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setNewProject(emptyDraft);
    setAdding(false);
  }

  function startEdit(p: Project) {
    setEditingId(p.id);
    setRowError(null);
    setDraft({
      name: p.name,
      description: p.description,
      status: p.status,
      budget_used: String(p.budget_used)
    });
  }

  async function saveEdit(id: string) {
    setRowError(null);
    const budget = Number(draft.budget_used || 0);
    if (!draft.name.trim() || !draft.description.trim() || isNaN(budget) || budget < 0) {
      setRowError("Fill in a valid name, description, and budget used.");
      return;
    }
    const err = await write("PUT", "projects", {
      id,
      payload: {
        name: draft.name.trim(),
        description: draft.description.trim(),
        status: draft.status,
        budget_used: budget
      }
    });
    if (err) {
      setRowError(err);
      return;
    }
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this project? This can't be undone.")) return;
    const err = await write("DELETE", "projects", { id });
    if (err) alert(err);
  }

  return (
    <>
      {/* Status breakdown */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STATUS_ORDER.map((status) => {
          const meta = STATUS_META[status];
          const stat = statusBreakdown[status];
          return (
            <div key={status} className="rounded-lg border border-ink-600 bg-ink-900/60 px-2.5 py-2">
              <div className="mb-1 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                <span className={`text-[11px] font-medium ${meta.text}`}>{meta.label}</span>
              </div>
              <p className="text-sm font-bold text-[#f2ecdb]">{stat.count}</p>
              <p className="text-[10px] text-ink-400">{money(stat.budget)}</p>
            </div>
          );
        })}
      </div>

      {/* Full project list */}
      {projects.length === 0 && !adminMode && (
        <EmptyState
          icon={<FolderKanban size={18} strokeWidth={2} />}
          message="No projects recorded yet."
          className="py-4"
        />
      )}

      <div className="flex flex-col gap-2">
        {projects.map((p) => {
          const meta = STATUS_META[p.status];
          return editingId === p.id ? (
            <div key={p.id} className="flex flex-col gap-2 rounded-lg border border-gold-600/40 bg-ink-900/60 p-3">
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Project name"
                className={inputClass}
              />
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Short description"
                rows={2}
                className={`resize-none ${inputClass}`}
              />
              <div className="flex gap-2">
                <select
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as ProjectStatus })}
                  className={`flex-1 ${inputClass}`}
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={draft.budget_used}
                  onChange={(e) => setDraft({ ...draft, budget_used: e.target.value })}
                  placeholder="Budget used"
                  className={`flex-1 ${inputClass}`}
                />
              </div>
              {rowError && <p className="text-xs text-blood-400">{rowError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(p.id)}
                  className="flex-1 rounded-lg bg-gold-liquid-soft py-1.5 text-xs font-medium text-ink-950"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 rounded-lg border border-ink-600 py-1.5 text-xs text-ink-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div key={p.id} className="rounded-lg border border-ink-600 bg-ink-900/60 p-3">
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="text-[14px] font-semibold text-[#f2ecdb]">{p.name}</p>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border border-ink-600 px-2 py-0.5 text-[10px] font-medium ${meta.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                  {adminMode && (
                    <span className="flex items-center gap-1">
                      <button onClick={() => startEdit(p)} className="text-ink-400 hover:text-gold-300">
                        <Pencil size={13} strokeWidth={2.2} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-ink-400 hover:text-blood-400">
                        <Trash2 size={13} strokeWidth={2.2} />
                      </button>
                    </span>
                  )}
                </span>
              </div>
              <p className="mb-2 text-[13px] leading-relaxed text-ink-400">{p.description}</p>
              <p className="text-[12px] font-medium text-gold-300">
                Budget used: {money(Number(p.budget_used))}
              </p>
            </div>
          );
        })}
      </div>

      {adminMode &&
        (adding ? (
          <div className="mt-2 flex flex-col gap-2 rounded-lg border border-dashed border-gold-600/40 p-3">
            <input
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              placeholder="Project name"
              className={inputClass}
            />
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Short description"
              rows={2}
              className={`resize-none ${inputClass}`}
            />
            <div className="flex gap-2">
              <select
                value={newProject.status}
                onChange={(e) =>
                  setNewProject({ ...newProject, status: e.target.value as ProjectStatus })
                }
                className={`flex-1 ${inputClass}`}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={newProject.budget_used}
                onChange={(e) => setNewProject({ ...newProject, budget_used: e.target.value })}
                placeholder="Budget used"
                className={`flex-1 ${inputClass}`}
              />
            </div>
            {error && <p className="text-xs text-blood-400">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={busy}
                className="flex-1 rounded-lg bg-gold-liquid-soft py-1.5 text-xs font-medium text-ink-950 disabled:opacity-40"
              >
                {busy ? "Saving…" : "Add project"}
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                className="flex-1 rounded-lg border border-ink-600 py-1.5 text-xs text-ink-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-600 py-2 text-xs text-ink-400 hover:border-gold-600/50 hover:text-gold-300"
          >
            <Plus size={13} strokeWidth={2.2} />
            Add project
          </button>
        ))}
    </>
  );
}

export default function BudgetPage() {
  const [sources, setSources] = useState<BudgetSource[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [budgetOpen, setBudgetOpen] = useState(false);
  const [spendingOpen, setSpendingOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);

  // Kept only in memory for this tab's session, mirroring the transparency
  // page's admin password handling, so it isn't retyped for every action.
  const [unlockedPassword, setUnlockedPassword] = useState<string | null>(null);
  const adminMode = unlockedPassword !== null;

  useEffect(() => {
    load();

    const channel = supabase
      .channel("budget-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "budget_sources" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    const [s, e, p] = await Promise.all([
      supabase.from("budget_sources").select("*").order("date_received", { ascending: false }),
      supabase.from("expenses").select("*").order("date_spent", { ascending: false }),
      supabase.from("projects").select("*").order("created_at", { ascending: false })
    ]);
    if (!s.error && s.data) setSources(s.data as BudgetSource[]);
    if (!e.error && e.data) setExpenses(e.data as Expense[]);
    if (!p.error && p.data) setProjects(p.data as Project[]);
    setLoading(false);
  }

  const totalBudget = useMemo(() => sources.reduce((sum, s) => sum + Number(s.amount), 0), [sources]);
  const totalSpending = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount), 0), [expenses]);
  const deficit = totalSpending - totalBudget;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-24">
      <header className="sticky top-0 z-10 -mx-4 border-b border-ink-700 bg-ink-950/85 px-4 pb-3 pt-5 backdrop-blur">
        <Logo />
        <p className="mt-1.5 text-xs tracking-wide text-ink-400">
          Budget Dashboard — where the money comes from, where it goes.
        </p>
      </header>

      {loading ? (
        <div className="mt-4">
          <BudgetSkeleton />
        </div>
      ) : (
        <section className="mt-4 flex flex-col gap-3">
          <AdminUnlockBar
            unlockedPassword={unlockedPassword}
            onUnlock={setUnlockedPassword}
            onLock={() => setUnlockedPassword(null)}
          />

          {/* 1. Total Yearly Budget */}
          <ExpandCard
            icon={<Coins size={16} strokeWidth={2.2} />}
            title="Total Yearly Budget"
            subtitle={money(totalBudget)}
            open={budgetOpen}
            onToggle={() => setBudgetOpen((v) => !v)}
          >
            <SourcesSection
              sources={sources}
              adminMode={adminMode}
              unlockedPassword={unlockedPassword}
              onWrongPassword={() => setUnlockedPassword(null)}
              onChanged={load}
            />
          </ExpandCard>

          {/* 2. Total Yearly Spending */}
          <ExpandCard
            icon={<TrendingDown size={16} strokeWidth={2.2} />}
            title="Total Yearly Spending"
            subtitle={money(totalSpending)}
            open={spendingOpen}
            onToggle={() => setSpendingOpen((v) => !v)}
          >
            <ExpensesSection
              expenses={expenses}
              adminMode={adminMode}
              unlockedPassword={unlockedPassword}
              onWrongPassword={() => setUnlockedPassword(null)}
              onChanged={load}
            />
          </ExpandCard>

          {/* 3. Budget Deficit — static, non-clickable */}
          <div
            className={`rounded-xl border p-4 ${
              deficit > 0
                ? "border-blood-600/60 bg-blood-700/[0.08] shadow-blood"
                : "border-gold-600/40 bg-ink-800/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                  deficit > 0 ? "border-blood-600/50 text-blood-400" : "border-gold-600/40 text-gold-300"
                }`}
              >
                <TriangleAlert size={16} strokeWidth={2.2} />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-[#f2ecdb]">
                  {deficit > 0 ? "Budget Deficit" : "Budget Surplus"}
                </p>
                <p className="text-xs text-ink-400">Total spending minus total budget</p>
              </div>
            </div>
            <p
              className={`mt-3 font-display text-2xl font-bold ${
                deficit > 0 ? "text-blood-400" : "text-gold-liquid"
              }`}
            >
              {deficit > 0 ? money(deficit) : money(Math.abs(deficit))}
            </p>
          </div>

          {/* 4. Projects */}
          <ExpandCard
            icon={<FolderKanban size={16} strokeWidth={2.2} />}
            title="Projects"
            subtitle={`${projects.length} total`}
            open={projectsOpen}
            onToggle={() => setProjectsOpen((v) => !v)}
          >
            <ProjectsSection
              projects={projects}
              adminMode={adminMode}
              unlockedPassword={unlockedPassword}
              onWrongPassword={() => setUnlockedPassword(null)}
              onChanged={load}
            />
          </ExpandCard>
        </section>
      )}
    </main>
  );
}
