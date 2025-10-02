import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { createRepair } from "../../services/repairsApi";

const DEFAULT_FORM = {
  id_devices: "",
  title: "",
  issue_description: "",
  severity: "medium",
  priority: "normal",
  sla_hours: 24,
};

export default function CreateTicketDialog({ open, onOpenChange, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  const resetAndClose = () => {
    setForm(DEFAULT_FORM);
    onOpenChange(false);
  };

  const submit = async () => {
    setLoading(true);
    try {
      // TODO: thay reported_by bằng user id thật (từ auth)
      const payload = { ...form, reported_by: 1 };
      const res = await createRepair(payload);
      onCreated?.(res);
      resetAndClose();
    } catch (e) {
      console.error(e);
      alert("Tạo ticket thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(true); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" /> Tạo ticket sửa chữa
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1">Thiết bị (id)</Label>
            <Input
              className="col-span-3"
              placeholder="id_devices"
              value={form.id_devices}
              onChange={(e) => setForm({ ...form, id_devices: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1">Tiêu đề</Label>
            <Input
              className="col-span-3"
              placeholder="VD: Laptop không khởi động"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-2">
            <Label className="col-span-1 mt-2">Mô tả</Label>
            <Textarea
              className="col-span-3"
              rows={4}
              placeholder="Triệu chứng, khi nào xảy ra, đã thử gì…"
              value={form.issue_description}
              onChange={(e) => setForm({ ...form, issue_description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mức độ</Label>
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn mức độ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>SLA (giờ)</Label>
            <Input
              type="number"
              min={1}
              value={form.sla_hours}
              onChange={(e) => setForm({ ...form, sla_hours: Number(e.target.value) })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>Hủy</Button>
          <Button onClick={submit} disabled={loading} className="gap-2">
            {loading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
            Tạo ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
