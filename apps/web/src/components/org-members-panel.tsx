"use client";

import { startTransition, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  addOrganizationMember,
  updateOrganizationMemberRole,
  type OrganizationMemberRecord
} from "../lib/api";

type Role = "OWNER" | "ADMIN" | "OPERATOR";

export function OrgMembersPanel(props: {
  initialMembers: OrganizationMemberRecord[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(props.initialMembers);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("OPERATOR");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const payload = await addOrganizationMember({
        email,
        name,
        role
      });

      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setMembers((current) => {
        const withoutExisting = current.filter((member) => member.userId !== payload.member.userId);
        return [...withoutExisting, payload.member].sort((left, right) =>
          left.email.localeCompare(right.email)
        );
      });
      setResult(payload);
      setEmail("");
      setName("");
      setRole("OPERATOR");
      startTransition(() => router.refresh());
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Member add failed.";
      setError(message);
      setResult({ ok: false, error: message });
    } finally {
      setPending(false);
    }
  }

  async function handleRoleChange(userId: string, nextRole: Role) {
    setPending(true);
    setError(null);

    try {
      const payload = await updateOrganizationMemberRole({
        userId,
        role: nextRole
      });

      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setMembers((current) =>
        current.map((member) =>
          member.userId === userId ? { ...member, role: payload.member.role } : member
        )
      );
      setResult(payload);
      startTransition(() => router.refresh());
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Role update failed.";
      setError(message);
      setResult({ ok: false, error: message });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {props.canManage ? (
        <form
          onSubmit={handleAddMember}
          className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 md:grid-cols-[1.4fr_1.2fr_0.9fr_auto]"
        >
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Email"
            required
            className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            type="text"
            placeholder="Name"
            className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
            className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="OWNER">OWNER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="OPERATOR">OPERATOR</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-5 py-3 text-sm text-emerald-100 transition hover:border-emerald-200/50 disabled:opacity-60"
          >
            {pending ? "Adding..." : "Add Member"}
          </button>
        </form>
      ) : (
        <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
          Only organization owners can add members or change roles.
        </div>
      )}

      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
        <div className="grid grid-cols-[1.4fr_1.2fr_0.8fr_1fr] gap-3 border-b border-white/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>Email</span>
          <span>Name</span>
          <span>Role</span>
          <span>Actions</span>
        </div>
        {members.map((member) => (
          <div
            key={member.userId}
            className="grid grid-cols-[1.4fr_1.2fr_0.8fr_1fr] gap-3 border-b border-white/5 px-5 py-4 text-sm text-slate-200 last:border-b-0"
          >
            <span className="break-all text-white">{member.email}</span>
            <span>{member.name ?? "Unnamed user"}</span>
            <span className="text-emerald-300">{member.role}</span>
            <div>
              {props.canManage ? (
                <select
                  value={member.role}
                  disabled={pending}
                  onChange={(event) => handleRoleChange(member.userId, event.target.value as Role)}
                  className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="OWNER">OWNER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OPERATOR">OPERATOR</option>
                </select>
              ) : (
                <span className="text-slate-500">Read only</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      {result ? (
        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
