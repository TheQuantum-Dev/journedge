export interface Trade {
  id: string;
  date: string;
  symbol: string;
  underlying: string;
  type: string;
  direction: string;
  optionType?: string;
  strike?: number;
  expiry?: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  commission: number;
  fees: number;
  pnl: number;
  status: string;
  entryTime?: string;
  exitTime?: string;
  rr?: string;
  tags?: string[] | string;
  journalEntry?: string;
  link?: string;
  imageUrls?: string[] | string;
  accountId?: string;
}

export interface Account {
  id: string;
  name: string;
  broker: string;
  initialBalance: number;
  currency: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface JournalTemplate {
  id: string;
  name: string;
  content: string;
  scope: string;
  createdAt: string;
}

export type PageId =
  | "dashboard"
  | "journal"
  | "journal-editor"
  | "analytics"
  | "calendar"
  | "import"
  | "accounts"
  | "settings"
  | "export";
  