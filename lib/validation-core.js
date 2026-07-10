export const SERVICE_OPTIONS = [
  {
    icon: "✂",
    title: "Мужская стрижка",
    price: 900,
    priceLabel: "от 900 ₽",
    duration: 40,
    durationLabel: "40 мин",
    description: "Чистая форма, аккуратная окантовка и укладка под ваш стиль."
  },
  {
    icon: "◇",
    title: "Женская стрижка",
    price: 1400,
    priceLabel: "от 1400 ₽",
    duration: 60,
    durationLabel: "60 мин",
    description: "Подбор силуэта, консультация по уходу и легкая финальная укладка."
  },
  {
    icon: "♡",
    title: "Детская стрижка",
    price: 700,
    priceLabel: "от 700 ₽",
    duration: 30,
    durationLabel: "30 мин",
    description: "Спокойный подход к маленьким гостям и быстрый аккуратный результат."
  },
  {
    icon: "●",
    title: "Окрашивание",
    price: 3200,
    priceLabel: "от 3200 ₽",
    duration: 120,
    durationLabel: "120 мин",
    description: "Мягкие переходы, стойкий цвет и бережная работа с качеством волос."
  },
  {
    icon: "≋",
    title: "Укладка",
    price: 1100,
    priceLabel: "от 1100 ₽",
    duration: 45,
    durationLabel: "45 мин",
    description: "Повседневные и вечерние образы с естественным объемом и фиксацией."
  },
  {
    icon: "✦",
    title: "Уходовые процедуры",
    price: 1800,
    priceLabel: "от 1800 ₽",
    duration: 50,
    durationLabel: "50 мин",
    description: "Восстановление, питание и блеск для волос после диагностики мастера."
  }
];

export const MASTER_OPTIONS = [
  {
    name: "Анна Волкова",
    role: "Колорист, стилист",
    experience: "8 лет опыта",
    workDays: [1, 3, 5, 6],
    workDaysLabel: "понедельник, среда, пятница, суббота",
    tags: ["окрашивание", "уход", "женские стрижки"],
    image:
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=85"
  },
  {
    name: "Илья Соколов",
    role: "Барбер, мужские стрижки",
    experience: "6 лет опыта",
    workDays: [2, 4, 6, 0],
    workDaysLabel: "вторник, четверг, суббота, воскресенье",
    tags: ["барберинг", "борода", "мужские стрижки"],
    image:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=85"
  },
  {
    name: "Мария Орлова",
    role: "Стилист",
    experience: "5 лет опыта",
    workDays: [1, 2, 4, 5],
    workDaysLabel: "понедельник, вторник, четверг, пятница",
    tags: ["укладки", "уход", "стрижки"],
    image:
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=900&q=85"
  }
];

export const SERVICES = SERVICE_OPTIONS.map((service) => service.title);
export const MASTERS = MASTER_OPTIONS.map((master) => master.name);

export function getServiceByTitle(title) {
  return SERVICE_OPTIONS.find((service) => service.title === title);
}

export function getMasterByName(name) {
  return MASTER_OPTIONS.find((master) => master.name === name);
}

export function normalizeAppointmentCore(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Некорректные данные формы.");
  }

  const service = getServiceByTitle(readString(payload.service));
  const appointment = {
    name: readString(payload.name),
    phone: readString(payload.phone),
    service: readString(payload.service),
    master: readString(payload.master),
    date: readString(payload.date),
    time: readString(payload.time),
    duration: readNumber(payload.duration) || service?.duration || 0,
    price: readNumber(payload.price) || service?.price,
    comment: readString(payload.comment, false)
  };

  const requiredFields = ["name", "phone", "service", "master", "date", "time"];
  const emptyField = requiredFields.find((field) => !appointment[field]);
  if (emptyField) {
    throw new Error("Заполните все обязательные поля.");
  }

  if (!/^\+?[0-9\s\-()]{7,20}$/.test(appointment.phone)) {
    throw new Error("Введите корректный номер телефона.");
  }

  if (!service) {
    throw new Error("Выберите услугу из списка.");
  }

  if (!getMasterByName(appointment.master)) {
    throw new Error("Выберите мастера из списка.");
  }

  if (!appointment.duration || appointment.duration < 1) {
    throw new Error("Некорректная длительность услуги.");
  }

  return appointment;
}

function readString(value, required = true) {
  if (typeof value !== "string") {
    return required ? "" : "";
  }

  return value.trim().slice(0, 500);
}

function readNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
  }

  return undefined;
}
