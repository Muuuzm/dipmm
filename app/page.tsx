import { SiteHeader } from "@/components/SiteHeader";

const services = [
  {
    icon: "✂",
    title: "Мужская стрижка",
    price: "от 900 ₽",
    duration: "40 мин",
    description: "Чистая форма, аккуратная окантовка и укладка под ваш стиль."
  },
  {
    icon: "◇",
    title: "Женская стрижка",
    price: "от 1 400 ₽",
    duration: "60 мин",
    description: "Подбор силуэта, консультация по уходу и легкая финальная укладка."
  },
  {
    icon: "♡",
    title: "Детская стрижка",
    price: "от 700 ₽",
    duration: "30 мин",
    description: "Спокойный подход к маленьким гостям и быстрый аккуратный результат."
  },
  {
    icon: "●",
    title: "Окрашивание",
    price: "от 3 200 ₽",
    duration: "120 мин",
    description: "Мягкие переходы, стойкий цвет и бережная работа с качеством волос."
  },
  {
    icon: "≋",
    title: "Укладка",
    price: "от 1 100 ₽",
    duration: "45 мин",
    description: "Повседневные и вечерние образы с естественным объемом и фиксацией."
  },
  {
    icon: "✦",
    title: "Уходовые процедуры",
    price: "от 1 800 ₽",
    duration: "50 мин",
    description: "Восстановление, питание и блеск для волос после диагностики мастера."
  }
];

const masters = [
  {
    name: "Анна Волкова",
    role: "Колорист, стилист",
    experience: "8 лет опыта",
    tags: ["окрашивание", "уход", "женские стрижки"],
    image:
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=85"
  },
  {
    name: "Илья Соколов",
    role: "Барбер, мужские стрижки",
    experience: "6 лет опыта",
    tags: ["барберинг", "борода", "мужские стрижки"],
    image:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=85"
  },
  {
    name: "Мария Орлова",
    role: "Стилист",
    experience: "5 лет опыта",
    tags: ["укладки", "уход", "стрижки"],
    image:
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=900&q=85"
  }
];

const heroBenefits = [
  { value: "8+", label: "лет опыта", text: "Опытные мастера" },
  { value: "Pro", label: "косметика", text: "Качественные составы" },
  { value: "Care", label: "подход", text: "Забота о каждом клиенте" }
];

