import { randomBytes } from "crypto";
import { MASTER_OPTIONS, SERVICE_OPTIONS } from "./validation-core";

export function getSalonInfo() {
  return {
    name: "Студия Престиж",
    tagline: "Красота в каждой детали",
    description:
      "Профессиональные стрижки, окрашивание и уход за волосами в уютной атмосфере.",
    workingHours: "ежедневно 09:00-21:00",
    phone: "+7 900 123-45-67",
    email: "hello@parih.svoiprox.pro",
    address: "г. Москва, ул. Центральная, 15",
    benefits: ["Опытные мастера", "Качественная косметика", "Забота о каждом клиенте"]
  };
}

export function getPublicServices() {
  return SERVICE_OPTIONS.map((service) => ({
    icon: service.icon,
    title: service.title,
    price: service.price,
    priceLabel: service.priceLabel,
    duration: service.duration,
    durationLabel: service.durationLabel,
    description: service.description
  }));
}

export function getPublicMasters() {
  return MASTER_OPTIONS.map((master) => ({
    name: master.name,
    role: master.role,
    experience: master.experience,
    workDays: master.workDays,
    workDaysLabel: master.workDaysLabel,
    tags: master.tags,
    image: master.image
  }));
}

export function createPublicToken() {
  return randomBytes(32).toString("hex");
}
