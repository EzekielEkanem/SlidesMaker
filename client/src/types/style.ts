export interface SlideStyle {
  fontFamily?: string;
  fontSize?: number;
  backgroundColor?: string;
  fontColor?: string;
  isAutoFit?: boolean;
  isBold?: boolean;
  isItalic?: boolean;
  isCentered?: boolean;
}

export const DEFAULT_STYLE: SlideStyle = {
  fontFamily: 'Times New Roman',
  fontSize: 24,
  backgroundColor: '#ffffff',
  fontColor: '#000000',
  isAutoFit: true,
  isBold: true,
  isItalic: false,
  isCentered: true
};

export const FONT_FAMILIES = [
  'Arial',
  'Roboto',
  'Montserrat',
  'Open Sans',
  'Lato',
  'Georgia',
  'Times New Roman'
];