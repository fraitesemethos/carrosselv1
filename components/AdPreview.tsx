
import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { AdCreative, AspectRatio, EditorSettings } from '../types';

interface AdPreviewProps {
  creative: AdCreative;
  aspectRatio: AspectRatio;
  settings: EditorSettings;
  onTextChange?: (field: 'title' | 'subtitle', value: string) => void;
}

const hexToRgba = (hex: string, opacity: number): string => {
  let c: any;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${opacity})`;
  }
  // Fallback for invalid hex
  return `rgba(0,0,0,${opacity})`;
};


const AdPreview = forwardRef<HTMLDivElement, AdPreviewProps>(({ creative, aspectRatio, settings, onTextChange }, ref) => {
  const aspectClasses = {
    '1:1': 'aspect-square w-full max-w-[600px]',
    '4:5': 'aspect-[4/5] w-full max-w-[480px]',
    '9:16': 'aspect-[9/16] w-full max-w-[338px]',
  };

  const positionClasses = {
    top: 'justify-start',
    middle: 'justify-center',
    bottom: 'justify-end',
  };

  const textAlignClasses = {
    left: 'items-start',
    center: 'items-center',
    right: 'items-end',
  };
  
  const textBaseStyle: React.CSSProperties = {
    fontFamily: `'${settings.fontFamily}', sans-serif`,
    color: settings.textColor,
    opacity: settings.textOpacity,
    textAlign: settings.textAlign,
    textShadow: `0px 2px ${settings.textShadowBlur}px ${hexToRgba(settings.textShadowColor, settings.textShadowOpacity)}`,
    fontWeight: settings.fontWeight,
    fontStyle: settings.fontStyle,
    textDecoration: settings.textDecoration,
    WebkitTextStroke: settings.textStrokeWidth > 0 ? `${settings.textStrokeWidth}px ${settings.textStrokeColor}` : 'unset',
    outline: 'none',
  };

  const [toolbar, setToolbar] = useState<{ visible: boolean; top: number; left: number; field: 'title' | 'subtitle' | null }>({ visible: false, top: 0, left: 0, field: null });
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (
        toolbar.visible &&
        !toolbarRef.current?.contains(targetNode) &&
        !titleRef.current?.contains(targetNode) &&
        !subtitleRef.current?.contains(targetNode)
      ) {
        setToolbar({ ...toolbar, visible: false });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [toolbar.visible]);


  const handleSelectionChange = (field: 'title' | 'subtitle') => {
    if (!onTextChange) return;

    setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const parentEditable = (field === 'title' ? titleRef.current : subtitleRef.current);

            if (!parentEditable || !parentEditable.contains(range.commonAncestorContainer)) {
                if (toolbar.visible) setToolbar(prev => ({ ...prev, visible: false }));
                return;
            }

            const rect = range.getBoundingClientRect();
            const containerRect = (ref as React.RefObject<HTMLDivElement>)?.current?.getBoundingClientRect();

            if (!containerRect) return;

            setToolbar({
                visible: true,
                top: rect.top - containerRect.top - 45,
                left: rect.left - containerRect.left + rect.width / 2,
                field
            });
        } else {
            if (toolbar.visible) setToolbar(prev => ({ ...prev, visible: false }));
        }
    }, 1);
  };

  const handleBlur = (e: React.FocusEvent<HTMLHeadingElement | HTMLParagraphElement>, field: 'title' | 'subtitle') => {
    if (onTextChange && e.currentTarget.innerHTML !== creative[field]) {
      onTextChange(field, e.currentTarget.innerHTML);
    }
  };

  const applyStyle = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value);
    
    const field = toolbar.field;
    if (onTextChange && field) {
        const element = field === 'title' ? titleRef.current : subtitleRef.current;
        if (element) {
            onTextChange(field, element.innerHTML);
        }
    }
  };

  const Toolbar = () => (
    <div
      ref={toolbarRef}
      className="rich-text-toolbar absolute z-20 bg-gray-900 text-white p-1 rounded-md shadow-xl flex gap-1 items-center"
      style={{
        top: toolbar.top,
        left: toolbar.left,
        transform: 'translateX(-50%)',
        opacity: toolbar.visible ? 1 : 0,
        visibility: toolbar.visible ? 'visible' : 'hidden',
        transition: 'opacity 0.15s ease-in-out, visibility 0.15s ease-in-out',
      }}
      onMouseDown={e => e.preventDefault()}
    >
      <button onClick={() => applyStyle('bold')} className="font-bold w-8 h-8 hover:bg-gray-700 rounded transition-colors">B</button>
      <button onClick={() => applyStyle('italic')} className="italic w-8 h-8 hover:bg-gray-700 rounded transition-colors">I</button>
      <div className="w-8 h-8 relative flex items-center justify-center hover:bg-gray-700 rounded">
        <input
            type="color"
            onChange={e => applyStyle('foreColor', e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <span className="pointer-events-none text-white font-bold" style={{ textShadow: '1px 1px 1px #000' }}>A</span>
      </div>
    </div>
  );

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-white rounded-lg shadow-2xl transition-all duration-300 ${aspectClasses[aspectRatio]}`}
      style={{
        backgroundImage: `url(${creative.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div 
        className="absolute inset-0 transition-all duration-300"
        style={{
            backgroundColor: settings.overlayColor,
            opacity: settings.overlayOpacity
        }}
      />
      
      {onTextChange && <Toolbar />}

      <div 
        className={`relative z-10 h-full w-full flex flex-col transition-all duration-300 ${positionClasses[settings.textPosition]} ${textAlignClasses[settings.textAlign]}`}
        style={{
          padding: `${settings.paddingY}px ${settings.paddingX}px`,
        }}
      >
        <h2
          ref={titleRef}
          key={`${creative.id}-title`}
          contentEditable={!!onTextChange}
          suppressContentEditableWarning={true}
          onMouseUp={() => handleSelectionChange('title')}
          onKeyUp={() => handleSelectionChange('title')}
          onBlur={(e) => handleBlur(e, 'title')}
          style={{
            ...textBaseStyle,
            fontSize: `${settings.titleFontSize}px`,
            lineHeight: 1.1,
            marginBottom: `${settings.titleSubtitleSpacing}px`,
          }}
          className={onTextChange ? "cursor-text" : ""}
          dangerouslySetInnerHTML={{ __html: creative.title }}
        />
        <p
          ref={subtitleRef}
          key={`${creative.id}-subtitle`}
          className={onTextChange ? "cursor-text" : ""}
          contentEditable={!!onTextChange}
          suppressContentEditableWarning={true}
          onMouseUp={() => handleSelectionChange('subtitle')}
          onKeyUp={() => handleSelectionChange('subtitle')}
          onBlur={(e) => handleBlur(e, 'subtitle')}
          style={{
            ...textBaseStyle,
            fontSize: `${settings.subtitleFontSize}px`,
            lineHeight: 1.2,
          }}
          dangerouslySetInnerHTML={{ __html: creative.subtitle }}
        />
      </div>
    </div>
  );
});

AdPreview.displayName = "AdPreview";

export default AdPreview;
