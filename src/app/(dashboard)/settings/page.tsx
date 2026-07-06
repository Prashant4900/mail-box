"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useTransition } from "react";
import { setUserLocale } from "@/actions/locale";
import { Button } from "@/components/ui/Button";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { FormField } from "@/components/ui/FormField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { SettingsSection } from "@/components/ui/SettingsSection";
import { useMeQuery } from "@/queries/useAuth";
import { useMailboxAddressesQuery } from "@/queries/useMailboxAddresses";
import {
  useChangePasswordMutation,
  useConfigureCloudflareMutation,
  useDelinkCloudflareMutation,
  useSystemDbInfoQuery,
  useUpdateProfileMutation,
} from "@/queries/useSettings";
import { useAppStore } from "@/store/useAppStore";

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const { data: user, isLoading: userLoading } = useMeQuery();
  const isOwner = user?.role === "OWNER";

  const { data: dbInfo, isLoading: dbInfoLoading } =
    useSystemDbInfoQuery(isOwner);
  const { mutateAsync: updateProfile, isPending: updatingProfile } =
    useUpdateProfileMutation();
  const { mutateAsync: changePassword, isPending: changingPassword } =
    useChangePasswordMutation();

  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const [isPendingLocale, startTransition] = useTransition();

  const { addToast } = useAppStore();

  // Cloudflare Inbound Setup wizard state
  const { data: mailboxData } = useMailboxAddressesQuery();
  const configureCloudflare = useConfigureCloudflareMutation();
  const delinkCloudflare = useDelinkCloudflareMutation();

  const [cfApiToken, setCfApiToken] = useState("");
  const [cfDomain, setCfDomain] = useState("");
  const [cfAppUrl, setCfAppUrl] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1); // -1: idle, 0: verify, 1: routing, 2: dns, 3: worker, 5: success, 99: error
  const [_showLogs, _setShowLogs] = useState(true);
  const [isConfiguringLocal, setIsConfiguringLocal] = useState(false);
  const [isDelinkingLocal, setIsDelinkingLocal] = useState(false);

  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll console to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Prefill app URL at runtime
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCfAppUrl(window.location.origin);
    }
  }, []);

  const mailboxes = mailboxData?.mailboxes || [];
  const uniqueDomains = Array.from(
    new Set(
      mailboxes
        .filter((m) => m.isActive)
        .map((m) => {
          const parts = m.address.split("@");
          return parts.length > 1 ? parts[1] : "";
        })
        .filter(Boolean),
    ),
  );

  // Set default domain from active mailboxes
  useEffect(() => {
    if (uniqueDomains.length > 0 && !cfDomain) {
      setCfDomain(uniqueDomains[0]);
    }
  }, [uniqueDomains, cfDomain]);

  // Check if Cloudflare is linked for any of our mailboxes
  const linkedDomains = Array.from(
    new Set(
      mailboxes
        .filter((m) => m.cloudflareLinked)
        .map((m) => {
          const parts = m.address.split("@");
          return parts.length > 1 ? parts[1] : "";
        })
        .filter(Boolean),
    ),
  );

  const isCloudflareLinked = linkedDomains.length > 0;
  const activeLinkedDomain = linkedDomains[0] || "";

  const handleCloudflareSetup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cfApiToken || !cfDomain) {
      addToast("Please provide both API Token and Domain", "error");
      return;
    }

    setIsConfiguringLocal(true);
    setLogs([
      "[SYSTEM] Initializing automated Cloudflare Setup Wizard...",
      `[SYSTEM] Target Domain: "${cfDomain}"`,
      `[SYSTEM] Target App Webhook URL: "${cfAppUrl || window.location.origin}"`,
      "[API] Connecting to server controller endpoint...",
    ]);
    setCurrentStep(0);

    const timers: NodeJS.Timeout[] = [];

    timers.push(
      setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          "[API] Verifying Cloudflare API Token permissions...",
        ]);
      }, 800),
    );

    timers.push(
      setTimeout(() => {
        setCurrentStep(1);
        setLogs((prev) => [
          ...prev,
          "[API] Locating Zone ID and activating inbound Email Routing...",
        ]);
      }, 2000),
    );

    timers.push(
      setTimeout(() => {
        setCurrentStep(2);
        setLogs((prev) => [
          ...prev,
          "[API] Configuring DNS records (MX: route*.mx.cloudflare.net, TXT: SPF verification)...",
        ]);
      }, 3500),
    );

    timers.push(
      setTimeout(() => {
        setCurrentStep(3);
        setLogs((prev) => [
          ...prev,
          "[API] Compiling and uploading Edge Worker forwarding script...",
          "[API] Binding secure environment parameters (NEXTJS_APP_URL, WEBHOOK_SECRET)...",
        ]);
      }, 5500),
    );

    try {
      const response = await configureCloudflare.mutateAsync({
        apiToken: cfApiToken,
        domain: cfDomain,
        appUrl: cfAppUrl,
      });

      for (const t of timers) clearTimeout(t);

      setCurrentStep(5);
      setLogs((prev) => [
        ...prev,
        "[API] Finalizing catch-all routing rules on Cloudflare DNS...",
        `[SYSTEM] SUCCESS: Domain "${response.domain}" linked. Zone ID: ${response.zoneId}`,
        "[SYSTEM] Live email forwarder is active. All inbound emails will route directly to Next.js webhook.",
      ]);
      addToast("Cloudflare setup completed successfully!", "success");
      setCfApiToken("");
    } catch (err) {
      for (const t of timers) clearTimeout(t);
      setCurrentStep(99);
      setLogs((prev) => [
        ...prev,
        `[ERROR] Execution aborted: ${err instanceof Error ? err.message : "Configuration failed"}`,
        "[SYSTEM] Reverted active transaction. Please review permissions and try again.",
      ]);
      addToast(
        err instanceof Error ? err.message : "Failed to configure Cloudflare",
        "error",
      );
    } finally {
      setIsConfiguringLocal(false);
    }
  };

  const handleCloudflareDelink = async () => {
    if (!cfApiToken) {
      addToast(
        "Please provide your Cloudflare API Token to authorize programmatic removal",
        "error",
      );
      return;
    }

    const domainToDelink = activeLinkedDomain || cfDomain;
    if (!domainToDelink) {
      addToast("No domain found to disconnect", "error");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to disconnect "${domainToDelink}"? This will programmatically delete the Cloudflare Worker and email routing rules.`,
    );
    if (!confirmed) return;

    setIsDelinkingLocal(true);
    setLogs([
      "[SYSTEM] Initializing automated Cloudflare Delink Wizard...",
      `[SYSTEM] Target Domain to disconnect: "${domainToDelink}"`,
      "[API] Connecting to server controller endpoint...",
    ]);
    setCurrentStep(0);

    const timers: NodeJS.Timeout[] = [];

    timers.push(
      setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          "[API] Verifying Cloudflare API Token permissions...",
        ]);
      }, 800),
    );

    timers.push(
      setTimeout(() => {
        setCurrentStep(3);
        setLogs((prev) => [
          ...prev,
          "[API] Scanning and removing catch-all email routing rule pointing to Worker...",
        ]);
      }, 2000),
    );

    timers.push(
      setTimeout(() => {
        setCurrentStep(4);
        setLogs((prev) => [
          ...prev,
          "[API] Programmatically deleting Edge Worker script from your Cloudflare account...",
        ]);
      }, 3800),
    );

    try {
      const response = await delinkCloudflare.mutateAsync({
        apiToken: cfApiToken,
        domain: domainToDelink,
      });

      for (const t of timers) clearTimeout(t);

      setCurrentStep(-1);
      setLogs((prev) => [
        ...prev,
        `[SYSTEM] SUCCESS: Domain "${response.domain}" disconnected.`,
        "[SYSTEM] Inbound email routing stopped. Cloudflare Worker removed cleanly.",
      ]);
      addToast("Domain disconnected successfully", "success");
      setCfApiToken("");
    } catch (err) {
      for (const t of timers) clearTimeout(t);
      setCurrentStep(99);
      setLogs((prev) => [
        ...prev,
        `[ERROR] Cleanup aborted: ${err instanceof Error ? err.message : "Disconnect failed"}`,
        "[SYSTEM] Reverted active transaction.",
      ]);
      addToast(
        err instanceof Error ? err.message : "Failed to disconnect domain",
        "error",
      );
    } finally {
      setIsDelinkingLocal(false);
    }
  };

  // Controlled input states to prevent Base UI warning
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;

    try {
      await updateProfile({ firstName, lastName, email });
      addToast(t("toasts.profileSuccess"), "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : t("toasts.profileError"),
        "error",
      );
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      addToast(t("toasts.passwordMatchError"), "error");
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      addToast(t("toasts.passwordSuccess"), "success");
      e.currentTarget.reset();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : t("toasts.passwordError"),
        "error",
      );
    }
  };

  const toggleLocale = (newLocale: "en" | "es") => {
    if (newLocale === locale) return;
    startTransition(() => {
      setUserLocale(newLocale);
    });
  };

  if (userLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background text-text-secondary text-sm">
        {t("loading")}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background text-center gap-4">
        <p className="text-text-secondary text-sm">{t("loginRequired")}</p>
        <Link
          href="/login"
          className="text-accent hover:underline text-sm font-semibold"
        >
          {t("goToLogin")}
        </Link>
      </div>
    );
  }

  const activeTheme = (theme as "light" | "dark" | "system") || "system";

  const themeOptions = [
    { value: "light", label: t("preferences.themeLight") },
    { value: "dark", label: t("preferences.themeDark") },
    { value: "system", label: t("preferences.themeSystem") },
  ] as const;

  const localeOptions = [
    { value: "en", label: "EN" },
    { value: "es", label: "ES" },
  ] as const;

  return (
    <div className="h-full overflow-y-auto bg-surface/35 text-text-primary px-4 py-5 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="flex w-full flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col gap-0.5 px-1 py-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {t("title")}
          </h1>
          <p className="text-[13px] text-text-secondary">{t("subtitle")}</p>
        </div>

        {/* Profile Settings Section */}
        <SettingsSection
          title={t("profile.title")}
          description={t("profile.subtitle")}
        >
          <form
            onSubmit={handleProfileSubmit}
            className="flex w-full flex-col gap-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                id="firstName"
                name="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                label={t("profile.firstName")}
                required
              />
              <FormField
                id="lastName"
                name="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                label={t("profile.lastName")}
                required
              />
            </div>
            <FormField
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label={t("profile.email")}
              required
            />
            <Button
              type="submit"
              disabled={updatingProfile}
              className="w-fit px-4 h-9 rounded-md font-semibold text-[13px]"
            >
              {updatingProfile ? t("profile.saving") : t("profile.saveChanges")}
            </Button>
          </form>
        </SettingsSection>

        {/* Security Section */}
        <SettingsSection
          title={t("security.title")}
          description={t("security.subtitle")}
        >
          <form
            onSubmit={handlePasswordSubmit}
            className="flex w-full flex-col gap-4"
          >
            <FormField
              id="currentPassword"
              name="currentPassword"
              type="password"
              label={t("security.currentPassword")}
              required
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                id="newPassword"
                name="newPassword"
                type="password"
                label={t("security.newPassword")}
                required
              />
              <FormField
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label={t("security.confirmPassword")}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={changingPassword}
              className="w-fit px-4 h-9 rounded-md font-semibold text-[13px]"
            >
              {changingPassword
                ? t("security.updating")
                : t("security.updatePassword")}
            </Button>
          </form>
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection
          title={t("preferences.title")}
          description={t("preferences.subtitle")}
        >
          <div className="flex w-full flex-col gap-5">
            {/* Theme Toggle */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <span className="text-[13.5px] font-semibold text-text-primary">
                  {t("preferences.themeMode")}
                </span>
                <p className="text-[12.5px] text-text-secondary">
                  {t("preferences.themeSubtitle")}
                </p>
              </div>
              <SegmentedControl
                options={themeOptions}
                value={activeTheme}
                onChange={setTheme}
                capitalize
              />
            </div>

            {/* Language Toggle */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <span className="text-[13.5px] font-semibold text-text-primary">
                  {t("preferences.language")}
                </span>
                <p className="text-[12.5px] text-text-secondary">
                  {t("preferences.languageSubtitle")}
                </p>
              </div>
              <SegmentedControl
                options={localeOptions}
                value={locale as "en" | "es"}
                onChange={toggleLocale}
                disabled={isPendingLocale}
                uppercase
              />
            </div>
          </div>
        </SettingsSection>

        {/* Cloudflare Integration Section */}
        <SettingsSection
          title={t("cloudflare.title")}
          description={t("cloudflare.subtitle")}
        >
          <div className="flex w-full flex-col gap-4">
            {isCloudflareLinked ? (
              <div className="flex flex-col gap-4">
                <div className="p-4 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-sm flex flex-col gap-2 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold">
                      {t("cloudflare.linkedStatus")}:
                    </span>
                  </div>
                  <span className="text-sm font-semibold bg-emerald-500/20 px-3 py-1.5 w-fit rounded-md border border-emerald-500/20">
                    {activeLinkedDomain}
                  </span>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                    {t("cloudflare.routedDirectly")}
                  </p>
                </div>

                <div className="flex flex-col gap-4 mt-2 border border-border bg-surface p-4 rounded-md">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {t("cloudflare.disconnectTitle")}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {t("cloudflare.disconnectDesc")}
                  </p>
                  <FormField
                    id="cfApiToken"
                    name="cfApiToken"
                    type="password"
                    value={cfApiToken}
                    onChange={(e) => setCfApiToken(e.target.value)}
                    label={t("cloudflare.confirmApiToken")}
                    placeholder={t("cloudflare.confirmApiTokenPlaceholder")}
                    disabled={isDelinkingLocal}
                    required
                  />
                  <Button
                    type="button"
                    onClick={handleCloudflareDelink}
                    disabled={isDelinkingLocal || !cfApiToken}
                    variant="destructive"
                    className="w-full mt-2"
                  >
                    {isDelinkingLocal
                      ? t("cloudflare.removingScript")
                      : t("cloudflare.delink")}
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleCloudflareSetup}
                className="flex flex-col gap-4"
              >
                {uniqueDomains.length === 0 ? (
                  <div className="text-xs text-warning bg-warning/10 border border-warning/20 p-4 font-mono leading-relaxed rounded-none">
                    <div className="font-bold mb-1 uppercase tracking-wider">
                      {t("cloudflare.noDomainAvailable")}
                    </div>
                    {t("cloudflare.noDomainAvailableDesc")}
                  </div>
                ) : (
                  <>
                    <FormField
                      id="cfApiToken"
                      name="cfApiToken"
                      type="password"
                      value={cfApiToken}
                      onChange={(e) => setCfApiToken(e.target.value)}
                      label={t("cloudflare.apiToken")}
                      placeholder={t("cloudflare.apiTokenPlaceholder")}
                      disabled={isConfiguringLocal}
                      required
                    />

                    <div className="flex flex-col gap-1.5 w-full">
                      <label
                        htmlFor="cfDomain"
                        className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary"
                      >
                        {t("cloudflare.domain")}
                      </label>
                      <Select
                        value={cfDomain}
                        onValueChange={(val) => setCfDomain(val ?? "")}
                        disabled={isConfiguringLocal}
                      >
                        <SelectTrigger id="cfDomain">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueDomains.map((dom) => (
                            <SelectItem key={dom} value={dom}>
                              {dom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <FormField
                      id="cfAppUrl"
                      name="cfAppUrl"
                      type="text"
                      value={cfAppUrl}
                      onChange={(e) => setCfAppUrl(e.target.value)}
                      label={t("cloudflare.appUrl")}
                      placeholder="https://your-domain.com"
                      disabled={isConfiguringLocal}
                      required
                    />

                    <Button
                      type="submit"
                      disabled={
                        isConfiguringLocal || !cfApiToken || !cfDomain
                      }
                      className="w-full mt-2"
                    >
                      {isConfiguringLocal
                        ? t("cloudflare.configuringSetup")
                        : t("cloudflare.submit")}
                    </Button>
                  </>
                )}
              </form>
            )}
          </div>
        </SettingsSection>

        {/* System Info Diagnostics Section (Owners Only) */}
        {isOwner && (
          <SettingsSection
            title={t("diagnostics.title")}
            description={t("diagnostics.subtitle")}
          >
            <div className="w-full">
              {dbInfoLoading ? (
                <div className="text-[13px] text-text-secondary">
                  {t("diagnostics.loading")}
                </div>
              ) : dbInfo ? (
                <div className="border border-border rounded-lg bg-surface divide-y divide-border">
                  <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                    <span className="font-semibold text-text-secondary">
                      {t("diagnostics.dbEngine")}
                    </span>
                    <span className="font-mono bg-background px-2 py-0.5 border border-border rounded text-[12px]">
                      {dbInfo.engine}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                    <span className="font-semibold text-text-secondary">
                      {t("diagnostics.activeSchema")}
                    </span>
                    <span className="font-mono text-[12px] break-all">
                      {dbInfo.schemaPath}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                    <span className="font-semibold text-text-secondary">
                      {t("diagnostics.dbUrl")}
                    </span>
                    <span className="font-mono text-[11.5px] break-all text-text-secondary">
                      {dbInfo.url}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                    <span className="font-semibold text-text-secondary">
                      {t("diagnostics.totalUsers")}
                    </span>
                    <span>{dbInfo.metrics?.users ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                    <span className="font-semibold text-text-secondary">
                      {t("diagnostics.activeSessions")}
                    </span>
                    <span>{dbInfo.metrics?.sessions ?? 0}</span>
                  </div>
                </div>
              ) : (
                <FeedbackBanner type="error" message={t("diagnostics.error")} />
              )}
            </div>
          </SettingsSection>
        )}
      </div>
    </div>
  );
}
