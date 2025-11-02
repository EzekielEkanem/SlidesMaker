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
  const charScale = maxCharsPerSlide / chars;
  const lineScale = maxLinesPerSlide / lines;
  
  // Use the more restrictive constraint
  const scale = Math.pow(Math.min(charScale, lineScale), 0.5);
  
  // Apply scale with a floor to maintain readability
  const scaledSize = (base * scale) + 2 ;
  const size = Math.min(44, Math.max(16, Math.round(scaledSize)));

  
  console.log(`Auto-fit: ${chars} chars, ${lines} lines -> ${size}pt (scale: ${scale.toFixed(2)})`);
  
  return { magnitude: size, unit: 'PT' as const };
}

export async function generateHandler(req: Request, res: Response) {
  try {
  const { lyrics, presentationTitle, style = {} } = req.body as GenerateRequest;
    
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
  const title = presentationTitle && presentationTitle.trim() ? presentationTitle.trim() : 'My Lyrics Presentation';
  const presentation = await googleClient.createPresentation(title);
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

      // --- Alternative (commented): Native Slides autofit ---
      // If you want to try Google Slides' native autofit again, uncomment this block.
      // Note some accounts/layouts can reject this field with a 400 error.
      // slideRequests.push({
      //   updateShapeProperties: {
      //     objectId: boxId,
      //     shapeProperties: {
      //       autofit: {
      //         autofitType: 'TEXT_AUTOFIT'
      //       }
      //     },
      //     fields: 'autofit'
      //   }
      // });

      // Note: Native Slides autofit via updateShapeProperties is unreliable and
      // previously caused API errors. We instead compute a font size server-side
      // (below) to approximate autofit behavior.

      // Insert text
      slideRequests.push({
        insertText: {
          objectId: boxId,
          text: group
        }
      });

      // Style the text (server-side auto-fit via computed font size)
      // --- Previous approach (commented, kept for reference) ---
      // This version only set fontSize when isAutoFit was false, otherwise relied on
      // Slides' native behavior. Keep as a fallback if you want to compare.
      // {
      //   const stylePayload: any = {};
      //   const fields: string[] = [];
      //   if (style.isAutoFit === false) {
      //     stylePayload.fontSize = {
      //       magnitude: style.fontSize ?? 24,
      //       unit: 'PT'
      //     };
      //     fields.push('fontSize');
      //   }
      //   if (style.fontFamily) {
      //     stylePayload.fontFamily = style.fontFamily;
      //     fields.push('fontFamily');
      //   }
      //   if (style.fontColor) {
      //     stylePayload.foregroundColor = { opaqueColor: { rgbColor: hexToRgb(style.fontColor) } };
      //     fields.push('foregroundColor');
      //   }
      //   if (style.isBold) {
      //     stylePayload.bold = true;
      //     fields.push('bold');
      //   }
      //   if (style.isItalic) {
      //     stylePayload.italic = true;
      //     fields.push('italic');
      //   }
      //   if (fields.length > 0) {
      //     slideRequests.push({
      //       updateTextStyle: {
      //         objectId: boxId,
      //         style: stylePayload,
      //         textRange: { type: 'ALL' },
      //         fields: fields.join(',')
      //       }
      //     });
      //   }
      // }
      // --- End previous approach ---

      {
        const fontSize = computeFontSizeForText(group, style.fontSize, style.isAutoFit);
        const stylePayload: any = { fontSize };
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
      }

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