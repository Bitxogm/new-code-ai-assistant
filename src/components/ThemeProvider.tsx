import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      // Since our default :root is dark, we only need to add 'light' if system is light
      // But wait, if we want to support Tailwind's 'dark:' prefix, we might need 'dark' class too?
      // The CSS has :root (dark) and .light (light).
      // If system is light, add 'light'.
      // If system is dark, add nothing (or 'dark' if we want to be explicit, but :root handles it).
      // However, for Tailwind's `darkMode: 'class'`, it expects 'dark' class for dark mode.
      // Let's check if we need to adjust the CSS strategy.
      // If I add 'dark' class, does it break anything? No.
      // But if I add 'light' class, it uses .light variables.

      // Let's stick to: if light -> add 'light'. If dark -> remove 'light'.
      // But wait, if I want to use Tailwind's `dark:` modifier, I need `dark` class present when it's dark.
      // Currently :root has the dark variables.
      // If I add 'dark' class, it won't hurt.
      // If I add 'light' class, it overrides variables.

      // Actually, looking at the CSS again:
      // :root { ...dark vars... }
      // .light { ...light vars... }

      // If I want to use `dark:bg-slate-900`, Tailwind looks for `dark` class.
      // So I SHOULD add `dark` class when in dark mode.

      if (systemTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }
      return;
    }

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
}
