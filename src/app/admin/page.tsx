"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, Users } from "lucide-react";
import { UserManagement } from "@/components/admin/UserManagement";

export default function AdminPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setIsAdmin(false);
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setIsAdmin(prof?.role === "admin");
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isAdmin === null)
    return <div className="py-12 text-center text-slate-400">Verifying clearance...</div>;

  if (!isAdmin) {
    return (
      <div className="glass-panel mx-auto max-w-lg rounded-2xl p-8 text-center">
        <Shield className="mx-auto h-10 w-10 text-amber-400" />
        <h1 className="mt-3 text-xl font-bold text-white">Admin Clearance Required</h1>
        <p className="mt-2 text-sm text-slate-400">
          Promote your user role to <code>admin</code> in Supabase <code>public.profiles</code> to
          access the Admin Console.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Console</h1>
          <p className="text-sm text-slate-400">
            Manage player accounts, points, and access
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
        <Users className="h-4 w-4" />
        Players
      </div>

      <UserManagement />
    </div>
  );
}
