import React from 'react';
import { SlideStyle, FONT_FAMILIES } from '../types/style';

interface StyleControlsProps {
  style: SlideStyle;
  onChange: (style: SlideStyle) => void;
}

export function StyleControls({ style, onChange }: StyleControlsProps) {
  const handleChange = (key: keyof SlideStyle, value: any) => {
    onChange({ ...style, [key]: value });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-700">Style Options</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600">Font Family</label>
          <select 
            value={style.fontFamily}
            onChange={(e) => handleChange('fontFamily', e.target.value)}
            className="p-2 border rounded-md bg-white"
          >
            {FONT_FAMILIES.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600">Font Size</label>
          <input 
            type="number"
            value={style.fontSize}
            onChange={(e) => handleChange('fontSize', Number(e.target.value))}
            min={12}
            max={72}
            className="p-2 border rounded-md"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600">Background Color</label>
          <input 
            type="color"
            value={style.backgroundColor}
            onChange={(e) => handleChange('backgroundColor', e.target.value)}
            className="h-10 rounded-md"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600">Font Color</label>
          <input 
            type="color"
            value={style.fontColor}
            onChange={(e) => handleChange('fontColor', e.target.value)}
            className="h-10 rounded-md"
          />
        </div>

        <div className="col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <input 
              type="checkbox"
              checked={style.isAutoFit}
              onChange={(e) => handleChange('isAutoFit', e.target.checked)}
              className="rounded text-blue-600"
            />
            Auto-fit text to slide
          </label>
        </div>
      </div>
    </div>
  );
}