/**
 * شريط تنقل موحّد بين وحدات النظام (صفحات الجذر).
 * @param {string} containerSelector
 * @param {string} currentPageId — أحد المعرفات في APP_PAGES
 */
export function mountAppNav(containerSelector, currentPageId) {
  const el = document.querySelector(containerSelector);
  if (!el) return;

  if (!document.getElementById("app-global-nav-styles")) {
    const style = document.createElement("style");
    style.id = "app-global-nav-styles";
    style.textContent = `
      .app-global-nav {
        background: linear-gradient(180deg, #e8eef5 0%, #dfe8f2 100%);
        border-bottom: 1px solid #c5d3e3;
        padding: 8px 12px;
        position: sticky;
        top: 0;
        z-index: 50;
        box-shadow: 0 4px 12px rgba(20, 40, 60, 0.06);
      }
      .app-global-nav-inner {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: center;
        align-items: center;
        max-width: 1400px;
        margin: 0 auto;
      }
      .app-global-nav-inner a {
        display: inline-block;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: clamp(0.78rem, 1.5vw, 0.88rem);
        font-weight: 700;
        text-decoration: none;
        color: #1a3550;
        background: rgba(255, 255, 255, 0.75);
        border: 1px solid #b8c9db;
        transition: background 0.15s, border-color 0.15s;
      }
      .app-global-nav-inner a:hover {
        background: #fff;
        border-color: #2f89d9;
        color: #0d3a66;
      }
      .app-global-nav-inner a.active {
        background: #2f89d9;
        border-color: #2f89d9;
        color: #fff;
      }
    `;
    document.head.appendChild(style);
  }

  el.className = "app-global-nav";
  el.innerHTML = `
    <nav class="app-global-nav-inner" aria-label="التنقل بين الوحدات">
      ${APP_PAGES.map(
        p =>
          `<a href="${p.href}" class="${p.id === currentPageId ? "active" : ""}" data-nav="${p.id}">${p.label}</a>`
      ).join("")}
    </nav>
  `;
}

export const APP_PAGES = [
  { id: "dashboard", href: "dashboard.html", label: "لوحة التحكم" },
  { id: "transport", href: "transport-data.html", label: "بيانات النقلات" },
  { id: "prices", href: "prices.html", label: "أسعار الحاويات" },
  { id: "daily", href: "daily.html", label: "الشغل اليومي" },
  { id: "treasury", href: "treasury-system.html", label: "الخزنة" },
  { id: "garage", href: "garage.html", label: "الجراج" },
  { id: "accounting", href: "accounting.html", label: "المحاسبة" },
  { id: "drivers", href: "drivers-roles-page.html", label: "أدوار السواقين" },
  { id: "shared-lists", href: "shared-lists.html", label: "القوائم المشتركة" },
  { id: "upload", href: "upload.html", label: "رفع ملفات" }
];
