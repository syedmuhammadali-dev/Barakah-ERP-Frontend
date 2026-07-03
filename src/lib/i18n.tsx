import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppLocale = "en" | "ur";

const STORAGE_KEY = "barakah-locale";

const messages = {
  en: {
    common: {
      english: "English",
      urdu: "Urdu",
      loading: "Loading...",
      back: "Back",
      themeLight: "Light",
      themeDark: "Dark",
    },
    nav: {
      dashboard: "Dashboard",
      inventory: "Inventory",
      sales: "Sales",
      reports: "Reports",
      zakat: "Zakat",
      salesmen: "Salesmen",
      suppliers: "Suppliers",
      settings: "Settings",
      subscription: "Subscription",
      logout: "Logout",
    },
    auth: {
      login: "Log in",
      signup: "Sign up",
      backHome: "Back to home",
      signInHeading: "Welcome back",
      signInSubheading: "Enter your email and password to continue.",
      createHeading: "Create your account",
      createSubheading: "Set up a new Barakah ERP account for your store.",
      email: "Email",
      firstName: "First name",
      lastName: "Last name",
      password: "Password",
      confirmPassword: "Confirm password",
      showPassword: "Show password",
      hidePassword: "Hide password",
      createAccount: "Create account",
      signIn: "Sign in",
      needAccount: "Need an account?",
      haveAccount: "Already have an account?",
      backToLogin: "Back to login",
      backToHome: "Back to home",
    },
    landing: {
      login: "Log in",
      signup: "Sign up",
      getStarted: "Get Started",
      bookDemo: "Book a Demo",
      pricingCurrency: "PKR",
    },
    sales: {
      addSale: "Add Sale",
      exportCsv: "Export CSV",
    },
    inventory: {
      addProduct: "Add Product",
    },
    suppliers: {
      addSupplier: "Add Supplier",
    },
    theme: {
      toggleToLight: "Light theme",
      toggleToDark: "Dark theme",
    },
    route: {
      loading: "Loading page...",
    },
  },
  ur: {
    common: {
      english: "English",
      urdu: "اردو",
      loading: "لوڈ ہو رہا ہے...",
      back: "واپس",
      themeLight: "روشن",
      themeDark: "تاریک",
    },
    nav: {
      dashboard: "ڈیش بورڈ",
      inventory: "انوینٹری",
      sales: "سیلز",
      reports: "رپورٹس",
      zakat: "زکات",
      salesmen: "سیلز مین",
      suppliers: "سپلائرز",
      settings: "سیٹنگز",
      subscription: "سبسکرپشن",
      logout: "لاگ آؤٹ",
    },
    auth: {
      login: "لاگ ان",
      signup: "سائن اپ",
      backHome: "ہوم پر واپس",
      signInHeading: "خوش آمدید",
      signInSubheading: "جاری رکھنے کے لیے ای میل اور پاس ورڈ درج کریں۔",
      createHeading: "نیا اکاؤنٹ بنائیں",
      createSubheading: "اپنے اسٹور کے لیے Barakah ERP اکاؤنٹ بنائیں۔",
      email: "ای میل",
      firstName: "پہلا نام",
      lastName: "آخری نام",
      password: "پاس ورڈ",
      confirmPassword: "پاس ورڈ دوبارہ لکھیں",
      showPassword: "پاس ورڈ دکھائیں",
      hidePassword: "پاس ورڈ چھپائیں",
      createAccount: "اکاؤنٹ بنائیں",
      signIn: "لاگ ان",
      needAccount: "اکاؤنٹ نہیں ہے؟",
      haveAccount: "پہلے سے اکاؤنٹ ہے؟",
      backToLogin: "لاگ ان پر واپس",
      backToHome: "ہوم پر واپس",
    },
    landing: {
      login: "لاگ ان",
      signup: "سائن اپ",
      getStarted: "شروع کریں",
      bookDemo: "ڈیمو بک کریں",
      pricingCurrency: "PKR",
    },
    sales: {
      addSale: "سیل شامل کریں",
      exportCsv: "CSV ایکسپورٹ",
    },
    inventory: {
      addProduct: "پروڈکٹ شامل کریں",
    },
    suppliers: {
      addSupplier: "سپلائر شامل کریں",
    },
    theme: {
      toggleToLight: "روشن تھیم",
      toggleToDark: "تاریک تھیم",
    },
    route: {
      loading: "صفحہ لوڈ ہو رہا ہے...",
    },
  },
} as const;

type TranslationKey = string;
type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
  isUrdu: boolean;
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function resolveMessage(locale: AppLocale, key: TranslationKey) {
  const segments = key.split(".");
  let current: unknown = messages[locale];
  for (const segment of segments) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      current = undefined;
      break;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  if (typeof current === "string") {
    return current;
  }

  let fallback: unknown = messages.en;
  for (const segment of segments) {
    if (!fallback || typeof fallback !== "object" || !(segment in fallback)) {
      fallback = undefined;
      break;
    }
    fallback = (fallback as Record<string, unknown>)[segment];
  }

  return typeof fallback === "string" ? fallback : key;
}

function getInitialLocale(): AppLocale {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "ur") return "ur";
  return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => getInitialLocale());

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = "ltr";
    }
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = (nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
  };

  const toggleLocale = () => {
    setLocaleState((current) => (current === "en" ? "ur" : "en"));
  };

  const t = useMemo(
    () => (key: TranslationKey) => resolveMessage(locale, key),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      isUrdu: locale === "ur",
      t,
    }),
    [locale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useAppLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useAppLocale must be used within LocaleProvider");
  }

  return context;
}
