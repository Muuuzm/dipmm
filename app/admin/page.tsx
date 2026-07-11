import Link from "next/link";
import { AdminAppointmentActions } from "@/components/AdminAppointmentActions";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import {
  buildAppointmentWhere,
  formatCurrency,
  formatDateTime,
  getMonthEnd,
  getMonthStart,
  getTodayValue,
  getWeekEnd,
  getWeekStart,
  parseAppointmentFilters,
  STATUS_LABELS
} from "@/lib/admin-data";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdminSession();

  const rawSearchParams = await searchParams;
  const params = toURLSearchParams(rawSearchParams);
  const filters = parseAppointmentFilters(params);
  const where = buildAppointmentWhere(filters);
  const today = getTodayValue();
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const monthStart = getMonthStart();
  const monthEnd = getMonthEnd();
  const calendarDate = getSingleValue(rawSearchParams.calendarDate) || today;

  const [
    appointments,
    todayCount,
    weekCount,
    monthCount,
    newCount,
    monthRevenueAgg,
    serviceGroups,
    masterGroups,
    calendarAppointments,
    masters,
    services
  ] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: [{ date: "desc" }, { time: "asc" }]
    }),
    prisma.appointment.count({ where: { date: today } }),
    prisma.appointment.count({ where: { date: { gte: weekStart, lte: weekEnd } } }),
    prisma.appointment.count({ where: { date: { gte: monthStart, lte: monthEnd } } }),
    prisma.appointment.count({ where: { status: "new" } }),
    prisma.appointment.aggregate({
      where: { date: { gte: monthStart, lte: monthEnd }, status: "completed" },
      _sum: { price: true }
    }),
    prisma.appointment.groupBy({
      by: ["service"],
      where: { date: { gte: monthStart, lte: monthEnd }, status: { not: "cancelled" } },
      _count: { service: true },
      orderBy: { _count: { service: "desc" } },
      take: 1
    }),
    prisma.appointment.groupBy({
      by: ["master"],
      where: { date: { gte: monthStart, lte: monthEnd }, status: { not: "cancelled" } },
      _count: { master: true },
      orderBy: { _count: { master: "desc" } },
      take: 1
    }),
    prisma.appointment.findMany({
      where: { date: calendarDate, status: { not: "cancelled" } },
      orderBy: [{ master: "asc" }, { time: "asc" }]
    }),
    prisma.master.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.service.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })
  ]);

  const exportQuery = params.toString();
  const groupedCalendar = groupByMaster(calendarAppointments);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <span className="section-badge">Администрирование</span>
          <h1>Панель администратора</h1>
          <p>Управление заявками и расписанием парикмахерской.</p>
        </div>
        <div className="admin-header-actions">
          <Link className="admin-top-button" href="/admin/catalog">
            Каталог
          </Link>
          <Link className="admin-top-button" href="/">
            На сайт
          </Link>
          <AdminLogoutButton />
        </div>
      </header>

      <section className="admin-stats-grid">
        <StatCard label="Заявок сегодня" value={todayCount} />
        <StatCard label="Заявок за неделю" value={weekCount} />
        <StatCard label="Заявок за месяц" value={monthCount} />
        <StatCard label="Новых заявок" value={newCount} />
        <StatCard label="Выручка за месяц" value={formatCurrency(monthRevenueAgg._sum.price)} />
        <StatCard
          label="Популярная услуга"
          value={serviceGroups[0]?.service ?? "Нет данных"}
        />
        <StatCard
          label="Самый загруженный мастер"
          value={masterGroups[0]?.master ?? "Нет данных"}
        />
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2>Заявки</h2>
            <p>Фильтруйте, подтверждайте и экспортируйте записи клиентов.</p>
          </div>
          <a
            className="button button-primary"
            href={`/api/admin/appointments/export${exportQuery ? `?${exportQuery}` : ""}`}
          >
            Экспорт CSV
          </a>
        </div>

        <form className="admin-filters" action="/admin">
          <label>
            Поиск
            <input name="search" placeholder="Имя или телефон" defaultValue={filters.search} />
          </label>
          <label>
            Дата от
            <input name="from" type="date" defaultValue={filters.from} />
          </label>
          <label>
            Дата до
            <input name="to" type="date" defaultValue={filters.to} />
          </label>
          <label>
            Мастер
            <select name="master" defaultValue={filters.master ?? ""}>
              <option value="">Все</option>
              {masters.map((master) => (
                <option key={master.id} value={master.name}>
                  {master.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Услуга
            <select name="service" defaultValue={filters.service ?? ""}>
              <option value="">Все</option>
              {services.map((service) => (
                <option key={service.id} value={service.title}>
                  {service.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Статус
            <select name="status" defaultValue={filters.status ?? ""}>
              <option value="">Все</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-filter-actions">
            <button className="button button-primary" type="submit">
              Применить
            </button>
            <Link className="button button-ghost" href="/admin">
              Сбросить
            </Link>
          </div>
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Дата</th>
                <th>Время</th>
                <th>Клиент</th>
                <th>Телефон</th>
                <th>Услуга</th>
                <th>Мастер</th>
                <th>Стоимость</th>
                <th>Статус</th>
                <th>Создано</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>#{appointment.id}</td>
                  <td>{appointment.date}</td>
                  <td>{appointment.time}</td>
                  <td>{appointment.name}</td>
                  <td>{appointment.phone}</td>
                  <td>{appointment.service}</td>
                  <td>{appointment.master}</td>
                  <td>{formatCurrency(appointment.price)}</td>
                  <td>
                    <StatusBadge status={appointment.status} />
                  </td>
                  <td>{formatDateTime(appointment.createdAt)}</td>
                  <td>
                    <AdminAppointmentActions id={appointment.id} />
                  </td>
                </tr>
              ))}
              {!appointments.length ? (
                <tr>
                  <td colSpan={11}>Заявки по выбранным фильтрам не найдены.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2>Календарь записей</h2>
            <p>Записи на выбранный день сгруппированы по мастерам.</p>
          </div>
          <form className="calendar-filter" action="/admin">
            <input name="calendarDate" type="date" defaultValue={calendarDate} />
            <button className="button button-ghost" type="submit">
              Показать
            </button>
          </form>
        </div>

        {Object.keys(groupedCalendar).length ? (
          <div className="admin-calendar-list">
            {Object.entries(groupedCalendar).map(([master, items]) => (
              <article key={master}>
                <h3>{master}</h3>
                {items.map((appointment) => (
                  <p key={appointment.id}>
                    <strong>{appointment.time}</strong> — {appointment.name},{" "}
                    {appointment.service}
                  </p>
                ))}
              </article>
            ))}
          </div>
        ) : (
          <div className="booking-empty">На выбранный день записей нет.</div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="admin-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;

  return <span className={`status-badge status-${status}`}>{label}</span>;
}

function groupByMaster<T extends { master: string }>(appointments: T[]) {
  return appointments.reduce<Record<string, T[]>>((acc, appointment) => {
    acc[appointment.master] = acc[appointment.master] ?? [];
    acc[appointment.master].push(appointment);
    return acc;
  }, {});
}

function toURLSearchParams(raw: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  Object.entries(raw).forEach(([key, value]) => {
    const singleValue = getSingleValue(value);
    if (singleValue) {
      params.set(key, singleValue);
    }
  });

  return params;
}

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
