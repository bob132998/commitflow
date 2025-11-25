// src/hooks/useProcessInvite.ts
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { readSavedInviteToken, saveInviteToken } from "../utils/invite";
import { acceptInviteTeamMember } from "../api/projectApi";
import { useAuthStore } from "../utils/store";

export function useProcessInvite() {
  const [processing, setProcessing] = useState(false);

  const processInviteIfAny = useCallback(async () => {
    if (processing) return;

    const inviteToken = readSavedInviteToken();
    if (!inviteToken) return null;

    const { token: sessionToken } = useAuthStore.getState();
    const isLoggedIn = Boolean(sessionToken);

    // If user not logged in, wait until login/register
    if (!isLoggedIn) {
      return { skipped: true };
    }

    try {
      setProcessing(true);

      const resp = await acceptInviteTeamMember(inviteToken);

      if (!resp || resp.success === false) {
        toast.error(resp?.message || "Invite link expired or invalid.");
        saveInviteToken(null);
        return { success: false, resp };
      }

      // success true
      if (resp.user) {
        // The backend already added the user to the team
        toast.success("You have been added to the team!");
        saveInviteToken(null);

        // redirect user (pure JS)
        window.location.href = "/";
        return { success: true, user: resp.user };
      } else {
        // user not registered yet
        toast.info("Please complete registration to join the team.");

        // redirect to register using JS
        window.location.href = "/";
        return { success: true, user: null };
      }
    } catch (err: any) {
      console.error("processInvite error", err);
      toast.error(err?.message || "Failed to accept invite");
      return { error: err };
    } finally {
      setProcessing(false);
    }
  }, [processing]);

  return { processInviteIfAny, processing };
}
