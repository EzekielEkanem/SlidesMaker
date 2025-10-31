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
    <div className="bg-white rounded-lg shadow-xl p-6 sticky top-8">
      <h3 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-3 mb-6">
        Style Options
      </h3>
      
      <div className="grid grid-cols-2 gap-x-5 gap-y-6">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Font Family</label>
          <select 
            value={style.fontFamily}
            onChange={(e) => handleChange('fontFamily', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {FONT_FAMILIES.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Font Size</label>
          <input 
            type="number"
            value={style.fontSize}
            onChange={(e) => handleChange('fontSize', Number(e.target.value))}
            min={12}
            max={72}
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-x-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Background</label>
            <input 
              type="color"
              value={style.backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="w-full h-10 p-0 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Font</label>
            <input 
              type="color"
              value={style.fontColor}
              onChange={(e) => handleChange('fontColor', e.target.value)}
              className="w-full h-10 p-0 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
        </div>


        <div className="col-span-2 pt-4 border-t border-gray-200 mt-2 space-y-3">
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <input 
              type="checkbox"
              checked={style.isCentered}
              onChange={(e) => handleChange('isCentered', e.target.checked)}
              className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            Center text
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <input 
              type="checkbox"
              checked={style.isAutoFit}
              onChange={(e) => handleChange('isAutoFit', e.target.checked)}
              className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            Auto-fit text to slide
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <input 
              type="checkbox"
              checked={style.isBold}
              onChange={(e) => handleChange('isBold', e.target.checked)}
              className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="font-bold">Bold</span>
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <input 
              type="checkbox"
              checked={style.isItalic}
              onChange={(e) => handleChange('isItalic', e.target.checked)}
              className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="italic">Italic</span>
          </label>
        </div>
      </div>
    </div>
  );
}