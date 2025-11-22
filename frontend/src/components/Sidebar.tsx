// frontend/src/components/Sidebar.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  Trash2,
  PlusCircle,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
} from "lucide-react";
import type { Project, TeamMember, Workspace } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import packageJson from "../../package.json";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TeamModal from "./TeamModal";
import TeamDetailModal from "./TeamDetailModal";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import * as api from "../api/projectApi";
import { playSound } from "../utils/playSound";
import CreateProjectModal from "./CreateProjectModal";

export default function Sidebar({
  workspaces,
  activeWorkspaceId,
  setActiveWorkspaceId,
  projects,
  activeProjectId,
  setActiveProjectId,
  addProject,
  team,
  removeTeamMember,
  addTeamMember,
  removeProject,
  onWorkspaceCreated,
  isPlaySound,
}: {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  addProject: (payload: any) => void;
  team: TeamMember[];
  removeTeamMember: (id: string) => void;
  addTeamMember: (m: TeamMember) => void;
  removeProject: (id: string) => void;
  onWorkspaceCreated?: (w: Workspace) => void;
  isPlaySound: boolean;
}) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return (
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark")
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    try {
      const obs = new MutationObserver(() => check());
      obs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => obs.disconnect();
    } catch {
      return () => {};
    }
  }, []);

  const [isLoaded, setIsLoaded] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [detailMember, setDetailMember] = useState<TeamMember | null>(null);
  const [addingProject, setAddingProject] = useState(false);
  const [openCreateProject, setOpenCreateProject] = useState(false);

  // collapse state
  const [collapsed, setCollapsed] = useState(false);

  // workspace-dropdown
  const [wsOpen, setWsOpen] = useState(false);
  const wsRef = useRef<HTMLDivElement | null>(null);

  // workspace modal state
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 300);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      playSound("/sounds/close.mp3", isPlaySound);
    }
  }, [showCreateTeam, showCreateWorkspace, collapsed, detailMember, isLoaded]);

  // click outside for workspace dropdown
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!wsRef.current) return;
      if (!wsRef.current.contains(e.target as Node)) setWsOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // fallback active workspace
  useEffect(() => {
    if (!workspaces || workspaces.length === 0) return;
    const exists = workspaces.some((w) => w.id === activeWorkspaceId);
    if (!exists) {
      setActiveWorkspaceId(workspaces[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaces]);

  const handleCreate = async (payload: any) => {
    if (!payload.name || !payload.description) {
      toast.dark("Please enter a project name & description");
      return;
    }
    if (
      projects.some((p) => p.name.toLowerCase() === payload.name.toLowerCase())
    ) {
      toast.dark("Project exists");
      return;
    }
    setAddingProject(true);
    addProject(payload);
    setAddingProject(false);
  };

  const handleRemoveProject = (id: string, name: string) => {
    Swal.fire({
      title: "Delete project?",
      text: `Project "${name}" and its tasks will be deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      background: "#111827",
      color: "#e5e7eb",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await api.deleteProjectApi(id);
        const newActive = projects.filter((p) => p.id !== id)[0]?.id ?? "";
        setActiveProjectId(newActive);
        Swal.fire({
          title: "Deleted!",
          text: `"${name}" has been removed.`,
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
          background: "#111827",
          color: "#e5e7eb",
        });

        removeProject(id);
      }
    });
  };

  // create workspace handler
  const handleCreateWorkspace = async (w: Workspace) => {
    setCreatingWorkspace(true);
    try {
      const payload = { name: w.name, description: w.description };
      const res = await api.createWorkspace(payload);
      const created =
        res && typeof res === "object" && "data" in res
          ? (res as any).data
          : res;
      if (onWorkspaceCreated) onWorkspaceCreated(created ?? w);
      const idToSet = created?.id ?? w.id;
      setActiveWorkspaceId(idToSet);
      setShowCreateWorkspace(false);
      // avoid forced reload often, but keep original behaviour if needed:
      // window.location.reload();
    } catch (err: any) {
      console.error("create workspace error", err);
      toast.dark(err?.message ?? "Failed to create workspace");
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const currentWorkspace =
    workspaces?.find((w) => w.id === activeWorkspaceId) ?? workspaces?.[0];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 320 }}
      className="flex-shrink-0 h-full bg-transparent border-r border-gray-100 dark:border-gray-800 flex flex-col"
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      aria-hidden={false}
    >
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar
        closeOnClick
        pauseOnHover
        draggable
        pauseOnFocusLoss
      />
      <div className="flex flex-col h-full">
        {/* top bar: logo + collapse btn */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src="logo.png"
              className="text-white"
              width={37}
              height={30}
              alt="logo"
            />
            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">CommitFlow</span>
                <span className="text-xs text-gray-400">.space</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* small hamburger for mobile */}
            <button
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setCollapsed((s) => !s)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
          </div>
        </div>

        {/* content */}
        <div className="flex-1 overflow-auto px-2">
          {/* workspace selector (custom) */}
          <div ref={wsRef} className="mb-4 px-1 relative">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setWsOpen((s) => !s)}
                className={`flex items-center gap-3 p-2 rounded-md transition-colors flex-1 min-w-0 ${
                  collapsed ? "justify-center" : ""
                } hover:bg-gray-100 dark:hover:bg-gray-800`}
                aria-haspopup="menu"
                aria-expanded={wsOpen}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    isDark
                      ? "bg-white/6 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {(currentWorkspace?.name ?? "W").slice(0, 2).toUpperCase()}
                </div>

                {!collapsed && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-medium truncate">
                        {currentWorkspace?.name ?? "No workspace"}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {currentWorkspace?.description ?? "Select workspace"}
                      </div>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                  </>
                )}
              </button>

              {/* add workspace quick button (icon only when collapsed) */}
              <button
                onClick={() => setShowCreateWorkspace(true)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Create workspace"
                aria-label="Create workspace"
              >
                <PlusCircle size={16} />
              </button>
            </div>

            <AnimatePresence>
              {wsOpen && !collapsed && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute left-1 right-3 mt-2 z-40 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md shadow-lg overflow-hidden"
                >
                  <div className="max-h-64 overflow-auto">
                    {workspaces && workspaces.length ? (
                      workspaces.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => {
                            setActiveWorkspaceId(w.id);
                            setWsOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            w.id === activeWorkspaceId
                              ? "bg-sky-50 dark:bg-sky-700/20"
                              : ""
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm bg-gray-100 dark:bg-white/6 text-gray-800 dark:text-white">
                            {w.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 truncate">
                            <div className="font-medium truncate">{w.name}</div>
                            <div className="text-xs text-gray-400 truncate">
                              {w.description ?? ""}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-400">
                        No workspace
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 p-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowCreateWorkspace(true);
                        setWsOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-1 rounded-md bg-sky-600 text-white text-sm"
                    >
                      <PlusCircle size={14} />
                      <span>Create</span>
                    </button>
                    <button
                      onClick={() => setWsOpen(false)}
                      className="ml-auto px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* projects header */}
          <div className="flex items-center justify-between px-1 mb-2">
            {!collapsed && <h4 className="font-semibold text-sm">Projects</h4>}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpenCreateProject(true)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Create project"
              >
                <PlusCircle size={16} />
              </button>
            </div>
          </div>

          {/* projects list */}
          <div className="space-y-2 mb-4">
            {projects.map((p) => {
              const active = p.id === activeProjectId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-2 py-2 rounded-md transition-all ${
                    active
                      ? "bg-sky-50 dark:bg-sky-700/20 ring-1 ring-sky-200 dark:ring-sky-700 text-sky-800 dark:text-sky-200"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <button
                    onClick={() => setActiveProjectId(p.id)}
                    className={`flex-1 text-left truncate ${
                      collapsed ? "hidden" : ""
                    }`}
                  >
                    <div className="text-sm font-medium truncate">{p.name}</div>
                  </button>

                  {/* when collapsed show initial as button */}
                  {collapsed && (
                    <button
                      onClick={() => setActiveProjectId(p.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gray-100 dark:bg-white/6"
                    >
                      {p.name.slice(0, 1).toUpperCase()}
                    </button>
                  )}

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => handleRemoveProject(p.id, p.name)}
                      title="Delete project"
                      className="p-1 rounded-md text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <CreateProjectModal
            isOpen={openCreateProject}
            onClose={() => setOpenCreateProject(false)}
            onCreate={handleCreate}
          />

          {/* team header */}
          <div className="flex items-center justify-between px-1 mb-2">
            {!collapsed && (
              <h4 className="font-semibold text-sm">
                Team{" "}
                <span className="text-xs text-gray-400">- {team.length}</span>
              </h4>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateTeam(true)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Add team member"
              >
                <UserPlus size={16} />
              </button>
            </div>
          </div>

          {/* team list */}
          <div className="space-y-2 mb-4">
            {team.map((member) => {
              const hue =
                (member.name || "a")
                  .split("")
                  .reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
              const avatarBg = isDark
                ? `hsla(${hue} 70% 50% / 0.16)`
                : `hsla(${hue} 75% 85% / 0.95)`;
              const textColor = isDark
                ? `hsl(${hue} 65% 80%)`
                : `hsl(${hue} 75% 25%)`;
              return (
                <div
                  key={member.id}
                  onClick={() => setDetailMember(member)}
                  className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
                    style={{ background: avatarBg, color: textColor }}
                  >
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name ?? "No Name"}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      (member.name ?? "No Name")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    )}
                  </div>
                  {!collapsed && (
                    <div className="text-sm truncate">{member.name}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* footer */}
        <motion.footer
          className="text-sm text-gray-400 flex flex-col items-center gap-1 pt-4 pb-5 px-4 border-t border-gray-100 dark:border-gray-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
        >
          <div className="flex items-center gap-2 text-xs w-full justify-between">
            <span className="font-medium">v{packageJson.version}</span>
            {!collapsed && (
              <span className="text-xs text-gray-400 hidden sm:inline">
                Developed by{" "}
                <strong className="font-semibold text-gray-600 dark:text-gray-200">
                  Getech Indonesia
                </strong>
              </span>
            )}
          </div>
          {collapsed ? (
            <div className="text-xs">Getech</div>
          ) : (
            <div className="sm:hidden text-center text-xs">
              Developed by{" "}
              <strong className="font-semibold">Getech Indonesia</strong>
            </div>
          )}
        </motion.footer>
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        open={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        onCreate={handleCreateWorkspace}
      />
      <TeamModal
        open={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
        onCreate={(m) => {
          addTeamMember(m);
          setShowCreateTeam(false);
        }}
      />
      <TeamDetailModal
        open={!!detailMember}
        member={detailMember ?? undefined}
        onClose={() => setDetailMember(null)}
        onDelete={(id) => {
          removeTeamMember(id);
          setDetailMember(null);
        }}
      />
    </motion.aside>
  );
}
