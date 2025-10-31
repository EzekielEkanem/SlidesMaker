// API Request/Response types
export interface GenerateRequest {
  lyrics: string;
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