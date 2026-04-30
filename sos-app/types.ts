export type EmergencyType =
  | "medical"
  | "fire"
  | "accident"
  | "violence"
  | "rescue"
  | "other";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  isService?: boolean;
}

export interface HealthProfile {
  fullName: string;
  dateOfBirth: string;
  bloodType: string;
  allergies: string;
  medications: string;
  conditions: string;
  notes: string;
}

export interface AppSettings {
  notifications: boolean;
  vibration: boolean;
  sound: boolean;
  shareLocation: boolean;
  autoCall: boolean;
  holdSeconds: number;
}

export interface ActiveEmergency {
  type: EmergencyType;
  startedAt: number;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null;
  notifiedContactIds: string[];
}

export interface EmergencyTypeMeta {
  key: EmergencyType;
  label: string;
  short: string;
  icon: string;
  color: string;
  subtitle: string;
  tips: [string, string, string];
}

export const EMERGENCY_TYPES: EmergencyTypeMeta[] = [
  {
    key: "medical",
    label: "Medical",
    short: "Medical emergency",
    icon: "medkit",
    color: "#ef4444",
    subtitle: "Stay calm. Help is on the way.",
    tips: [
      "Stay on the line — tell the dispatcher your exact location.",
      "Don't move an injured person unless they are in immediate danger.",
      "If trained, start CPR and keep going until help arrives.",
    ],
  },
  {
    key: "fire",
    label: "Fire",
    short: "Fire / smoke",
    icon: "flame",
    color: "#f97316",
    subtitle: "Get out now. Don't go back inside.",
    tips: [
      "Get low and crawl under smoke — cleaner air is near the floor.",
      "Close doors behind you to slow the fire from spreading.",
      "Meet at your assembly point and wait for the fire service.",
    ],
  },
  {
    key: "accident",
    label: "Accident",
    short: "Crash or fall",
    icon: "car-sport",
    color: "#facc15",
    subtitle: "Stay still. Don't move the injured.",
    tips: [
      "Turn on hazard lights and secure the scene if it's safe to do so.",
      "Don't move injured people — spinal injuries can worsen with movement.",
      "Keep bystanders back and the area clear for emergency vehicles.",
    ],
  },
  {
    key: "violence",
    label: "Violence",
    short: "Assault or threat",
    icon: "shield",
    color: "#a855f7",
    subtitle: "Get to safety. Don't confront.",
    tips: [
      "Move to a crowded, public place or a locked room immediately.",
      "Don't argue or fight back — your safety is the only priority.",
      "If you can't speak, stay on the line — dispatchers are trained to help.",
    ],
  },
  {
    key: "rescue",
    label: "Rescue",
    short: "Trapped or lost",
    icon: "help-buoy",
    color: "#06b6d4",
    subtitle: "Stay put. Rescuers will find you.",
    tips: [
      "Stay where you are if it's safe — moving makes you harder to find.",
      "Signal rescuers with noise, waving, or a flashlight.",
      "Conserve phone battery — turn off apps and lower brightness.",
    ],
  },
  {
    key: "other",
    label: "Other",
    short: "Something else",
    icon: "alert-circle",
    color: "#94a3b8",
    subtitle: "Describe clearly. Stay on the line.",
    tips: [
      "Give your exact location first — street, building, floor.",
      "Describe what you see in simple, clear terms.",
      "Follow the dispatcher's instructions and stay on the line.",
    ],
  },
];
