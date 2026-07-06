"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useMeQuery } from "@/queries/useAuth";
import { useEmailsQuery, useUpdateEmailMutation } from "@/queries/useEmails";
import { useAppStore } from "@/store/useAppStore";

function formatEmailTime(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const threadKey = searchParams.get("threadKey");
  const isMessageDetailMobile = !!threadKey && pathname === "/";

  const t = useTranslations("Navbar");
  const sidebarT = useTranslations("Sidebar");
  const { data: user } = useMeQuery();
  const { toggleMobileMenu } = useAppStore();

  // Prevent hydration mismatch: user data from React Query cache is available
  // immediately on the client but not during SSR, so defer rendering until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileNotificationsRef = useRef<HTMLDivElement>(null);

  // Notifications dropdown state
  const [showNotifications, setShowNotifications] = useState(false);

  // Search state
  const searchParamVal = searchParams.get("search") || "";
  const [searchValue, setSearchValue] = useState(searchParamVal);
  const [showMobileSearch, setShowMobileSearch] = useState(!!searchParamVal);

  useEffect(() => {
    setSearchValue(searchParamVal);
    if (searchParamVal) {
      setShowMobileSearch(true);
    }
  }, [searchParamVal]);

  useEffect(() => {
    if (searchValue === searchParamVal) return;

    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        params.set("search", searchValue);
      } else {
        params.delete("search");
      }
      params.delete("messageId"); // Reset selected detail view on new search

      const targetPath =
        pathname === "/settings" || pathname === "/mailboxes" ? "/" : pathname;
      router.push(`${targetPath}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue, searchParamVal, pathname, router, searchParams]);

  // isMounted prevents SSR/hydration mismatch: query data only exists client-side.
  // Server renders hasUnread=false; without this guard the badge causes a mismatch.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch real unread notifications via TanStack Query
  const { data: emailsData } = useEmailsQuery({ page: 1, limit: 100 });
  const updateEmailMutation = useUpdateEmailMutation();

  const unreadEmails = isMounted
    ? (emailsData?.items.filter((email) => !email.isRead) ?? [])
    : [];
  const hasUnread = unreadEmails.length > 0;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleClearAll = () => {
    for (const email of unreadEmails) {
      updateEmailMutation.mutate({ id: email.id, action: "read" });
    }
  };

  // Keyboard shortcut listener (⌘K or Ctrl+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOutsideDesktop =
        !notificationsRef.current || !notificationsRef.current.contains(target);
      const clickedOutsideMobile =
        !mobileNotificationsRef.current ||
        !mobileNotificationsRef.current.contains(target);
      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getBreadcrumbs = () => {
    let pageTitle = sidebarT("inbox");
    if (pathname === "/settings") pageTitle = sidebarT("settings");
    else if (pathname === "/users") pageTitle = sidebarT("users");
    else if (pathname === "/mailboxes") pageTitle = sidebarT("mailboxes");
    else if (pathname === "/compose") pageTitle = sidebarT("compose");
    else if (pathname === "/drafts") pageTitle = sidebarT("drafts");
    else if (pathname === "/sent") pageTitle = sidebarT("sent");
    else if (pathname === "/starred") pageTitle = sidebarT("starred");
    else if (pathname === "/trash") pageTitle = sidebarT("trash");

    return (
      <div className="flex items-center text-[13px]">
        <span className="text-text-secondary font-medium">Mailbox</span>
        <span className="text-text-muted mx-2 text-[10px] select-none">/</span>
        <span className="text-text-primary font-semibold">{pageTitle}</span>
      </div>
    );
  };

  const initials = user
    ? `${user.firstName[0] || ""}${user.lastName[0] || ""}`.toUpperCase()
    : "";

  return (
    <>
      {/* 1. Desktop Header */}
      <header className="h-14 border-b border-border px-6 hidden md:flex items-center justify-between bg-background shrink-0 select-none animate-in fade-in duration-200">
        {/* Left Area (Breadcrumbs) */}
        <div className="flex items-center gap-2">{getBreadcrumbs()}</div>

        {/* Right Area (Actions + Search) */}
        <div className="flex items-center gap-2">
          {/* Search Bar aligned on the right, narrower width */}
          <div className="relative items-center bg-surface hover:bg-surface-hover border border-border focus-within:border-text-primary focus-within:bg-background rounded-lg transition-all duration-200 w-66 flex">
            <Icons.Search className="w-4 h-4 text-text-secondary absolute left-2.5 pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="border-0 bg-transparent px-0 py-0 pl-8 pr-12 text-[12.5px] outline-none focus-visible:border-0 focus-visible:ring-0 text-text-primary placeholder:text-text-muted"
            />
            <kbd className="absolute right-2 inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[9px] font-medium text-text-muted">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </div>

          {/* Notifications Dropdown Container */}
          <div className="relative" ref={notificationsRef}>
            <div className="group relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleNotifications}
                aria-label={t("notificationsTooltip")}
                className={`relative ${
                  showNotifications
                    ? "bg-black/5 dark:bg-white/5 text-text-primary"
                    : ""
                }`}
              >
                <Icons.Notification className="w-5 h-5" />
                {hasUnread && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                )}
              </Button>
              {!showNotifications && (
                <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 bg-accent text-background text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap z-50">
                  {t("notificationsTooltip")}
                </span>
              )}
            </div>

            {showNotifications && (
              <div className="absolute right-0 top-10 mt-1 w-80 bg-background border border-border rounded-xl shadow-lg z-50 py-2 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                  <span className="font-semibold text-xs text-text-primary">
                    {t("notificationsTitle")}
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleClearAll}
                    className="text-[11px]"
                  >
                    {t("clearAll")}
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {unreadEmails.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-text-muted">
                      {t("noNotifications")}
                    </div>
                  ) : (
                    unreadEmails.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          router.push(
                            `/?messageId=${item.id}&threadKey=${encodeURIComponent(item.threadKey)}`,
                          );
                          setShowNotifications(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-surface-hover cursor-pointer border-b border-border/50 last:border-b-0 transition-colors block"
                      >
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-medium text-[12.5px] text-text-primary">
                            New Mail: {item.fromName || item.fromAddress}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {formatEmailTime(item.receivedAt)}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-text-secondary line-clamp-1 leading-normal">
                          {item.subject}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <ThemeToggle />
          {mounted && user && (
            <div className="group relative">
              <Avatar
                initials={initials}
                onClick={() => router.push("/settings")}
                className="ml-1"
              />
              <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 bg-accent text-background text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap z-50">
                {t("settingsTooltip")}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* 2. Mobile Header */}
      <header className="h-14 border-b border-border px-4 flex md:hidden items-center justify-between bg-background shrink-0 select-none animate-in fade-in duration-200">
        {showMobileSearch ? (
          <div className="flex items-center w-full gap-2 animate-in fade-in zoom-in-98 duration-200">
            <div className="relative items-center bg-surface border border-border focus-within:border-text-primary rounded-lg flex flex-1">
              <Icons.Search className="w-4 h-4 text-text-secondary absolute left-2.5 pointer-events-none" />
              <Input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="border-0 bg-transparent px-0 py-0 pl-8 pr-4 text-[12.5px] outline-none focus-visible:border-0 focus-visible:ring-0 text-text-primary placeholder:text-text-muted w-full"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowMobileSearch(false);
                setSearchValue("");
              }}
              aria-label="Close search"
            >
              <Icons.Close className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <>
            {/* Left Area (Breadcrumbs + Mobile Toggle / Back Button) */}
            <div className="flex items-center gap-2">
              {pathname === "/settings" || isMessageDetailMobile ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/")}
                  aria-label="Back to inbox"
                  className="rounded-full"
                >
                  <Icons.ArrowLeft className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMobileMenu}
                  aria-label={t("menuLabel")}
                >
                  <Icons.Menu className="w-5 h-5" />
                </Button>
              )}
              {getBreadcrumbs()}
            </div>

            {/* Right Area (Actions) */}
            <div className="flex items-center gap-2">
              {/* Mobile Search Button */}
              {pathname !== "/settings" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileSearch(true)}
                  aria-label={t("searchTooltip")}
                >
                  <Icons.Search className="w-5 h-5" />
                </Button>
              )}

              {/* Notifications Dropdown Container */}
              <div className="relative" ref={mobileNotificationsRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleNotifications}
                  aria-label={t("notificationsTooltip")}
                  className={`relative ${
                    showNotifications
                      ? "bg-black/5 dark:bg-white/5 text-text-primary"
                      : ""
                  }`}
                >
                  <Icons.Notification className="w-5 h-5" />
                  {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                  )}
                </Button>

                {showNotifications && (
                  <div className="absolute right-[-48px] top-10 mt-1 w-[280px] bg-background border border-border rounded-xl shadow-lg z-50 py-2 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                      <span className="font-semibold text-xs text-text-primary">
                        {t("notificationsTitle")}
                      </span>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={handleClearAll}
                        className="text-[11px]"
                      >
                        {t("clearAll")}
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {unreadEmails.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-text-muted">
                          {t("noNotifications")}
                        </div>
                      ) : (
                        unreadEmails.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => {
                              router.push(`/?messageId=${item.id}`);
                              setShowNotifications(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-surface-hover cursor-pointer border-b border-border/50 last:border-b-0 transition-colors block"
                          >
                            <div className="flex justify-between items-baseline mb-0.5">
                              <span className="font-medium text-[12.5px] text-text-primary">
                                New Mail: {item.fromName || item.fromAddress}
                              </span>
                              <span className="text-[10px] text-text-muted">
                                {formatEmailTime(item.receivedAt)}
                              </span>
                            </div>
                            <p className="text-[11.5px] text-text-secondary line-clamp-1 leading-normal">
                              {item.subject}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <ThemeToggle />

              {mounted && user && (
                <Avatar
                  initials={initials}
                  onClick={() => router.push("/settings")}
                />
              )}
            </div>
          </>
        )}
      </header>
    </>
  );
}
