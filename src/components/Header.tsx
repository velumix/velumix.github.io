import { useEffect, useRef, useState } from "react";
import { Brand, Icon } from "./Icon";
const navigation = [
  { href: "#work", label: "Work" },
  { href: "#systems", label: "Open source" },
  { href: "#about", label: "About" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("");
  const menuToggle = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    const sections = ["top", "work", "systems", "about", "contact"]
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));
    function update() {
      frame = 0;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current)
        progressRef.current.style.transform = `scaleX(${maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0})`;
      headerRef.current?.classList.toggle("is-scrolled", window.scrollY > 24);
      const current = sections
        .filter(
          (section) =>
            section.getBoundingClientRect().top < window.innerHeight * 0.3,
        )
        .at(-1);
      setActive(current ? `#${current.id}` : "");
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const inertElements = [
      ...document.querySelectorAll<HTMLElement>("main, .site-footer"),
    ].map((element) => ({ element, inert: element.inert }));
    inertElements.forEach(({ element }) => {
      element.inert = true;
    });
    const desktop = window.matchMedia("(min-width: 701px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggle.current?.focus();
      }
      if (event.key === "Tab") {
        const links = [
          ...(navRef.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []),
        ];
        const last = links.at(-1);
        if (event.shiftKey && document.activeElement === menuToggle.current) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          menuToggle.current?.focus();
        }
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
      document.body.style.overflow = previousOverflow;
      inertElements.forEach(({ element, inert }) => {
        element.inert = inert;
      });
    };
  }, [menuOpen]);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="shell header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? "location" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a className="header-contact" href="#contact">
          Let’s talk <Icon name="diagonal" />
        </a>
        <button
          ref={menuToggle}
          className="icon-button menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name={menuOpen ? "close" : "menu"} />
        </button>
        <button
          className="menu-backdrop"
          type="button"
          aria-label="Close navigation"
          tabIndex={-1}
          hidden={!menuOpen}
          onClick={() => {
            setMenuOpen(false);
            menuToggle.current?.focus();
          }}
        />
        <nav
          ref={navRef}
          id="mobile-menu"
          className="mobile-nav"
          aria-label="Mobile navigation"
          hidden={!menuOpen}
        >
          {[...navigation, { href: "#contact", label: "Let’s talk" }].map(
            (link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
                <Icon name="diagonal" />
              </a>
            ),
          )}
        </nav>
      </div>
      <span className="reading-progress" ref={progressRef} aria-hidden="true" />
    </header>
  );
}
