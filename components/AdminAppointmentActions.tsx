"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const actions = [
  { status: "confirmed", label: "Подтвердить" },
  { status: "cancelled", label: "Отменить" },
  { status: "completed", label: "Выполнена" }
];

export function AdminAppointmentActions({ id }: { id: number }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: string) {
    setLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      setMessage("Не удалось изменить статус.");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  async function deleteAppointment() {
    const confirmed = window.confirm("Удалить заявку без восстановления?");
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/appointments/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setMessage("Не удалось удалить заявку.");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="admin-actions">
      {actions.map((action) => (
        <button
          disabled={loading}
          key={action.status}
          type="button"
          onClick={() => updateStatus(action.status)}
        >
          {action.label}
        </button>
      ))}
      <button className="danger" disabled={loading} type="button" onClick={deleteAppointment}>
        Удалить
      </button>
      {message ? <small>{message}</small> : null}
    </div>
  );
}
