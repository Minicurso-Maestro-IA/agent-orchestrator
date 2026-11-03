import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Wallet as WalletIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { getSummary, listTransactions, subscribeToWalletEvents } from "@/services/transactionService";
import type { DashboardSummary, Transaction } from "@/types/transaction";
import { NoWalletSelected } from "@/components/wallet/NoWalletSelected";
import { CategoryBadge } from "@/components/CategoryBadge";
import { formatCurrency, formatDate, formatMonth } from "@/lib/format";

const FALLBACK_COLOR = "#a1a1aa";

const INCOME_COLOR = "#ef4444";
const EXPENSE_COLOR = "#10b981";

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedWallet, loading: loadingWallets } = useWallet();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const walletId = selectedWallet?.id ?? null;

  // Load summary + recent transactions whenever the selected wallet changes.
  useEffect(() => {
    if (walletId == null) {
      setSummary(null);
      setRecent([]);
      return;
    }
    setLoadingData(true);
    (async () => {
      try {
        const [s, txs] = await Promise.all([
          getSummary(walletId),
          listTransactions(walletId),
        ]);
        setSummary(s);
        const sorted = [...txs].sort((a, b) =>
          a.date !== b.date ? (a.date < b.date ? 1 : -1) : b.id - a.id,
        );
        setRecent(sorted.slice(0, 5));
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("login.messages.generic_error"),
        );
      } finally {
        setLoadingData(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletId, refreshKey]);

  useEffect(() => {
    if(walletId == null) return;
    return subscribeToWalletEvents(walletId, ()=> setRefreshKey((k)=> k+1));
  }, [walletId]);

  const chartData = useMemo(
    () =>
      (summary?.byMonth ?? []).map((m) => ({
        month: formatMonth(m.month),
        income: m.income,
        expense: m.expense,
      })),
    [summary],
  );

  if (loadingWallets) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          {t("app.dashboard.title")}
        </h1>
        <p className="text-sm text-zinc-600">
          {t("app.dashboard.greeting", { name: user?.name ?? "" })}
        </p>
      </header>

      {!selectedWallet ? (
        <NoWalletSelected />
      ) : loadingData || !summary ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          {/* Indicators */}
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              icon={<WalletIcon className="h-5 w-5" />}
              label={t("app.dashboard.balance")}
              value={formatCurrency(summary.balance)}
              tone="brand"
            />
            <MetricCard
              icon={<ArrowUpRight className="h-5 w-5" />}
              label={t("app.dashboard.income")}
              value={formatCurrency(summary.totalIncome)}
              tone="income"
            />
            <MetricCard
              icon={<ArrowDownRight className="h-5 w-5" />}
              label={t("app.dashboard.expense")}
              value={formatCurrency(summary.totalExpense)}
              tone="expense"
            />
          </div>

          {/* Chart */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              {t("app.dashboard.chart_title")}
            </h2>
            {chartData.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">
                {t("app.dashboard.no_transactions")}
              </p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} width={48} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar
                      dataKey="income"
                      name={t("app.dashboard.income")}
                      fill={INCOME_COLOR}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expense"
                      name={t("app.dashboard.expense")}
                      fill={EXPENSE_COLOR}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* By category */}
          {summary.byCategory.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">
                {t("app.dashboard.by_category")}
              </h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.byCategory}
                      dataKey="total"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {summary.byCategory.map((c) => (
                        <Cell
                          key={c.categoryId}
                          fill={c.categoryColor ?? FALLBACK_COLOR}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent transactions */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              {t("app.dashboard.recent")}
            </h2>
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                {t("app.dashboard.no_transactions")}
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {recent.map((tx) => {
                  const income = tx.type === "INCOME";
                  return (
                    <li key={tx.id} className="flex items-center gap-3 py-3">
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                          income
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {income ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {tx.description ||
                            tx.categoryName ||
                            t("app.transactions.no_category")}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-zinc-500">
                            {formatDate(tx.date)}
                          </span>
                          {tx.categoryName && (
                            <CategoryBadge
                              name={tx.categoryName}
                              color={tx.categoryColor}
                            />
                          )}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-semibold ${
                          income ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {income ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "brand" | "income" | "expense";
}) {
  const toneClasses: Record<typeof tone, string> = {
    brand: "bg-brand-500/10 text-brand-500",
    income: "bg-emerald-50 text-emerald-600",
    expense: "bg-red-50 text-red-600",
  };
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <div
          className={`grid h-9 w-9 place-items-center rounded-lg ${toneClasses[tone]}`}
        >
          {icon}
        </div>
        <span className="text-sm font-medium text-zinc-500">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
    </div>
  );
}
