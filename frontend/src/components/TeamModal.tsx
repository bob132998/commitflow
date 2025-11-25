import React, { useState, useEffect } from "react";
import { X, UserPlus } from "lucide-react";
import type { TeamMember } from "../types";
import { toast } from "react-toastify";

function nameToHue(name = "") {
  return name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
}

export default function TeamModal({
  open,
  onClose,
  onCreate,
  dark,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (m: TeamMember & { password?: string }) => void;
  dark?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) setEmail("");
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      toast.dark("Please enter an email");
      return;
    }

    try {
      setIsLoading(true);
      const member: any = {
        id: Math.random().toString(36).slice(2, 9),
        email: trimmed,
      };

      onCreate(member);
      setEmail("");
      onClose();
    } catch (err: any) {
      console.error("invite failed", err);
      toast.dark(`Failed: ${err?.message || err}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
    >
      {/* Backdrop: only close when not loading */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/20 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-slate-100 dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-50 to-white dark:from-sky-900/20 dark:to-gray-900">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Add Team Member
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Invite a new team member
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => !isLoading && onClose()}
                aria-label="Close modal"
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X />
              </button>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="px-6 py-6 grid grid-cols-1 gap-6"
          >
            <div className="gap-5">
              <div className="flex-1 grid grid-cols-1 gap-3">
                <label className="block">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="text-sky-500 font-medium">Email</span>
                  </div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-600"
                    aria-label="Email"
                  />
                </label>
              </div>
            </div>

            {/* Footer actions (kept inside the form so submit works) */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => !isLoading && onClose()}
                className="px-4 py-2 rounded-lg border bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className={`group inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                  bg-gradient-to-r from-sky-500 to-cyan-500 text-white
                  hover:from-sky-600 hover:to-cyan-600
                  active:scale-95 transition-all duration-300
                  disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  "Sending Invite"
                ) : (
                  <>
                    <UserPlus
                      size={16}
                      className="transition-transform duration-300 group-hover:-rotate-6"
                    />
                    <span>Invite member</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
