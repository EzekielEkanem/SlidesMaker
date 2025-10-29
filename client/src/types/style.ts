export interface SlideStyle {
  fontFamily?: string;
  fontSize?: number;
  backgroundColor?: string;
  fontColor?: string;
  isAutoFit?: boolean;
}

export const DEFAULT_STYLE: SlideStyle = {
  fontFamily: 'Arial',
  fontSize: 24,
  backgroundColor: '#ffffff',
  fontColor: '#000000',
  isAutoFit: true
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