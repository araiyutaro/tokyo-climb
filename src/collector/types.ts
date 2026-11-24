export interface FeedArticle {
  title: string;
  body: string;
  url: string;
  publishedAt?: string;
}

export interface ExtractContext {
  gymId: string;
  sourceLabel: string;
  storeKeyword?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}
