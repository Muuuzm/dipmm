import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const salon = {
  id: 1,
  name: "Зеркала",
  subtitle: "парикмахерская в Северодвинске",
  tagline: "Стрижки без лишних слов",
  description:
    "Мужские и женские стрижки по предварительной записи. Дополнительно доступны услуги для волос, ногтей, бровей и ресниц.",
  workingHoursStart: "11:00",
  workingHoursEnd: "19:00",
  workingDaysLabel: "Вт-пт",
  weekendHoursStart: "11:00",
  weekendHoursEnd: "18:00",
  weekendDaysLabel: "Сб",
  phone: "+7 (900) 911-02-22",
  email: "",
  address: "г. Северодвинск, ул. Лебедева, 7А",
  heroImage:
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=88",
  aboutImage:
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=86",
  vkUrl: null,
  telegramUrl: null,
  whatsappUrl: null,
  mapUrl: "https://yandex.ru/maps/org/zerkala/3862380459/",
  latitude: 64.540552,
  longitude: 39.804762
};

const services = [
  ["mens-haircut", "scissors", "Мужская стрижка", 200, 40, "Классическая или короткая мужская стрижка с учетом пожеланий клиента.", true, true],
  ["womens-haircut", "sparkles", "Женская стрижка", 350, 60, "Женская стрижка с подбором формы и рекомендациями по домашнему уходу.", true, true],
  ["manicure", "hand", "Маникюр", 0, 90, "Маникюр и покрытие. Стоимость уточняется при записи.", true, false],
  ["massage", "activity", "Массаж", 0, 60, "Массажные процедуры. Стоимость и продолжительность уточняйте по телефону.", true, false],
  ["pedicure", "sparkles", "Педикюр", 0, 90, "Педикюр по предварительной записи. Стоимость уточняется по телефону.", true, false],
  ["brows-lashes", "eye", "Брови и ресницы", 0, 60, "Оформление бровей и ресниц по предварительной записи.", true, false],
  ["kids-haircut", "heart", "Детская стрижка", 700, 30, "Спокойный подход к маленьким гостям и быстрый аккуратный результат.", false, true],
  ["coloring", "palette", "Окрашивание", 3200, 120, "Мягкие переходы, стойкий цвет и бережная работа с качеством волос.", false, true],
  ["styling", "waves", "Укладка", 1100, 45, "Повседневные и вечерние образы с естественным объемом и фиксацией.", false, true],
  ["hair-care", "leaf", "Уходовые процедуры", 1800, 50, "Восстановление, питание и блеск для волос после диагностики мастера.", false, true]
].map(([slug, icon, title, price, duration, description, isActive, isBookable], index) => ({
  slug,
  icon,
  title,
  price,
  duration,
  description,
  isActive,
  isBookable,
  sortOrder: (index + 1) * 10
}));

const masters = [
  {
    slug: "anna-volkova",
    name: "Анна Волкова",
    role: "Парикмахер",
    experience: "Женские и мужские стрижки",
    bio: "Выполняет женские и мужские стрижки по предварительной записи.",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=85",
    tags: "женские стрижки|мужские стрижки",
    workDays: [2, 5],
    serviceSlugs: ["mens-haircut", "womens-haircut"]
  },
  {
    slug: "ilya-sokolov",
    name: "Илья Соколов",
    role: "Парикмахер, мужские стрижки",
    experience: "Основное направление — мужские стрижки",
    bio: "Выполняет мужские стрижки и помогает подобрать удобную повседневную форму.",
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=85",
    tags: "мужские стрижки",
    workDays: [3, 6],
    serviceSlugs: ["mens-haircut"]
  }
];

