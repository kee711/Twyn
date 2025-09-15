"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { SignInButton, useProfile } from "@farcaster/auth-kit";

export default function FarcasterConnect() {
  const [saving, setSaving] = useState(false);
  const { isAuthenticated, profile } = useProfile() as any;

  useEffect(() => {
    const autoSave = async () => {
      if (!isAuthenticated || !profile?.fid) return;
      setSaving(true);
      try {
        await axios.post("/api/farcaster/account", { fid: profile.fid, username: profile.username });
      } catch (e) {
        // no-op
      } finally {
        setSaving(false);
      }
    };
    autoSave();
  }, [isAuthenticated, profile?.fid]);

  return (
    <div className="space-y-2">
      <SignInButton />
      {isAuthenticated && (
        <div className="text-xs text-muted-foreground">
          연결됨: {profile?.username} (fid: {profile?.fid})
        </div>
      )}
    </div>
  );
}
