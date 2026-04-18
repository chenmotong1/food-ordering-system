"use client";

import { useEffect, useState, useCallback } from "react";
import { useUserStore } from "@/store/userStore";
import { cn, maskPhone } from "@/lib/utils";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface UserInfo {
  id: string;
  username: string;
  phone: string;
  role: string;
  points: number;
  memberLevel: string;
  createdAt: string;
}

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin: { label: "管理员", cls: "bg-red-100 text-red-700" },
  manager: { label: "经理", cls: "bg-blue-100 text-blue-700" },
  employee: { label: "员工", cls: "bg-green-100 text-green-700" },
  customer: { label: "顾客", cls: "bg-gray-100 text-gray-600" },
};

const ROLES = [
  { value: "customer", label: "顾客" },
  { value: "employee", label: "员工" },
  { value: "manager", label: "经理" },
  { value: "admin", label: "管理员" },
];

export default function AdminRolesPage() {
  const { user } = useUserStore();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [changedRoles, setChangedRoles] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users?limit=100");
      const data = await res.json();
      if (data.success) setUsers(data.data.items || data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleSelect = (userId: string, role: string) => {
    setChangedRoles((prev) => ({ ...prev, [userId]: role }));
  };

  const saveRole = async (userId: string) => {
    const newRole = changedRoles[userId];
    if (!newRole) return;

    if (userId === user?.id && newRole !== "admin") {
      toast.error("不能降级自己的管理员权限");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("角色已更新");
        setChangedRoles((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        fetchUsers();
      } else {
        toast.error(data.error?.message || "更新失败");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">角色管理</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          修改用户角色后立即生效
        </p>
      </div>

      <div className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>当前角色</TableHead>
              <TableHead>修改为</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-6 bg-gray-100 animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-[var(--color-text-muted)]">
                  暂无用户数据
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const badge = ROLE_BADGE[u.role] || { label: u.role, cls: "bg-gray-100" };
                const pendingRole = changedRoles[u.id];
                const isSelf = u.id === user?.id;

                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.username}
                      {isSelf && (
                        <span className="ml-1 text-[10px] text-[var(--color-primary)]">(当前)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[var(--color-text-muted)]">
                      {maskPhone(u.phone)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px]", badge.cls)}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={pendingRole || u.role}
                        onValueChange={(v) => { if (v !== null) handleRoleSelect(u.id, v) }}
                      >
                        <SelectTrigger className="h-8 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      {pendingRole && pendingRole !== u.role ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => saveRole(u.id)}
                          disabled={saving}
                        >
                          确认修改
                        </Button>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
