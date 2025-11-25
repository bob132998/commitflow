// src/utils/invite.ts
export function getInviteTokenFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("inviteToken");
  } catch {
    return null;
  }
}

export function saveInviteToken(token: string | null) {
  if (!token) {
    localStorage.removeItem("inviteToken");
  } else {
    localStorage.setItem("inviteToken", token);
  }
}

export function readSavedInviteToken(): string | null {
  return localStorage.getItem("inviteToken");
}
