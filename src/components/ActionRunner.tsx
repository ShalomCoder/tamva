import { useCallback, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useToast } from "../lib/toast";
import { humanizeKey, titleCase } from "../lib/format";
import type { ActionContext, ActionDef } from "../lib/resources";
import { Modal } from "./Modal";
import { DynamicForm, type FormValues } from "./DynamicForm";
import { Icon } from "./Icon";

interface PendingAction {
  action: ActionDef;
  ctx: ActionContext;
  onDone?: (result: unknown) => void;
}

export interface ActionRunner {
  run: (action: ActionDef, ctx: ActionContext, onDone?: (result: unknown) => void) => void;
  node: React.ReactNode;
}

/**
 * Central executor for every mutation in the app. Handles three shapes:
 *   - immediate call (no fields, no confirm)
 *   - confirm dialog   (confirm text, no fields)
 *   - form modal       (declared fields)
 * and surfaces one-time secrets returned by the API.
 */
export function useActionRunner(): ActionRunner {
  const toast = useToast();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<{ title: string; label: string; value: string } | null>(null);

  const execute = useCallback(
    async (action: ActionDef, ctx: ActionContext) => {
      setBusy(true);
      try {
        const path = action.buildPath(ctx);
        const result = await api.post(path, ctx.values ?? {});
        const revealKey = action.reveal;
        const payload = result as Record<string, unknown> | null;
        if (revealKey && payload && typeof payload[revealKey] === "string") {
          setRevealed({ title: action.label, label: humanizeKey(revealKey), value: String(payload[revealKey]) });
        } else {
          toast.success(action.successMessage ?? `${action.label} completed.`);
        }
        pending?.onDone?.(result);
        setPending(null);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "The action could not be completed.";
        toast.error(message);
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toast, pending],
  );

  const run = useCallback(
    (action: ActionDef, ctx: ActionContext, onDone?: (result: unknown) => void) => {
      const next: PendingAction = { action, ctx, onDone };
      if (action.fields && action.fields.length > 0) {
        setPending(next);
        return;
      }
      if (action.confirm) {
        setPending({ ...next, action: { ...action, fields: [] } });
        return;
      }
      void execute(action, ctx);
    },
    [execute],
  );

  let node: React.ReactNode = null;

  if (pending) {
    const { action, ctx } = pending;
    const hasFields = !!action.fields && action.fields.length > 0;

    if (!hasFields && action.confirm) {
      node = (
        <Modal
          title={action.label}
          onClose={() => setPending(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setPending(null)} disabled={busy}>
                Cancel
              </button>
              <button
                className={`btn ${action.danger ? "btn-danger" : "btn-primary"}`}
                onClick={() => void execute(action, ctx)}
                disabled={busy}
              >
                {busy ? "Working…" : action.label}
              </button>
            </>
          }
        >
          <p className="text-secondary">{action.confirm}</p>
        </Modal>
      );
    } else {
      node = (
        <Modal title={action.label} onClose={() => setPending(null)} width={520}>
          <DynamicForm
            fields={action.fields ?? []}
            busy={busy}
            submitLabel={action.label}
            onCancel={() => setPending(null)}
            onSubmit={(values: FormValues) => execute(action, { ...ctx, values })}
          />
        </Modal>
      );
    }
  }

  if (revealed) {
    node = (
      <Modal
        title={`${revealed.title} — one-time value`}
        onClose={() => setRevealed(null)}
        footer={
          <button className="btn btn-primary" onClick={() => setRevealed(null)}>
            Done
          </button>
        }
      >
        <p className="text-secondary" style={{ marginBottom: 12 }}>
          Copy this now — it will not be shown again.
        </p>
        <div className="reveal-box">
          <code>{revealed.value}</code>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              void navigator.clipboard?.writeText(revealed.value);
            }}
          >
            <Icon name="copy" size={14} /> Copy
          </button>
        </div>
      </Modal>
    );
  }

  return { run, node };
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return titleCase("something went wrong");
}