async function main() {
  await prisma.salonSettings.upsert({
    where: { id: 1 },
    update: { ...salon, id: undefined },
    create: salon
  });

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service
    });
  }

  const storedServices = await prisma.service.findMany();
  const serviceIds = new Map(storedServices.map((service) => [service.slug, service.id]));

  for (const [index, seed] of masters.entries()) {
    const master = await prisma.master.upsert({
      where: { slug: seed.slug },
      update: {
        name: seed.name,
        role: seed.role,
        experience: seed.experience,
        bio: seed.bio,
        image: seed.image,
        tags: seed.tags,
        isActive: true,
        sortOrder: (index + 1) * 10
      },
      create: {
        slug: seed.slug,
        name: seed.name,
        role: seed.role,
        experience: seed.experience,
        bio: seed.bio,
        image: seed.image,
        tags: seed.tags,
        sortOrder: (index + 1) * 10
      }
    });

    await prisma.weeklyShift.deleteMany({ where: { masterId: master.id } });
    await prisma.masterService.deleteMany({ where: { masterId: master.id } });

    for (const dayOfWeek of seed.workDays) {
      const shift = {
        startTime: "11:00",
        endTime: dayOfWeek === 6 ? "18:00" : "19:00"
      };
      await prisma.weeklyShift.upsert({
        where: { masterId_dayOfWeek: { masterId: master.id, dayOfWeek } },
        update: shift,
        create: { masterId: master.id, dayOfWeek, ...shift }
      });
    }

    for (const slug of seed.serviceSlugs) {
      const serviceId = serviceIds.get(slug);
      if (!serviceId) continue;
      await prisma.masterService.upsert({
        where: { masterId_serviceId: { masterId: master.id, serviceId } },
        update: {},
        create: { masterId: master.id, serviceId }
      });
    }
  }

  await prisma.master.updateMany({
    where: { slug: { notIn: masters.map((master) => master.slug) } },
    data: { isActive: false }
  });

  if ((await prisma.galleryItem.count()) === 0) {
    await prisma.galleryItem.createMany({
      data: [
        {
          image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=86",
          alt: "Мягкое окрашивание длинных волос",
          category: "Окрашивание",
          title: "Естественный переход цвета",
          sortOrder: 10
        },
        {
          image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=86",
          alt: "Мужская стрижка в барбершопе",
          category: "Мужской зал",
          title: "Чистая форма и текстура",
          sortOrder: 20
        },
        {
          image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=86",
          alt: "Укладка волос в салоне",
          category: "Укладка",
          title: "Легкий объем на каждый день",
          sortOrder: 30
        }
      ]
    });
  }

  if ((await prisma.review.count()) === 0) {
    await prisma.review.createMany({
      data: [
        { clientName: "Елена", text: "Очень бережное окрашивание и именно тот оттенок, который мы обсуждали. Волосы выглядят живыми и ухоженными.", serviceName: "Окрашивание", sortOrder: 10 },
        { clientName: "Алексей", text: "Записался онлайн за пару минут. Илья подсказал форму, которую легко поддерживать дома. Вернусь снова.", serviceName: "Мужская стрижка", sortOrder: 20 },
        { clientName: "Ольга", text: "Спокойная атмосфера, внимательный мастер и никакой спешки. Стрижка отлично лежит даже без сложной укладки.", serviceName: "Женская стрижка", sortOrder: 30 }
      ]
    });
  }

  await prisma.$executeRawUnsafe(`
    UPDATE Appointment
    SET serviceId = (SELECT id FROM Service WHERE Service.title = Appointment.service)
    WHERE serviceId IS NULL
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE Appointment
    SET masterId = (SELECT id FROM Master WHERE Master.name = Appointment.master)
    WHERE masterId IS NULL
  `);

  const appointments = await prisma.appointment.findMany({
    where: { masterId: { not: null }, status: { not: "cancelled" }, slots: { none: {} } },
    select: { id: true, masterId: true, date: true, time: true, duration: true }
  });

  for (const appointment of appointments) {
    const start = toMinutes(appointment.time);
    const slotCount = Math.ceil(Math.max(30, appointment.duration) / 30);
    await prisma.appointmentSlot.createMany({
      data: Array.from({ length: slotCount }, (_, index) => ({
        appointmentId: appointment.id,
        masterId: appointment.masterId,
        date: appointment.date,
        time: toTime(start + index * 30)
      }))
    });
  }
}

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(total) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
