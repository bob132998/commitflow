import React, { useEffect, useRef, useState } from "react";
import { X, Copy, ExternalLink } from "lucide-react";
import { toast } from "react-toastify";

type Props = {
  id: string;
  open: boolean;
  onClose: () => void;
  dark?: boolean;
};

export default function InviteLinkModal({ id, open, onClose, dark }: Props) {
  const inviteToken = id;
  const inviteLink = `${window.location.origin}/?inviteToken=${inviteToken}`;

  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setCopied(false);
      // focus input for keyboard users
      setTimeout(() => inputRef.current?.focus(), 120);
      // trap focus briefly (simple)
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [open, onClose]);

  if (!open) return null;

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        // fallback: select & execCommand
        if (inputRef.current) {
          inputRef.current.select();
          document.execCommand("copy");
          window.getSelection()?.removeAllRanges();
        } else {
          throw new Error("Copy not supported");
        }
      }
      setCopied(true);
      toast.success("Invite link copied to clipboard");
      // reset copy state after a while so user can copy again
      setTimeout(() => setCopied(false), 2200);
    } catch (err: any) {
      console.error("copy failed", err);
      toast.error("Failed to copy link — please copy manually");
    }
  }

  // prevent modal close when clicking inside content
  function stop(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Invite link modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden
      />

      {/* Modal */}
      <div
        ref={modalRef}
        onClick={stop}
        className="relative z-10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-50 to-white dark:from-sky-900/20 dark:to-gray-900">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Invite Link
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Email failed to send — share this link manually
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
            Invite Link
          </label>

          <div className="flex gap-3 items-center">
            <input
              ref={inputRef}
              value={inviteLink}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 outline-none text-sm text-gray-800 dark:text-gray-100"
              aria-label="Invite link"
            />

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-medium hover:from-sky-600 hover:to-cyan-600 transition disabled:opacity-60"
              aria-pressed={copied}
            >
              <Copy size={14} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            You can paste the link into chat, email, or anywhere to invite the
            member. The link expires according to workspace settings.
          </p>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <a
                href={inviteLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <ExternalLink size={14} />
                Open Link
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  void handleCopy();
                  onClose();
                }}
                className="px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-slate-200 transition"
              >
                Copy & Close
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
          <span>Invite token:</span>
          <code className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
            {inviteToken}
          </code>
        </div>
      </div>
    </div>
  );
}
