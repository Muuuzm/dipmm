import { SiteHeader } from "@/components/SiteHeader";
import {
  getPublicGallery,
  getPublicMasters,
  getPublicReviews,
  getPublicServices,
  getSalonInfo
} from "@/lib/public-data";

export const dynamic = "force-dynamic";

const advantages = [
  ["01", "Мужские стрижки", "Основное направление парикмахерской — практичные мужские стрижки на каждый день."],
  ["02", "Женские услуги", "Выполняем женские стрижки и принимаем на отдельные услуги по предварительной записи."],
  ["03", "Понятные цены", "Показываем стоимость и длительность услуги до оформления записи."],
  ["04", "Запись без звонка", "Для доступных услуг можно выбрать дату, мастера и свободное время онлайн."]
];

export default async function Home() {
  const [salon, services, masters, gallery, reviews] = await Promise.all([
    getSalonInfo(),
    getPublicServices({ popularOnly: true }),
    getPublicMasters(),
    getPublicGallery(),
    getPublicReviews()
  ]);
  const mapEmbedUrl = salon.latitude && salon.longitude
    ? `https://yandex.ru/map-widget/v1/?ll=${salon.longitude}%2C${salon.latitude}&z=17&pt=${salon.longitude},${salon.latitude},pm2rdm`
    : null;

  return (
    <main>
      <SiteHeader salonName={salon.name} subtitle={salon.subtitle} />

      <section className="hero" id="home">
        <div className="hero-shell">
          <div className="hero-copy">
            <span className="section-badge">Парикмахерская в Северодвинске</span>
            <h1>{salon.tagline}</h1>
            <p>{salon.description}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="/booking">Записаться онлайн</a>
              <a className="button button-ghost" href="#services">Посмотреть услуги</a>
            </div>
            <div className="hero-trust"><span><strong>от 200 ₽</strong> мужская стрижка</span><span><strong>Онлайн</strong> выбор свободного времени</span></div>
          </div>

          <div className="hero-visual" aria-label="Интерьер Студии Престиж">
            <img src={salon.heroImage} alt="Светлый интерьер парикмахерской" />
            <div className="hero-note"><strong>Сегодня</strong><span>есть свободные окна</span></div>
            <a className="hero-quick-link" href="/booking">Выбрать время <span>→</span></a>
          </div>
        </div>

        <div className="benefit-row">
          <article className="benefit-card"><span>01</span><div><strong>Мужские стрижки</strong><p>основное направление</p></div></article>
          <article className="benefit-card"><span>02</span><div><strong>Женские услуги</strong><p>по предварительной записи</p></div></article>
          <article className="benefit-card"><span>30</span><div><strong>Минут</strong><p>интервал онлайн-записи</p></div></article>
        </div>
      </section>

      <section className="section services-section" id="services">
        <div className="section-heading centered">
          <span className="section-badge">Услуги и цены</span>
          <h2>В первую очередь — мужские стрижки</h2>
          <p>Также доступны женская стрижка, маникюр, педикюр, массаж и оформление бровей и ресниц. Возможность онлайн-записи указана отдельно.</p>
        </div>
        <div className="service-grid">
          {services.map((service, index) => (
            <article className="service-card" key={service.slug}>
              <div className="service-card-top">
                <div className="service-icon" aria-hidden="true">{iconSymbol(service.icon)}</div>
                <span className="service-number">0{index + 1}</span>
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <div className="service-meta"><span>{service.priceLabel}</span><span>{service.durationLabel}</span></div>
              {service.isBookable ? (
                <a href={`/booking?service=${encodeURIComponent(service.slug)}`}>Выбрать услугу <span>→</span></a>
              ) : (
                <a href={`tel:${salon.phone.replace(/[^+\d]/g, "")}`}>Уточнить по телефону <span>→</span></a>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="section masters-section" id="masters">
        <div className="section-heading split-heading">
          <div><span className="section-badge">Расписание</span><h2>Два мастера по сменам</h2></div>
          <p>Каждый мастер работает два дня в неделю. При выборе даты система показывает только того, кто находится на смене и выполняет нужную услугу.</p>
        </div>
        <div className="master-grid">
          {masters.map((master) => (
            <article className="master-card" key={master.slug}>
              <div className="master-photo"><img src={master.image} alt={master.name} loading="lazy" /><span>На связи</span></div>
              <div className="master-body">
                <small>{master.workDaysLabel}</small>
                <h3>{master.name}</h3>
                <p className="master-role">{master.role}</p>
                {master.bio ? <p>{master.bio}</p> : null}
                <div className="tag-row">{master.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
                <a className="master-link" href={`/booking?master=${encodeURIComponent(master.slug)}`}>Записаться к мастеру <span>→</span></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {gallery.length ? (
        <section className="portfolio-section" id="portfolio">
          <div className="section-heading centered">
            <span className="section-badge dark">Услуги</span>
            <h2>Основные направления</h2>
            <p>Иллюстрации направлений работы. Реальные фотографии салона и стрижек можно добавить через админку.</p>
          </div>
          <div className="portfolio-grid">
            {gallery.map((item) => (
              <article key={item.id} className="portfolio-card">
                <img src={item.image} alt={item.alt} loading="lazy" />
                <div><span>{item.category}</span><h3>{item.title}</h3></div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="about-section" id="about">
        <div className="about-copy">
          <span className="section-badge">О студии</span>
          <h2>Обычная парикмахерская с удобной записью</h2>
          <p>Парикмахерская находится на улице Лебедева, 7А. Основные направления — мужские и женские стрижки. Дополнительные услуги доступны по предварительной записи.</p>
          <div className="stats-row"><div><strong>2</strong><span>мастера</span></div><div><strong>6</strong><span>направлений услуг</span></div><div><strong>11:00</strong><span>начало работы</span></div></div>
        </div>
        <div className="about-panel">
          <img src={salon.aboutImage} alt="Рабочее пространство Студии Престиж" loading="lazy" />
          <div className="advantage-list">
            {advantages.map(([number, title, text]) => <article key={number}><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></article>)}
          </div>
        </div>
      </section>

      {false && reviews.length ? (
        <section className="section reviews-section">
          <div className="section-heading split-heading"><div><span className="section-badge">Отзывы</span><h2>Нас рекомендуют</h2></div><p>Тёплые слова клиентов после визита в студию.</p></div>
          <div className="reviews-grid">
            {reviews.map((review) => <article className="review-card" key={review.id}><div className="review-stars">{"★".repeat(Math.min(5, review.rating))}</div><p>«{review.text}»</p><footer><strong>{review.clientName}</strong><span>{review.serviceName}</span></footer></article>)}
          </div>
        </section>
      ) : null}

      <section className="booking-section" id="booking">
        <div className="booking-copy"><span className="section-badge dark">Онлайн-запись</span><h2>Ваш визит начинается здесь</h2><p>Шесть коротких шагов: услуга, дата, мастер, свободное время и подтверждение.</p><div className="booking-points"><span>Актуальные цены</span><span>Реальное расписание</span><span>Защита от пересечений</span></div></div>
        <div className="booking-cta-card"><span>Доступно 24/7</span><h3>Выберите удобное время без звонка администратору.</h3><a className="button button-primary" href="/booking">Перейти к записи</a></div>
      </section>

      <section className="contacts-section" id="contacts">
        <div className="contacts-card"><span className="section-badge">Контакты</span><h2>Ждём вас</h2><ul className="contact-list"><li><span>Адрес</span><strong>{salon.address}</strong></li><li><span>Телефон</span><a href={`tel:${salon.phone.replace(/[^+\d]/g, "")}`}>{salon.phone}</a></li>{salon.email ? <li><span>Email</span><a href={`mailto:${salon.email}`}>{salon.email}</a></li> : null}<li><span>Режим работы</span><strong>{salon.workingHours}</strong></li></ul><div className="social-row">{salon.vkUrl ? <a href={salon.vkUrl} target="_blank" rel="noreferrer">VK</a> : null}{salon.telegramUrl ? <a href={salon.telegramUrl} target="_blank" rel="noreferrer">Telegram</a> : null}{salon.whatsappUrl ? <a href={salon.whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a> : null}</div></div>
        <div className="map-card">
          {mapEmbedUrl ? <iframe src={mapEmbedUrl} title={`${salon.name} на карте`} loading="lazy" /> : null}
          <div className="map-card-caption"><span>{salon.latitude}, {salon.longitude}</span><strong>{salon.address}</strong><a href={salon.mapUrl ?? "#contacts"} target="_blank" rel="noreferrer">Построить маршрут →</a></div>
        </div>
      </section>

      <footer className="site-footer"><div><strong>{salon.name}</strong><span>{salon.subtitle}</span></div><nav aria-label="Навигация в футере"><a href="#services">Услуги</a><a href="#masters">Мастера</a><a href="#portfolio">Работы</a><a href="/booking">Запись</a></nav><p>© 2026 {salon.name} · {salon.phone}</p></footer>
    </main>
  );
}

function iconSymbol(icon: string) {
  return ({ scissors: "✂", sparkles: "✦", heart: "♡", palette: "◉", waves: "≋", leaf: "⌁", hand: "◇", activity: "≈", eye: "◌" } as Record<string, string>)[icon] ?? "✦";
}
