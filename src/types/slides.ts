// Google Slides API request types
export interface SlideRequest {
  createSlide?: {
    objectId: string;
    slideLayoutReference: {
      predefinedLayout: string;
    };
  };
  createShape?: {
    objectId: string;
    shapeType: string;
    elementProperties: {
      pageObjectId: string;
      size: {
        width: { magnitude: number; unit: string };
        height: { magnitude: number; unit: string };
      };
      transform: {
        scaleX: number;
        scaleY: number;
        translateX: number;
        translateY: number;
        unit: string;
      };
    };
  };
  insertText?: {
    objectId: string;
    text: string;
  };
  updateTextStyle?: {
    objectId: string;
    style: any;
    textRange: { type: string };
    fields: string;
  };
  updateParagraphStyle?: {
    objectId: string;
    style: {
      alignment?: string;
    };
    textRange: { type: string };
    fields: string;
  };
  updatePageProperties?: {
    objectId: string;
    pageProperties: {
      pageBackgroundFill: {
        solidFill: {
          color: {
            rgbColor: {
              red: number;
              green: number;
              blue: number;
            };
          };
        };
      };
    };
    fields: string;
  };
  updateShapeProperties?: {
    objectId: string;
    shapeProperties: {
      shapeAutoSize: string;
    };
    fields: string;
  };
  deleteObject?: {
    objectId: string;
  };
}