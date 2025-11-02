// API Request/Response types
export interface GenerateRequest {
  lyrics: string;
  presentationTitle?: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    backgroundColor?: string;
    fontColor?: string;
    isAutoFit?: boolean;
    isBold?: boolean;
    isItalic?: boolean;
    isCentered?: boolean;
  };
}

export interface GenerateResponse {
  presentationUrl: string;
  slideCount: number;
}

export interface ErrorResponse {
  error: string;
  code?: string;
}

// Phase 3 — AI-powered lyrics fetching
export interface FindLyricsRequest {
  title: string;
  artist: string;
}

export interface FindLyricsResponse {
  lyrics: string;
}

// Hymn search (Deeper Life Bible Church)
export interface FindHymnRequest {
  number?: string;
  title?: string;
}

export interface FindHymnResponse {
  hymn: string;
  title: string;
  number: string;
}

// Theme suggestion (AI-powered)
export interface SuggestThemeRequest {
  lyrics: string;
}

export interface SuggestThemeResponse {
  backgroundColor: string; // e.g. #RRGGBB
  fontColor: string;       // e.g. #RRGGBB
  fontFamily: string;      // web-safe/common font
  title?: string;          // optional presentation title
}