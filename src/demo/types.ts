export type DemoItemCategory = "login" | "secret" | "card" | "note";

export type DemoNavView = "vault" | "favorites" | "cards" | "notes";

export interface DemoVaultItem {
  id: string;
  name: string;
  username: string;
  password: string;
  website?: string;
  notes?: string;
  category: DemoItemCategory;
  tag: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  /** Tailwind gradient classes for icon tile */
  color: string;
  /** Lucide icon name key */
  icon: string;
}
