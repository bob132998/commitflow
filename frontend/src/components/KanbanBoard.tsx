import React, { useMemo, useRef, useEffect, useState } from "react";
import type { Task, TeamMember } from "../types";
import { TaskCard } from "./TaskCard";

export default function KanbanBoard({
  columns,
  onDropTo,
  onDragStart,
  onSelectTask,
  team,
  currentMemberId,
  onDrag,
  onDragEnd,
  dragTaskId,
  dragPos,
  startPointerDrag,
}: {
  columns: { key: Task["status"]; title: string; items: Task[] }[];
  // allow optional insertIndex
  onDropTo: (
    s: Task["status"],
    draggedId?: string,
    insertIndex?: number
  ) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onSelectTask: (t: Task) => void;
  team: TeamMember[];
  currentMemberId?: string | null;
  onDrag: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  dragTaskId: string | null;
  dragPos: { x: number; y: number; width: number };
  startPointerDrag: (id: string, x: number, y: number, target: any) => void;
}) {
  const [onlyMine, setOnlyMine] = useState(false);
  const priorityAccent = (priority?: Task["priority"]) => {
    if (priority === "urgent") return "bg-red-500/80 dark:bg-red-500/80";
    if (priority === "medium") return "bg-amber-400/85 dark:bg-amber-400/70";
    return "bg-emerald-500/80 dark:bg-emerald-500/70";
  };

  const priorityPill = (priority?: Task["priority"]) => {
    if (priority === "urgent")
      return {
        label: "🔥 Urgent",
        classes:
          "bg-red-500/15 text-red-600 dark:bg-red-500/25 dark:text-red-300 border border-red-500/20",
      };
    if (priority === "medium")
      return {
        label: "⚡ Medium",
        classes:
          "bg-amber-400/15 text-amber-600 dark:bg-amber-400/25 dark:text-amber-300 border border-amber-400/20",
      };
    return {
      label: "🌿 Low",
      classes:
        "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-300 border border-emerald-500/20",
    };
  };

  const allTasks = useMemo(
    () =>
      columns.flatMap((c) =>
        c.items.map((it) => ({
          ...it,
          status: c.key,
        }))
      ),
    [columns]
  );

  const currentMember = useMemo(
    () => team.find((m) => String(m.id) === String(currentMemberId)),
    [team, currentMemberId]
  );
  const currentMemberName = currentMember?.name ?? null;

  const isAssignedToCurrent = (task: Task) => {
    const aid = (task as any).assigneeId ?? null;
    const aname = (task as any).assigneeName ?? null;

    if (aid && currentMemberId && String(aid) === String(currentMemberId))
      return true;
    if (
      currentMemberName &&
      aname &&
      String(aname).toLowerCase() === String(currentMemberName).toLowerCase()
    )
      return true;
    return false;
  };

  const assignedCount = useMemo(
    () =>
      allTasks.reduce(
        (acc, t) => (isAssignedToCurrent(t as Task) ? acc + 1 : acc),
        0
      ),
    [allTasks, currentMemberId, team]
  );

  // helper: compute insertIndex inside a column element for given clientY
  // helper robust: compute insert index inside column for given clientY
  const computeInsertIndex = (columnEl: HTMLElement, clientY: number) => {
    // get all cards in DOM order (must be actual card elements with data-task-id)
    const cards = Array.from(
      columnEl.querySelectorAll<HTMLElement>("[data-task-id]")
    );

    // if column is empty -> insert at 0
    if (!cards.length) return 0;

    // check each card midline (insert before first card whose midline is below pointer)
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i].getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (clientY < mid) return i;
    }

    // pointer is below all card midlines -> consider appending.
    // But ensure pointer is still inside the column visual area (not outside page)
    const lastRect = cards[cards.length - 1].getBoundingClientRect();
    const colRect = columnEl.getBoundingClientRect();

    // if pointer is below last card but still above column bottom -> append to end
    if (clientY >= lastRect.bottom && clientY <= colRect.bottom) {
      return cards.length;
    }

    // If pointer is further down (maybe column has extra padding or user dropped just outside),
    // still treat as append.
    if (clientY > colRect.bottom) {
      return cards.length;
    }

    // fallback: append
    return cards.length;
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100"></h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {columns.reduce((sum, c) => sum + c.items.length, 0)} tasks
          </div>

          <button
            type="button"
            onClick={() => setOnlyMine((v) => !v)}
            aria-pressed={onlyMine}
            title="Show only tasks assigned to you"
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors focus:outline-none ${
              onlyMine
                ? "bg-sky-600 text-white border border-sky-600 shadow-sm"
                : "bg-white text-slate-700 dark:bg-gray-800 dark:text-slate-100 border border-gray-200 dark:border-gray-700"
            }`}
          >
            {/* icon */}
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                onlyMine ? "bg-white/20" : "bg-sky-100 dark:bg-white/5"
              }`}
              aria-hidden
            >
              {/* small person icon (emoji keeps it simple) */}
              👤
            </span>

            <span className="whitespace-nowrap">Assigned to me</span>

            <span
              className={`inline-flex items-center justify-center ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                onlyMine ? "bg-white/20" : "bg-gray-100 dark:bg-white/5"
              }`}
            >
              {assignedCount}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {columns.map((col) => {
          const visibleItems = onlyMine
            ? col.items.filter((task) => isAssignedToCurrent(task))
            : col.items;

          return (
            <div key={col.key} className="rounded-lg min-h-[300px]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                  {col.title}
                </h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  total: {col.items.length}
                </span>
              </div>

              <div
                data-drop-key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dtId =
                    e.dataTransfer?.getData("text/plain") || undefined;

                  // compute insertIndex using event clientY and DOM order inside the column
                  const colEl = e.currentTarget as HTMLElement;
                  const idx = computeInsertIndex(colEl, e.clientY);

                  // call parent with insertIndex
                  onDropTo(col.key, dtId, idx);
                }}
                className="space-y-3 min-h-[800px] p-2 rounded-lg"
              >
                {visibleItems.map((task: Task) => {
                  const isBeingDragged =
                    dragTaskId !== null && task.id === dragTaskId;
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isBeingDragged={isBeingDragged}
                      dragPos={dragPos}
                      team={team}
                      onDragStart={onDragStart}
                      onDrag={onDrag}
                      onDragEnd={onDragEnd}
                      onSelectTask={onSelectTask}
                      startPointerDrag={startPointerDrag}
                      priorityAccent={priorityAccent}
                      priorityPill={priorityPill}
                    />
                  );
                })}

                {visibleItems.length === 0 && (
                  <div className="text-sm text-gray-400 py-6 text-center">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
