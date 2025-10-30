import type { Request, Response } from 'express';
import { GoogleAPIClient } from '../utils/googleClient.js';
import type { GenerateRequest, GenerateResponse } from '../types/api.js';
import type { SlideRequest } from '../types/slides.js';
import { hexToRgb } from '../utils/color.js';

// Heuristic font-size calculator to approximate auto-fit behavior server-side
function computeFontSizeForText(text: string, preferred?: number, isAutoFit?: boolean) {
  const base = Math.max(8, preferred ?? 24);
  if (!isAutoFit) return { magnitude: base, unit: 'PT' as const };

  const chars = Math.max(1, text.length);
  const lines = Math.max(1, text.split(/\r?\n/).length);
  
  // More aggressive scaling based on actual slide constraints
  // Standard slide can fit ~600 chars at 24pt, ~40 chars per line at 10 lines
  const maxCharsPerSlide = 600;
  const maxLinesPerSlide = 10;
  
  // Calculate scale factors - using linear scaling for more aggressive adjustment
  const charScale = Math.min(1, maxCharsPerSlide / chars);
  const lineScale = Math.min(1, maxLinesPerSlide / lines);
  
  // Use the more restrictive constraint
  const scale = Math.min(charScale, lineScale);
  
  // Apply scale with a floor to maintain readability
  const scaledSize = base * scale;
  const size = Math.max(10, Math.min(base, Math.round(scaledSize)));
  
  console.log(`Auto-fit: ${chars} chars, ${lines} lines -> ${size}pt (scale: ${scale.toFixed(2)})`);
  
  return { magnitude: size, unit: 'PT' as const };
}

export async function generateHandler(req: Request, res: Response) {
  try {
    const { lyrics, style = {} } = req.body as GenerateRequest;
    
    if (!lyrics || typeof lyrics !== 'string') {
      return res.status(400).json({ error: 'Lyrics are required and must be a string' });
    }

    // Split lyrics into groups (verses) separated by one or more blank lines.
    // Many songs separate verses with an empty line (two newlines). We treat
    // each verse (group of lines) as one slide.
    const groups = lyrics
      .split(/\r?\n\s*\r?\n+/) // split on blank lines (one or more)
      .map((g) => g.trim())
      .filter(Boolean);

    if (groups.length === 0) {
      return res.status(400).json({ error: 'No valid lyrics sections found' });
    }

    const googleClient = GoogleAPIClient.getInstance();
    
    // Create new presentation
    const presentation = await googleClient.createPresentation('My Lyrics Presentation');
    const presentationId = presentation.presentationId!;

    // Google Slides automatically creates a blank first slide. Get its ID to delete it.
    const defaultSlideId = presentation.slides?.[0]?.objectId;

    // Prepare batch update requests
    const requests = groups.map((group, index) => {
      const slideId = `slide_${index}`;
      const boxId = `text_box_${index}`;
      
      const slideRequests: SlideRequest[] = [
        // Create a new slide
        {
          createSlide: {
            objectId: slideId,
            slideLayoutReference: {
              predefinedLayout: 'BLANK'
            }
          }
        }
      ];

      // Set background color if provided
      if (style.backgroundColor) {
        slideRequests.push({
          updatePageProperties: {
            objectId: slideId,
            pageProperties: {
              pageBackgroundFill: {
                solidFill: {
                  color: {
                    rgbColor: hexToRgb(style.backgroundColor)
                  }
                }
              }
            },
            fields: 'pageBackgroundFill'
          }
        });
      }

      // Create text box - using more slide area for better text fitting
      // Standard slide: 10" wide x 7.5" tall = 9144000 x 6858000 EMU
      slideRequests.push({
        createShape: {
          objectId: boxId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: 8500000, unit: 'EMU' },  // ~93% of slide width (9.3")
              height: { magnitude: 6200000, unit: 'EMU' }  // ~90% of slide height (6.8")
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 320000,  // Center with margin (~0.35")
              translateY: 330000,  // Center with margin (~0.36")
              unit: 'EMU'
            }
          }
        }
      });

      // Insert text
      slideRequests.push({
        insertText: {
          objectId: boxId,
          text: group
        }
      });

      // Style the text (server-side auto-fit via computed font size)
      {
        const fontSize = computeFontSizeForText(group, style.fontSize, style.isAutoFit);
        const stylePayload: any = {
          fontSize
        };
        const fields: string[] = ['fontSize'];
        if (style.fontFamily) {
          stylePayload.fontFamily = style.fontFamily;
          fields.push('fontFamily');
        }
        if (style.fontColor) {
          stylePayload.foregroundColor = { opaqueColor: { rgbColor: hexToRgb(style.fontColor) } };
          fields.push('foregroundColor');
        }
        if (style.isBold) {
          stylePayload.bold = true;
          fields.push('bold');
        }
        if (style.isItalic) {
          stylePayload.italic = true;
          fields.push('italic');
        }

        slideRequests.push({
          updateTextStyle: {
            objectId: boxId,
            style: stylePayload,
            textRange: { type: 'ALL' },
            fields: fields.join(',')
          }
        });

        // Paragraph alignment (center) if selected
        if (style.isCentered) {
          slideRequests.push({
            updateParagraphStyle: {
              objectId: boxId,
              style: { alignment: 'CENTER' },
              textRange: { type: 'ALL' },
              fields: 'alignment'
            }
          });
        }
      }

      return slideRequests;
    }).flat();

    // Already flat from the map().flat() above
    const allRequests = requests;

    // Delete the default blank first slide if it exists
    if (defaultSlideId) {
      allRequests.push({
        deleteObject: {
          objectId: defaultSlideId
        }
      });
    }
    
    // Execute batch update
    await googleClient.batchUpdate(presentationId, allRequests);
    
    // Set public permissions
    await googleClient.setPermissions(presentationId);

    // Return success response
    const response: GenerateResponse = {
      presentationUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      slideCount: groups.length
    };

    res.json(response);
  } catch (error) {
    console.error('Error in generate handler:', error);
    res.status(500).json({
      error: 'Failed to generate presentation',
      code: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    });
  }
}