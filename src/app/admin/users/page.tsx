"use client";

import { useEffect, useState, useCallback } from "react";
import { useUserStore } from "@/store/userStore";
import { cn, formatPrice } from "@/lib/utils";
import { MEMBER_LEVEL_MAP } from "@/types";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { maskPhone } from "@/lib/utils";

interface UserInfo {
  id: string;
  username: string;
  phone: string;
  role: string;
  points: number;
  memberLevel: string;
  createdAt: string;
  _count?: { orders: number };
}

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin: { label: "管理员", cls: "bg-red-100 text-red-700" },
  manager: { label: "经理", cls: "bg-blue-100 text-blue-700" },
  employee: { label: "员工", cls: "bg-green-100 text-green-700" },
  customer: { label: "顾客", cls: "bg-gray-100 text-gray-600" },
};

const ROLES = ["customer", "employee", "manager", "admin"];

export default function AdminUsersPage() {
  const { user } = useUserStore();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleTarget, setRoleTarget] = useState<UserInfo | null>(null);
  const [newRole, setNewRole] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "admin";

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

  const handleRoleChange = async () => {
    if (!roleTarget || !newRole) return;
    if (roleTarget.id === user?.id && newRole !== "admin") {
      toast.error("不能降级自己的管理员权限");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${roleTarget.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("角色已更新");
        setRoleTarget(null);
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
      <div className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>会员等级</TableHead>
              <TableHead className="text-right">积分</TableHead>
              <TableHead className="text-right">注册时间</TableHead>
              {isAdmin && <TableHead className="text-right">操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(isAdmin ? 7 : 6)].map((_, j) => (
                    <TableCell key={j}><div className="h-6 bg-gray-100 animate-pulse rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-[var(--color-text-muted)]">
                  暂无用户数据
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const badge = ROLE_BADGE[u.role] || { label: u.role, cls: "bg-gray-100 text-gray-500" };
                const member = MEMBER_LEVEL_MAP[u.memberLevel];
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell className="text-[var(--color-text-muted)]">{maskPhone(u.phone)}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px]", badge.cls)}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-sm", member?.color || "")}>
                        {member?.label || u.memberLevel}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{u.points}</TableCell>
                    <TableCell className="text-right text-sm text-[var(--color-text-muted)]">
                      {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            setRoleTarget(u);
                            setNewRole(u.role);
                          }}
                        >
                          修改角色
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Role Change Dialog */}
      <Dialog open={!!roleTarget} onOpenChange={() => setRoleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改用户角色</DialogTitle>
            <DialogDescription>
              将「{roleTarget?.username}」的角色从
              「{ROLE_BADGE[roleTarget?.role || ""]?.label}」修改为：
            </DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={(v) => { if (v !== null) setNewRole(v) }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_BADGE[r]?.label || r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleTarget(null)}>取消</Button>
            <Button onClick={handleRoleChange} disabled={saving}>
              {saving ? "保存中..." : "确认修改"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
