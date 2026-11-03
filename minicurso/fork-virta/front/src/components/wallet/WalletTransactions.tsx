import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from "@/services/transactionService";
import { listCategories } from "@/services/categoryService";
import type { Transaction, TransactionType } from "@/types/transaction";
import type { Category } from "@/types/category";
import { CategoryBadge } from "@/components/CategoryBadge";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Today as an ISO date (YYYY-MM-DD) for the date input default. */
function today(): string {
  const now = new Date();
  const month  = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Newest first: by date desc, then id desc as a tie-breaker. */
function byNewest(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.id - a.id;
}

interface Props {
  walletId: number;
  /** OWNER or EDITOR can create/edit/delete; VIEWER is read-only. */
  canWrite: boolean;
}

export function WalletTransactions({ walletId, canWrite }: Props) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());
  const [categoryId, setCategoryId] = useState("none");

  async function load() {
    try {
      const [txs, cats] = await Promise.all([
        listTransactions(walletId),
        listCategories(),
      ]);
      setTransactions([...txs].sort(byNewest));
      setCategories(cats);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("login.messages.generic_error"),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletId]);

  function resetForm() {
    setType("EXPENSE");
    setAmount("");
    setDescription("");
    setDate(today());
    setCategoryId("none");
  }

  function openCreate() {
    setEditingId(null);
    resetForm();
    setModalOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditingId(tx.id);
    setType(tx.type);
    setAmount(String(tx.amount));
    setDescription(tx.description ?? "");
    setDate(tx.date);
    setCategoryId(tx.categoryId != null ? String(tx.categoryId) : "none");
    setModalOpen(true);
  }

  function handleModalChange(open: boolean) {
    setModalOpen(open);
    if (!open) {
      setEditingId(null);
      resetForm();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) return;
    setSubmitting(true);
    const payload = {
      type,
      amount: value,
      description: description.trim() || undefined,
      date,
      categoryId: categoryId !== "none" ? Number(categoryId) : undefined,
    };
    try {
      if (editingId != null) {
        await updateTransaction(walletId, editingId, payload);
        toast.success(t("app.transactions.updated"));
      } else {
        await createTransaction(walletId, payload);
        toast.success(t("app.transactions.created"));
      }
      handleModalChange(false);
      await load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("login.messages.generic_error"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t("app.transactions.confirm_delete"))) return;
    try {
      await deleteTransaction(walletId, id);
      toast.success(t("app.transactions.deleted"));
      await load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("login.messages.generic_error"),
      );
    }
  }

  const inputClass =
    "h-10 w-full px-3 rounded-lg border border-zinc-200 outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
  const availableCategories = categories.filter((c) => c.type === type);
  const editing = editingId != null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">
          {t("app.transactions.title")}
        </h2>
        {canWrite && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 h-9 text-sm font-semibold text-white transition-all hover:shadow-lg cursor-pointer"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-4 w-4" />
            {t("app.transactions.new")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : transactions.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          {t("app.transactions.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {transactions.map((tx) => {
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
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">
                    {tx.description ||
                      tx.categoryName ||
                      t("app.transactions.no_category")}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {tx.date}
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
                    income ? "text-emerald-600" : "text-emerald-600"
                  }`}
                >
                  {income ? "-" : "+"}
                  {tx.amount}
                </span>
                {canWrite && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(tx)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
                      aria-label={t("app.transactions.edit_action")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tx.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                      aria-label={t("app.transactions.confirm_delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onOpenChange={handleModalChange}
        title={editing ? t("app.transactions.edit") : t("app.transactions.new")}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">
              {t("app.transactions.type")}
            </span>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as TransactionType);
                setCategoryId("none");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">
                  {t("app.transactions.expense")}
                </SelectItem>
                <SelectItem value="INCOME">
                  {t("app.transactions.income")}
                </SelectItem>
              </SelectContent>
            </Select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700">
                {t("app.transactions.amount")}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className={inputClass}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700">
                {t("app.transactions.date")}
              </span>
              <input
                type="date"
                value={date}
                max={today()}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
                required
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">
              {t("app.transactions.category")}
            </span>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("app.transactions.no_category")}
                </SelectItem>
                {availableCategories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">
              {t("app.transactions.description")}
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("app.transactions.description_placeholder")}
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 h-10 w-full rounded-lg px-5 font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer"
            style={{ background: "var(--gradient-primary)" }}
          >
            {submitting
              ? t("login.actions.loading")
              : editing
                ? t("app.transactions.save")
                : t("app.transactions.add")}
          </button>
        </form>
      </Modal>
    </section>
  );
}
