import { supabase, type BudgetSource, type Expense, type Project } from "./supabaseClient";

// Module-level cache. Lives only in this tab's JS runtime — it resets on
// a hard reload, and is never persisted to localStorage/sessionStorage.
// Client-side navigation (feed -> budget page) keeps this module alive,
// so the second page reuses whatever the first one already fetched
// instead of re-querying Supabase.

export type BudgetTotals = {
  totalBudget: number;
  totalProjectsBudget: number;
  totalOtherSpending: number;
  sourceCount: number;
  projectCount: number;
  expenseCount: number;
};

const TOTALS_TTL_MS = 30_000;
const LIST_LIMIT = 100;

let totals: BudgetTotals | null = null;
let totalsFetchedAt = 0;
let totalsInFlight: Promise<BudgetTotals> | null = null;

let sourcesCache: BudgetSource[] | null = null;
let expensesCache: Expense[] | null = null;
let projectsCache: Project[] | null = null;

// ---------------------------------------------------------------------
// Totals — one cheap aggregate RPC, shared by the feed hero and the
// budget page's three header cards.
// ---------------------------------------------------------------------
export function getCachedTotals() {
  return totals;
}

export async function fetchTotals(force = false): Promise<BudgetTotals> {
  if (!force && totals && Date.now() - totalsFetchedAt < TOTALS_TTL_MS) {
    return totals;
  }
  if (totalsInFlight && !force) return totalsInFlight;

  totalsInFlight = (async () => {
    const { data, error } = await supabase.rpc("budget_totals");
    if (error || !data) {
      throw error ?? new Error("budget_totals returned no data");
    }
    const row = Array.isArray(data) ? data[0] : data;
    const next: BudgetTotals = {
      totalBudget: Number(row.total_budget) || 0,
      totalProjectsBudget: Number(row.total_projects_budget) || 0,
      totalOtherSpending: Number(row.total_other_spending) || 0,
      sourceCount: Number(row.source_count) || 0,
      projectCount: Number(row.project_count) || 0,
      expenseCount: Number(row.expense_count) || 0
    };
    totals = next;
    totalsFetchedAt = Date.now();
    return next;
  })();

  try {
    return await totalsInFlight;
  } finally {
    totalsInFlight = null;
  }
}

// ---------------------------------------------------------------------
// Full row lists — only fetched when a card is actually expanded, and
// cached after that so collapsing/re-expanding doesn't refetch.
// ---------------------------------------------------------------------
export function getCachedSources() {
  return sourcesCache;
}
export async function fetchSources(force = false): Promise<BudgetSource[]> {
  if (!force && sourcesCache) return sourcesCache;
  const { data, error } = await supabase
    .from("budget_sources")
    .select("*")
    .order("date_received", { ascending: false })
    .limit(LIST_LIMIT);
  if (error || !data) throw error ?? new Error("Failed to load budget sources");
  sourcesCache = data as BudgetSource[];
  return sourcesCache;
}

export function getCachedExpenses() {
  return expensesCache;
}
export async function fetchExpenses(force = false): Promise<Expense[]> {
  if (!force && expensesCache) return expensesCache;
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date_spent", { ascending: false })
    .limit(LIST_LIMIT);
  if (error || !data) throw error ?? new Error("Failed to load expenses");
  expensesCache = data as Expense[];
  return expensesCache;
}

export function getCachedProjects() {
  return projectsCache;
}
export async function fetchProjects(force = false): Promise<Project[]> {
  if (!force && projectsCache) return projectsCache;
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (error || !data) throw error ?? new Error("Failed to load projects");
  projectsCache = data as Project[];
  return projectsCache;
}

// Call after any admin write, or on a manual refresh, so the next read
// goes back to the network instead of serving stale cached data.
export function invalidateBudgetCache() {
  totals = null;
  totalsFetchedAt = 0;
  sourcesCache = null;
  expensesCache = null;
  projectsCache = null;
}
