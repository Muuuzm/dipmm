"use client";

import { useState } from "react";

const links = [
  { href: "#services", label: "Услуги" },
  { href: "#masters", label: "Мастера" },
  { href: "#portfolio", label: "Работы" },
  { href: "#about", label: "О нас" },
  { href: "#contacts", label: "Контакты" }
];

export function SiteHeader({
  salonName = "Зеркала",
  subtitle = "парикмахерская для всей семьи"
}: {
  salonName?: string;
  subtitle?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="site-header">
      <a className="brand" href="#home" onClick={closeMenu}>
        <strong>{salonName}</strong>
        <span>{subtitle}</span>
      </a>

      <button
        className={`menu-toggle ${isOpen ? "is-open" : ""}`}
        type="button"
        aria-label="Открыть меню"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`header-menu ${isOpen ? "is-open" : ""}`}>
        <nav aria-label="Основная навигация">
          {links.map((link) => (
            <a href={link.href} key={link.href} onClick={closeMenu}>
              {link.label}
            </a>
          ))}
        </nav>
        <a className="header-cta" href="/booking" onClick={closeMenu}>
          Записаться онлайн
        </a>
      </div>
    </header>
  );
}