const advantages = [
  "Профессиональные мастера",
  "Уютная атмосфера",
  "Удобное расположение",
  "Качественная косметика"
];

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero" id="home">
        <div className="hero-shell">
          <div className="hero-copy">
            <span className="section-badge">Парикмахерская для всей семьи</span>
            <h1>Красота в каждой детали</h1>
            <p>
              Профессиональные стрижки, окрашивание и уход за волосами в уютной
              атмосфере салона, куда хочется возвращаться.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/booking">
                Записаться онлайн
              </a>
              <a className="button button-ghost" href="#services">
                Посмотреть услуги
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-label="Интерьер салона красоты">
            <img
              src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1200&q=90"
              alt="Мастер салона делает укладку клиентке"
            />
            <div className="hero-note">
              <strong>3000+</strong>
              <span>довольных клиентов</span>
            </div>
          </div>
        </div>

        <div className="benefit-row">
          {heroBenefits.map((benefit) => (
            <article className="benefit-card" key={benefit.text}>
              <span>{benefit.value}</span>
              <div>
                <strong>{benefit.text}</strong>
                <p>{benefit.label}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section services-section" id="services">
        <div className="section-heading centered">
          <span className="section-badge">Популярные направления</span>
          <h2>Услуги для любого образа</h2>
          <p>
            От классической стрижки до сложного окрашивания: подберем решение
            под ваш стиль, ритм жизни и состояние волос.
          </p>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <article className="service-card" key={service.title}>
              <div className="service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <div className="service-meta">
                <span>{service.price}</span>
                <span>{service.duration}</span>
              </div>
              <a href="/booking">Записаться</a>
            </article>
          ))}
        </div>
      </section>

      <section className="section masters-section" id="masters">
        <div className="section-heading">
          <div>
            <span className="section-badge">Команда</span>
            <h2>Наши мастера</h2>
          </div>
          <p>
            Каждый мастер работает в своей сильной специализации и помогает
            выбрать образ, который легко поддерживать дома.
          </p>
        </div>
        <div className="master-grid">
          {masters.map((master) => (
            <article className="master-card" key={master.name}>
              <img src={master.image} alt={master.name} />
              <div className="master-body">
                <span>{master.experience}</span>
                <h3>{master.name}</h3>
                <p>{master.role}</p>
                <div className="tag-row">
                  {master.tags.map((tag) => (
                    <small key={tag}>{tag}</small>
                  ))}
                </div>
                <a className="master-link" href="/booking">
                  Записаться к мастеру
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-copy">
          <span className="section-badge">О студии</span>
          <h2>Место, куда приятно возвращаться</h2>
          <p>
            «Студия Престиж» — это спокойная атмосфера, внимательная
            консультация и аккуратная работа с деталями. Мы создаем образы для
            учебы, работы, праздников и повседневной жизни, сохраняя качество
            волос и естественность результата.
          </p>
          <div className="stats-row">
            <div>
              <strong>8+</strong>
              <span>лет опыта</span>
            </div>
            <div>
              <strong>3000+</strong>
              <span>клиентов</span>
            </div>
            <div>
              <strong>6</strong>
              <span>направлений</span>
            </div>
          </div>
        </div>
        <div className="about-panel">
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=85"
            alt="Рабочее место мастера в салоне красоты"
          />
          <div className="advantage-list">
            {advantages.map((advantage) => (
              <article key={advantage}>
                <span>✦</span>
                <p>{advantage}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="booking-section" id="booking">
        <div className="booking-copy">
          <span className="section-badge dark">Онлайн-запись</span>
          <h2>Готовы записаться?</h2>
          <p>
            Выберите услугу, мастера и удобное время онлайн без звонка.
            Система покажет только свободные слоты и сохранит заявку в базе.
          </p>
          <div className="booking-points">
            <span>Подтверждение записи</span>
            <span>Выбор мастера</span>
            <span>Свободные слоты</span>
          </div>
        </div>
        <div className="booking-cta-card">
          <span>Онлайн-запись</span>
          <h3>Выберите услугу, мастера и удобное время онлайн.</h3>
          <a className="button button-primary" href="/booking">
            Перейти к записи
          </a>
        </div>
      </section>

      <section className="contacts-section" id="contacts">
        <div className="contacts-card">
          <span className="section-badge">Контакты</span>
          <h2>Ждем вас</h2>
          <ul className="contact-list">
            <li>
              <span>Адрес</span>
              <strong>г. Москва, ул. Центральная, 15</strong>
            </li>
            <li>
              <span>Телефон</span>
              <strong>+7 900 123-45-67</strong>
            </li>
            <li>
              <span>Email</span>
              <strong>hello@parih.svoiprox.pro</strong>
            </li>
            <li>
              <span>Режим работы</span>
              <strong>ежедневно 09:00-21:00</strong>
            </li>
          </ul>
          <div className="social-row">
            <a href="#contacts">VK</a>
            <a href="#contacts">Telegram</a>
            <a href="#contacts">WhatsApp</a>
          </div>
        </div>
        <div className="map-placeholder">
          <span>Место для интерактивной карты</span>
          <p>Здесь можно подключить Яндекс.Карты или 2ГИС при расширении проекта.</p>
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <strong>Студия Престиж</strong>
          <span>Парикмахерская для всей семьи</span>
        </div>
        <nav aria-label="Навигация в футере">
          <a href="#services">Услуги</a>
          <a href="#masters">Мастера</a>
          <a href="/booking">Запись</a>
          <a href="#contacts">Контакты</a>
        </nav>
        <p>© 2026 Студия Престиж · +7 900 123-45-67</p>
      </footer>
    </main>
  );
}
