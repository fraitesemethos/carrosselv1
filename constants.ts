import { AspectRatio, EditorSettings } from './types';

export const ASPECT_RATIOS: AspectRatio[] = ['1:1', '4:5', '9:16'];

export const FONT_FACES = ['Poppins', 'Inter', 'Roboto', 'Montserrat'];

export const INITIAL_EDITOR_SETTINGS: EditorSettings = {
  fontFamily: 'Poppins',
  titleFontSize: 48,
  subtitleFontSize: 24,
  textColor: '#FFFFFF',
  textPosition: 'middle',
  textAlign: 'center',
  textOpacity: 1,
  paddingX: 24,
  paddingY: 32,
  overlayColor: '#000000',
  overlayOpacity: 0.2,
  textShadowColor: '#000000',
  textShadowBlur: 4,
  textShadowOpacity: 0.5,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  textStrokeWidth: 0,
  textStrokeColor: '#000000',
  titleSubtitleSpacing: 12,
};

export const INITIAL_CAROUSEL_SLIDE_SETTINGS: EditorSettings = {
  ...INITIAL_EDITOR_SETTINGS,
  textPosition: 'bottom',
  paddingY: 40, // Aumenta um pouco o espaçamento vertical para a posição na base
  overlayOpacity: 0.3,
  titleSubtitleSpacing: 12,
};


// Carousel Layout Presets
const MINIMALIST_LAYOUT: EditorSettings = {
    ...INITIAL_CAROUSEL_SLIDE_SETTINGS,
    fontFamily: 'Inter',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    titleFontSize: 40,
    subtitleFontSize: 20,
    textColor: '#FFFFFF',
    textPosition: 'bottom',
    textAlign: 'left',
    paddingX: 40,
    paddingY: 40,
    overlayColor: '#000000',
    overlayOpacity: 0.2,
    textShadowColor: '#000000',
    textShadowBlur: 5,
    textShadowOpacity: 0.3,
    textStrokeWidth: 0,
    textStrokeColor: '#000000',
    titleSubtitleSpacing: 10,
};

const BOLD_LAYOUT: EditorSettings = {
    ...INITIAL_CAROUSEL_SLIDE_SETTINGS,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textDecoration: 'none',
    titleFontSize: 64,
    subtitleFontSize: 28,
    textColor: '#FFFFFF',
    textPosition: 'middle',
    textAlign: 'center',
    paddingX: 20,
    paddingY: 20,
    overlayColor: '#111827',
    overlayOpacity: 0.4,
    textShadowColor: '#000000',
    textShadowBlur: 8,
    textShadowOpacity: 0.7,
    textStrokeWidth: 1,
    textStrokeColor: '#000000',
    titleSubtitleSpacing: 16,
};

const CLASSIC_LAYOUT: EditorSettings = {
    ...INITIAL_CAROUSEL_SLIDE_SETTINGS,
    fontFamily: 'Montserrat',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    titleFontSize: 52,
    subtitleFontSize: 22,
    textColor: '#F3F4F6',
    textPosition: 'middle',
    textAlign: 'center',
    paddingX: 50,
    paddingY: 50,
    overlayColor: '#000000',
    overlayOpacity: 0.3,
    textShadowColor: '#000000',
    textShadowBlur: 2,
    textShadowOpacity: 0.6,
    textStrokeWidth: 0,
    textStrokeColor: '#000000',
    titleSubtitleSpacing: 14,
};


export const LAYOUT_PRESETS = [
    { name: 'Minimalista', settings: MINIMALIST_LAYOUT },
    { name: 'Ousado', settings: BOLD_LAYOUT },
    { name: 'Clássico', settings: CLASSIC_LAYOUT },
];