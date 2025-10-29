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
  const maxChars = 350; // target capacity before shrinking
  const maxLines = 9;   // target max lines before shrinking
  const charScale = Math.min(1, Math.sqrt(maxChars / chars));
  const lineScale = Math.min(1, Math.sqrt(maxLines / lines));
  const scale = Math.max(0.3, Math.min(charScale, lineScale));
  const size = Math.max(8, Math.round(base * scale));
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

      // Create text box
      slideRequests.push({
        createShape: {
          objectId: boxId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: 7200000, unit: 'EMU' }, // ~90% of slide width
              height: { magnitude: 5400000, unit: 'EMU' }  // ~90% of slide height
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 400000, // Center horizontally
              translateY: 400000, // Center vertically
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

        slideRequests.push({
          updateTextStyle: {
            objectId: boxId,
            style: stylePayload,
            textRange: { type: 'ALL' },
            fields: fields.join(',')
          }
        });
      }

      return slideRequests;
    }).flat();

  // Already flat from the map().flat() above
  const allRequests = requests;
    
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