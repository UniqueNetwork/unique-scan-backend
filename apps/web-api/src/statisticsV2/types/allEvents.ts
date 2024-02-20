export interface AllEventsResponseItem {
  section: string;
  method: string;
  count: number;
}

export interface AllEventsResponse {
  items: AllEventsResponseItem[];
}
