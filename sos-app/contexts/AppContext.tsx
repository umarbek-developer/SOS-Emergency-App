import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  ActiveEmergency,
  AppSettings,
  Contact,
  HealthProfile,
} from "@/types";

export interface ToastState {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
}

const STORAGE_KEY = "sos.app.state.v1";

interface PersistedState {
  contacts: Contact[];
  health: HealthProfile;
  settings: AppSettings;
}

const DEFAULT_HEALTH: HealthProfile = {
  fullName: "",
  dateOfBirth: "",
  bloodType: "",
  allergies: "",
  medications: "",
  conditions: "",
  notes: "",
};

const DEFAULT_SETTINGS: AppSettings = {
  notifications: true,
  vibration: true,
  sound: true,
  shareLocation: true,
  autoCall: false,
  holdSeconds: 3,
};

const DEFAULT_SERVICES: Contact[] = [
  {
    id: "svc-911",
    name: "911",
    phone: "911",
    relation: "Police · Fire · Ambulance",
    isService: true,
  },
  {
    id: "svc-112",
    name: "112",
    phone: "112",
    relation: "Europe emergency line",
    isService: true,
  },
  {
    id: "svc-103",
    name: "103",
    phone: "103",
    relation: "Ambulance",
    isService: true,
  },
];

const DEFAULT_CONTACTS: Contact[] = [
  { id: "demo-mom", name: "Mom", phone: "", relation: "Mother" },
  { id: "demo-dad", name: "Dad", phone: "", relation: "Father" },
  { id: "demo-sis", name: "Sis", phone: "", relation: "Sister" },
  { id: "demo-bro", name: "Bro", phone: "", relation: "Brother" },
];

interface AppContextValue extends PersistedState {
  isReady: boolean;
  active: ActiveEmergency | null;
  toast: ToastState | null;
  startEmergency: (emergency: ActiveEmergency) => void;
  endEmergency: () => void;
  upsertContact: (contact: Contact) => void;
  removeContact: (id: string) => void;
  updateHealth: (patch: Partial<HealthProfile>) => void;
  setHealth: (next: HealthProfile) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  showToast: (message: string, tone?: ToastState["tone"]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([
    ...DEFAULT_SERVICES,
    ...DEFAULT_CONTACTS,
  ]);
  const [health, setHealth] = useState<HealthProfile>(DEFAULT_HEALTH);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [active, setActive] = useState<ActiveEmergency | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastIdRef = useRef<number>(0);

  const showToast = useCallback(
    (message: string, tone: ToastState["tone"] = "success") => {
      toastIdRef.current += 1;
      setToast({ id: toastIdRef.current, message, tone });
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToast(null), 2400);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedState>;
          if (parsed.contacts) setContacts(parsed.contacts);
          if (parsed.health) setHealth({ ...DEFAULT_HEALTH, ...parsed.health });
          if (parsed.settings)
            setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        }
      } catch {
        // ignore
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const payload: PersistedState = { contacts, health, settings };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [contacts, health, settings, isReady]);

  const upsertContact = useCallback((contact: Contact) => {
    setContacts((prev) => {
      const exists = prev.some((c) => c.id === contact.id);
      if (exists) return prev.map((c) => (c.id === contact.id ? contact : c));
      return [...prev, contact];
    });
  }, []);

  const removeContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateHealth = useCallback((patch: Partial<HealthProfile>) => {
    setHealth((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const startEmergency = useCallback((emergency: ActiveEmergency) => {
    setActive(emergency);
  }, []);

  const endEmergency = useCallback(() => {
    setActive(null);
  }, []);

  const replaceHealth = useCallback((next: HealthProfile) => {
    setHealth(next);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      contacts,
      health,
      settings,
      isReady,
      active,
      toast,
      startEmergency,
      endEmergency,
      upsertContact,
      removeContact,
      updateHealth,
      setHealth: replaceHealth,
      updateSettings,
      showToast,
    }),
    [
      contacts,
      health,
      settings,
      isReady,
      active,
      toast,
      startEmergency,
      endEmergency,
      upsertContact,
      removeContact,
      updateHealth,
      replaceHealth,
      updateSettings,
      showToast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
