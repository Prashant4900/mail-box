"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { useLogoutMutation, useMeQuery } from "@/queries/useAuth";
import { useDraftsQuery, useEmailsQuery } from "@/queries/useEmails";
import { useAppStore } from "@/store/useAppStore";

const SIDEBAR_ITEM_BASE = "w-full font-normal";
const SIDEBAR_ITEM_INACTIVE =
  "text-text-secondary hover:bg-surface-hover hover:text-primary-text";
const SIDEBAR_ITEM_ACTIVE =
  "bg-accent-subtle text-accent hover:bg-accent-subtle hover:text-accent font-semibold";
const SIDEBAR_ITEM_ACTIVE_ICON =
  "bg-accent-subtle text-accent hover:bg-accent-subtle hover:text-accent";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Sidebar");
  const { mutateAsync: logout } = useLogoutMutation();
  const { data: meData } = useMeQuery();
  const isMember = meData?.role === "MEMBER";

  const {
    isSidebarCollapsed,
    toggleSidebar,
    isMobileMenuOpen,
    setMobileMenuOpen,
  } = useAppStore();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isInboxActive = pathname === "/";
  const isMailboxesActive = pathname === "/mailboxes";
  const isTrashActive = pathname === "/trash";
  const isSettingsActive = pathname === "/settings";
  const isUsersActive = pathname === "/users";

  // Fetch emails to count unread messages
  const { data: emailsData } = useEmailsQuery({ page: 1, limit: 100 });
  const unreadCount =
    emailsData?.items.filter((email) => !email.isRead).length || 0;

  // Fetch drafts to count draft messages
  const { data: draftsData } = useDraftsQuery();
  const draftsCount = draftsData?.length || 0;

  const navItems = [
    {
      label: t("inbox"),
      icon: Icons.Inbox,
      count: unreadCount > 0 ? unreadCount : undefined,
      active: isInboxActive,
      href: "/",
    },
    {
      label: t("mailboxes"),
      icon: Icons.Mail,
      active: isMailboxesActive,
      href: "/mailboxes",
    },
    {
      label: t("sent"),
      icon: Icons.Sent,
      active: pathname === "/sent",
      href: "/sent",
    },
    {
      label: t("drafts"),
      icon: Icons.Drafts,
      count: draftsCount > 0 ? draftsCount : undefined,
      active: pathname === "/drafts",
      href: "/drafts",
    },
    {
      label: t("starred"),
      icon: Icons.Star,
      active: pathname === "/starred",
      href: "/starred",
    },
    {
      label: t("trash"),
      icon: Icons.Trash,
      active: isTrashActive,
      href: "/trash",
    },
  ];

  const handleMobileNavClick = (href?: string) => {
    if (href) {
      router.push(href);
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <aside
        className={`bg-surface border-r border-border h-full hidden md:flex md:flex-col shrink-0 transition-all duration-300 ${
          isSidebarCollapsed ? "w-[64px]" : "w-[232px]"
        }`}
      >
        {/* Sidebar Header */}
        <div
          className={`h-14 flex items-center border-b border-border text-primary-text px-4 justify-between ${
            isSidebarCollapsed ? "justify-center px-0" : ""
          }`}
        >
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center">
                <Icons.Mail className="w-5 h-5 mr-2 text-text-secondary" />
                <span className="font-semibold text-sm">Mailbox</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleSidebar}
                aria-label={t("collapse")}
              >
                <Icons.Menu className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              aria-label={t("expand")}
            >
              <Icons.Menu className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Compose Button */}
        <div className={`${isSidebarCollapsed ? "px-2 py-2" : "px-3 py-2"}`}>
          {isSidebarCollapsed ? (
            <div className="group relative w-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/compose")}
                title="Compose"
                className="w-full text-text-secondary hover:text-primary-text"
              >
                <Icons.Add className="w-5 h-5" />
              </Button>
              <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 bg-accent text-background text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap z-50">
                {t("compose")}
              </span>
            </div>
          ) : (
            <Button
              variant="default"
              onClick={() => router.push("/compose")}
              className="w-full"
            >
              <Icons.Add className="w-4 h-4 shrink-0" />
              <span>{t("compose")}</span>
            </Button>
          )}
        </div>

        {/* Sidebar Nav Items */}
        <nav
          className={`flex-1 py-2 space-y-1 ${
            isSidebarCollapsed ? "overflow-hidden px-2" : "overflow-y-auto px-2"
          }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            if (isSidebarCollapsed) {
              return (
                <div className="group relative w-full" key={item.label}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => item.href && router.push(item.href)}
                    className={`w-full relative ${
                      item.active
                        ? SIDEBAR_ITEM_ACTIVE_ICON
                        : SIDEBAR_ITEM_INACTIVE
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        item.active ? "text-accent" : "text-text-secondary"
                      }`}
                    />
                    {item.count && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
                    )}
                  </Button>
                  <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 bg-accent text-background text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap z-50">
                    {item.label} {item.count ? `(${item.count})` : ""}
                  </span>
                </div>
              );
            }

            return (
              <Button
                variant="ghost"
                key={item.label}
                onClick={() => item.href && router.push(item.href)}
                className={`${SIDEBAR_ITEM_BASE} justify-between ${
                  item.active ? SIDEBAR_ITEM_ACTIVE : SIDEBAR_ITEM_INACTIVE
                }`}
              >
                <div className="flex items-center">
                  <Icon
                    className={`w-5 h-5 mr-3 ${
                      item.active ? "text-accent" : "text-text-secondary"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count && (
                  <span
                    className={`text-[11px] font-semibold px-1.5 rounded-full ${
                      item.active
                        ? "bg-accent text-white"
                        : "bg-border text-text-secondary"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          className={`border-t border-border flex flex-col gap-1 ${
            isSidebarCollapsed ? "p-2 items-center" : "p-2"
          }`}
        >
          {isSidebarCollapsed ? (
            <>
              {!isMember && (
                <div className="group relative w-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/users")}
                    className={`w-full ${
                      isUsersActive
                        ? SIDEBAR_ITEM_ACTIVE_ICON
                        : SIDEBAR_ITEM_INACTIVE
                    }`}
                  >
                    <Icons.Users
                      className={`w-5 h-5 ${
                        isUsersActive ? "text-accent" : "text-text-secondary"
                      }`}
                    />
                  </Button>
                  <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 bg-accent text-background text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap z-50">
                    {t("users")}
                  </span>
                </div>
              )}
              <div className="group relative w-full">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/settings")}
                  className={`w-full ${
                    isSettingsActive
                      ? SIDEBAR_ITEM_ACTIVE_ICON
                      : SIDEBAR_ITEM_INACTIVE
                  }`}
                >
                  <Icons.Settings
                    className={`w-5 h-5 ${
                      isSettingsActive ? "text-accent" : "text-text-secondary"
                    }`}
                  />
                </Button>
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 bg-accent text-background text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap z-50">
                  {t("settings")}
                </span>
              </div>
              <div className="group relative w-full">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className={`w-full ${SIDEBAR_ITEM_INACTIVE}`}
                >
                  <Icons.Logout className="w-5 h-5 text-text-secondary" />
                </Button>
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 bg-accent text-background text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap z-50">
                  {t("logout")}
                </span>
              </div>
            </>
          ) : (
            <>
              {!isMember && (
                <Button
                  variant="ghost"
                  onClick={() => router.push("/users")}
                  className={`${SIDEBAR_ITEM_BASE} justify-start ${
                    isUsersActive ? SIDEBAR_ITEM_ACTIVE : SIDEBAR_ITEM_INACTIVE
                  }`}
                >
                  <Icons.Users
                    className={`w-5 h-5 mr-3 ${
                      isUsersActive ? "text-accent" : "text-text-secondary"
                    }`}
                  />
                  <span>{t("users")}</span>
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => router.push("/settings")}
                className={`${SIDEBAR_ITEM_BASE} justify-start ${
                  isSettingsActive ? SIDEBAR_ITEM_ACTIVE : SIDEBAR_ITEM_INACTIVE
                }`}
              >
                <Icons.Settings
                  className={`w-5 h-5 mr-3 ${
                    isSettingsActive ? "text-accent" : "text-text-secondary"
                  }`}
                />
                <span>{t("settings")}</span>
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className={`${SIDEBAR_ITEM_BASE} justify-start ${SIDEBAR_ITEM_INACTIVE}`}
              >
                <Icons.Logout className="w-5 h-5 mr-3 text-text-secondary" />
                <span>{t("logout")}</span>
              </Button>
            </>
          )}
        </div>
      </aside>

      {/* 2. Mobile Drawer Overlay & Panels */}
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label={t("closeMenu")}
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-50 md:hidden animate-in fade-in duration-200 cursor-default outline-none"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-[240px] bg-surface border-r border-border h-full z-50 flex flex-col md:hidden transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Header */}
        <div className="h-14 flex items-center px-4 font-semibold border-b border-border text-primary-text justify-between">
          <div className="flex items-center">
            <Icons.Mail className="w-5 h-5 mr-2 text-text-secondary" />
            <span className="font-semibold text-sm">Mailbox</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            aria-label={t("closeMenu")}
          >
            <Icons.Close className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Nav */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {/* Mobile Compose Button */}
          <div className="pb-2">
            <Button
              variant="default"
              onClick={() => {
                router.push("/compose");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-center"
            >
              <Icons.Add className="w-4 h-4 shrink-0" />
              <span>{t("compose")}</span>
            </Button>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                variant="ghost"
                key={item.label}
                onClick={() => handleMobileNavClick(item.href)}
                className={`${SIDEBAR_ITEM_BASE} justify-between ${
                  item.active ? SIDEBAR_ITEM_ACTIVE : SIDEBAR_ITEM_INACTIVE
                }`}
              >
                <div className="flex items-center">
                  <Icon
                    className={`w-5 h-5 mr-3 ${
                      item.active ? "text-accent" : "text-text-secondary"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count && (
                  <span
                    className={`text-[11px] font-semibold px-1.5 rounded-full ${
                      item.active
                        ? "bg-accent text-white"
                        : "bg-border text-text-secondary"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Mobile Footer */}
        <div className="p-2 border-t border-border flex flex-col gap-1">
          {!isMember && (
            <Button
              variant="ghost"
              onClick={() => handleMobileNavClick("/users")}
              className={`${SIDEBAR_ITEM_BASE} justify-start ${
                isUsersActive ? SIDEBAR_ITEM_ACTIVE : SIDEBAR_ITEM_INACTIVE
              }`}
            >
              <Icons.Users
                className={`w-5 h-5 mr-3 ${
                  isUsersActive ? "text-accent" : "text-text-secondary"
                }`}
              />
              <span>{t("users")}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => handleMobileNavClick("/settings")}
            className={`${SIDEBAR_ITEM_BASE} justify-start ${
              isSettingsActive ? SIDEBAR_ITEM_ACTIVE : SIDEBAR_ITEM_INACTIVE
            }`}
          >
            <Icons.Settings
              className={`w-5 h-5 mr-3 ${
                isSettingsActive ? "text-accent" : "text-text-secondary"
              }`}
            />
            <span>{t("settings")}</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              handleLogout();
              setMobileMenuOpen(false);
            }}
            className={`${SIDEBAR_ITEM_BASE} justify-start ${SIDEBAR_ITEM_INACTIVE}`}
          >
            <Icons.Logout className="w-5 h-5 mr-3 text-text-secondary" />
            <span>{t("logout")}</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
