// Fix: Removed self-import which was causing declaration conflicts.

export type AspectRatio = '1:1' | '4:5' | '9:16';
export type GenerationMode = 'single' | 'carousel';

export interface AdCopyVariation {
  title: string;
  subtitle: string;
  body: string;
  caption: string;
  backgroundPrompt: string;
}

export interface AdCreative extends AdCopyVariation {
  id: string;
  imageUrl: string;
  settings?: EditorSettings;
  audioB64?: string;
}

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imagePrompt: string;
  settings: EditorSettings;
  isGenerating?: boolean;
  isDownloading?: boolean;
}

export interface CarouselCreative {
  id: string;
  slides: CarouselSlide[];
  caption: string;
}

export interface EditorSettings {
  fontFamily: string;
  titleFontSize: number;
  subtitleFontSize: number;
  textColor: string;
  textPosition: 'top' | 'middle' | 'bottom';
  textAlign: 'left' | 'center' | 'right';
  textOpacity: number;
  paddingX: number;
  paddingY: number;
  overlayColor: string;
  overlayOpacity: number;
  textShadowColor: string;
  textShadowBlur: number;
  textShadowOpacity: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textStrokeWidth: number;
  textStrokeColor: string;
  titleSubtitleSpacing: number;
}

export interface GlobalStyleSettings {
  fontFamily: string;
  textColor: string;
  titleFontSize: number;
  subtitleFontSize: number;
  overlayColor: string;
  overlayOpacity: number;
  textShadowColor: string;
  textShadowBlur: number;
  textShadowOpacity: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textStrokeWidth: number;
  textStrokeColor: string;
  titleSubtitleSpacing: number;
}

export type HistoryItem =
  | { type: 'single'; content: AdCreative }
  | { type: 'carousel'; content: CarouselCreative };