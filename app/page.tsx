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
  ["01", "Профессиональные мастера", "Команда с сильной специализацией и вниманием к деталям."],
  ["02", "Уютная атмосфера", "Спокойное пространство, где можно замедлиться и отдохнуть."],
  ["03", "Честная консультация", "Подбираем образ и уход под ваши волосы и ритм жизни."],
  ["04", "Качественная косметика", "Работаем с проверенными составами и бережными техниками."]
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
            <span className="section-badge">Парикмахерская для всей семьи</span>
            <h1>{salon.tagline}</h1>
            <p>{salon.description}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="/booking">Записаться онлайн</a>
              <a className="button button-ghost" href="#services">Посмотреть услуги</a>
            </div>
            <div className="hero-trust">
              <span><strong>4.9</strong> средняя оценка</span>
              <span><strong>3000+</strong> гостей студии</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Интерьер Студии Престиж">
            <img src={salon.heroImage} alt="Светлый интерьер парикмахерской" />
            <div className="hero-note"><strong>Сегодня</strong><span>есть свободные окна</span></div>
            <a className="hero-quick-link" href="/booking">Выбрать время <span>→</span></a>
          </div>
        </div>

        <div className="benefit-row">
          <article className="benefit-card"><span>8+</span><div><strong>Опытные мастера</strong><p>лет практики</p></div></article>
          <article className="benefit-card"><span>6</span><div><strong>Направлений услуг</strong><p>для всей семьи</p></div></article>
          <article className="benefit-card"><span>24/7</span><div><strong>Онлайн-запись</strong><p>без звонка</p></div></article>
        </div>
      </section>

      <section className="section services-section" id="services">
        <div className="section-heading centered">
          <span className="section-badge">Популярные направления</span>
          <h2>Услуги для любого образа</h2>
          <p>Выберите услугу и сразу перейдите к свободным мастерам и времени.</p>
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
          <div><span className="section-badge">Команда</span><h2>Мастера, которым доверяют</h2></div>
          <p>У каждого мастера своя специализация. Система записи покажет только тех, кто выполняет выбранную услугу и работает в нужный день.</p>
        </div>
        <div className="master-grid">
          {masters.map((master) => (
            <article className="master-card" key={master.slug}>
              <div className="master-photo"><img src={master.image} alt={master.name} loading="lazy" /><span>На связи</span></div>
              <div className="master-body">
                <small>{master.experience}</small>
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
            <span className="section-badge dark">Наши работы</span>
            <h2>Результат говорит за нас</h2>
            <p>Стрижки, окрашивания и укладки, созданные мастерами студии.</p>
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
          <h2>Место, куда приятно возвращаться</h2>
          <p>Мы соединили профессиональный подход, спокойную атмосферу и удобную онлайн-запись. Здесь слышат пожелания, объясняют каждый этап и помогают сохранить результат дома.</p>
          <div className="stats-row"><div><strong>8+</strong><span>лет опыта</span></div><div><strong>3000+</strong><span>клиентов</span></div><div><strong>4.9</strong><span>оценка гостей</span></div></div>
        </div>
        <div className="about-panel">
          <img src={salon.aboutImage} alt="Рабочее пространство Студии Престиж" loading="lazy" />
          <div className="advantage-list">
            {advantages.map(([number, title, text]) => <article key={number}><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></article>)}
          </div>
        </div>
      </section>

      {reviews.length ? (
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
          {mapEmbedUrl ? <iframe src={mapEmbedUrl} title="Студия Престиж на карте" loading="lazy" /> : null}
          <div className="map-card-caption"><span>64.537494, 39.805033</span><strong>{salon.address}</strong><a href={salon.mapUrl ?? "#contacts"} target="_blank" rel="noreferrer">Построить маршрут →</a></div>
        </div>
      </section>

      <footer className="site-footer"><div><strong>{salon.name}</strong><span>{salon.subtitle}</span></div><nav aria-label="Навигация в футере"><a href="#services">Услуги</a><a href="#masters">Мастера</a><a href="#portfolio">Работы</a><a href="/booking">Запись</a></nav><p>© 2026 {salon.name} · {salon.phone}</p></footer>
    </main>
  );
}

function iconSymbol(icon: string) {
  return ({ scissors: "✂", sparkles: "✦", heart: "♡", palette: "◉", waves: "≋", leaf: "⌁", hand: "◇", activity: "≈" } as Record<string, string>)[icon] ?? "✦";
}
