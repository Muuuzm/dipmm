export function normalizeAppointmentRequestCore(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Некорректные данные формы.");
  }

  const appointment = {
    name: readString(payload.name, 100),
    phone: readString(payload.phone, 30),
    service: readString(payload.service, 120),
    master: readString(payload.master, 120),
    date: readString(payload.date, 10),
    time: readString(payload.time, 5),
    comment: readString(payload.comment, 500, false)
  };

  if (!appointment.name || !appointment.phone || !appointment.service || !appointment.master || !appointment.date || !appointment.time) {
    throw new Error("Заполните все обязательные поля.");
  }
  if (!/^\+?[0-9\s\-()]{7,20}$/.test(appointment.phone)) {
    throw new Error("Введите корректный номер телефона.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment.date)) {
    throw new Error("Выберите корректную дату.");
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(appointment.time)) {
    throw new Error("Выберите корректное время.");
  }

  return appointment;
}

function readString(value, maxLength, required = true) {
  if (typeof value !== "string") return required ? "" : undefined;
  const normalized = value.trim().slice(0, maxLength);
  return normalized || (required ? "" : undefined);
}
