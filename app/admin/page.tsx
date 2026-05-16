"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  username: string;
  email: string | null;
  name: string;
  role: "admin" | "user";
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const meResponse = await fetch("/api/me");
      if (!meResponse.ok) {
        router.push("/login?callbackUrl=/admin");
        return;
      }

      const meData = await meResponse.json();
      setCurrentUser(meData.user);

      if (meData.user.role !== "admin") {
        setError("Admin access required.");
        setStatus("ready");
        return;
      }

      const usersResponse = await fetch("/api/admin/users");
      const data = await usersResponse.json();
      if (Array.isArray(data)) setUsers(data);
      else setError(data.error ?? "Could not load users.");
      setStatus("ready");
    }

    load();
  }, [router]);

  if (status === "loading") return <main className="min-h-screen bg-black p-6 text-white">Loading...</main>;

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black">Admin Panel</h1>
            <p className="text-zinc-400">Signed in as {currentUser?.name ?? "User"}. Manage ViperLink users and roles.</p>
          </div>
          <Link href="/" className="rounded-xl bg-zinc-800 px-4 py-2 font-semibold hover:bg-zinc-700">Dashboard</Link>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <table className="w-full border-collapse bg-zinc-950 text-left text-sm">
              <thead className="bg-zinc-900 text-zinc-300">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-zinc-800">
                    <td className="p-4 font-semibold">{user.name}</td>
                    <td className="p-4 text-zinc-300">{user.username}</td>
                    <td className="p-4 text-zinc-400">{user.email ?? "—"}</td>
                    <td className="p-4"><span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-200">{user.role}</span></td>
                    <td className="p-4 text-zinc-500">{new Date(user.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
