import { 
  Point,
  IDrawCommand,
  ILineCommand,
  IWriteCommand,
  IEraseCommand,
  IRectangleCommand,
  IEllipseCommand,
  Command,
  EventQueue,
  UndoStack,
  IDrawsDTO,
  ITabsDTO
} from './DrawsDTO.ts';


function isPoint(value: unknown): value is Point {
  return Array.isArray(value) && 
         value.length === 2 && 
         typeof value[0] === 'number' && 
         typeof value[1] === 'number';
}

function isDrawCommand(value: unknown): value is IDrawCommand {
  if (!value || typeof value !== 'object') return false;
  
  const candidate = value as Partial<IDrawCommand>;
  if (candidate.type !== 'DRAW') return false;
  
  if (!Array.isArray(candidate.sequence)) return false;
  for (const pos of candidate.sequence) {
    if (!isPoint(pos)) return false;
  }
  
  const style = candidate.style;
  if (!style || typeof style !== 'object') return false;
  
  const styleObj = style as Partial<IDrawCommand['style']>;
  return typeof styleObj.drawThickness === 'number' && 
         typeof styleObj.drawColor === 'string';
}

function isLineCommand(value: unknown): value is ILineCommand {
  if (!value || typeof value !== 'object') return false;
  
  const candidate = value as Partial<ILineCommand>;
  if (candidate.type !== 'LINE') return false;
  
  const line = candidate.line;
  if (!line || typeof line !== 'object') return false;
  
  const lineObj = line as Partial<ILineCommand['line']>;
  if (!isPoint(lineObj.start) || !isPoint(lineObj.end)) return false;
  
  const style = candidate.style;
  if (!style || typeof style !== 'object') return false;
  
  const styleObj = style as Partial<ILineCommand['style']>;
  return typeof styleObj.lineThickness === 'number' && 
         typeof styleObj.lineColor === 'string';
}

function isWriteCommand(value: unknown): value is IWriteCommand {
  if (!value || typeof value !== 'object') return false;
  
  const candidate = value as Partial<IWriteCommand>;
  if (candidate.type !== 'WRITE') return false;
  if (!isPoint(candidate.position)) return false;
  
  const style = candidate.style;
  if (!style || typeof style !== 'object') return false;
  
  const styleObj = style as Partial<IWriteCommand['style']>;
  return typeof styleObj.textColor === 'string' && 
         typeof styleObj.fontSize === 'number' &&
         typeof styleObj.fontFamily === 'string' &&
         typeof styleObj.innerText === 'string';
}

function isEraseCommand(value: unknown): value is IEraseCommand {
  if (!value || typeof value !== 'object') return false;
  
  const candidate = value as Partial<IEraseCommand>;
  if (candidate.type !== 'ERASE') return false;
  
  if (!Array.isArray(candidate.sequence)) return false;
  for (const pos of candidate.sequence) {
    if (!isPoint(pos)) return false;
  }
  
  return typeof candidate.eraserSize === 'number';
}

function isRectangleCommand(value: unknown): value is IRectangleCommand {
  if (!value || typeof value !== 'object') return false;
  
  const candidate = value as any;
  if (candidate.type !== 'RECT') return false;
  
  const rect = candidate.rect;
  if (!rect || typeof rect !== 'object') return false;
  
  if (typeof rect.x !== 'number' || 
      typeof rect.y !== 'number' || 
      typeof rect.width !== 'number' || 
      typeof rect.height !== 'number') {
    return false;
  }
  
  const style = candidate.style;
  if (!style || typeof style !== 'object') return false;
  
  return typeof style.rectThickness === 'number' && 
         typeof style.rectOutlineColor === 'string' &&
         typeof style.rectFillColor === 'string' &&  // This was rectFillColor in your interface
         typeof style.filled === 'boolean' &&
         typeof style.stroked === 'boolean';
}

function isEllipseCommand(value: unknown): value is IEllipseCommand {
  if (!value || typeof value !== 'object') return false;
  
  const candidate = value as any;
  if (candidate.type !== 'ELLIPSE') return false;
  
  const ellipse = candidate.ellipse;
  if (!ellipse || typeof ellipse !== 'object') return false;
  
  if (typeof ellipse.x !== 'number' || 
      typeof ellipse.y !== 'number' || 
      typeof ellipse.radiusWidth !== 'number' || 
      typeof ellipse.radiusHeight !== 'number') {
    return false;
  }
  
  const style = candidate.style;
  if (!style || typeof style !== 'object') return false;
  
  return typeof style.ellipseThickness === 'number' && 
         typeof style.ellipseOutlineColor === 'string' &&
         typeof style.ellipseFillColor === 'string' &&
         typeof style.filled === 'boolean' &&
         typeof style.stroked === 'boolean';
}

function isCommand(value: unknown): value is Command {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as { type?: string };
  if (!candidate.type) return false;
  
  switch (candidate.type) {
    case 'DRAW':
      return isDrawCommand(value);
    case 'LINE':
      return isLineCommand(value);
    case 'WRITE':
      return isWriteCommand(value);
    case 'ERASE':
      return isEraseCommand(value);
    case 'RECT':
      return isRectangleCommand(value);
    case 'ELLIPSE':
      return isEllipseCommand(value);
    default:
      return false;
  }
}

function isEventQueue(value: unknown): value is EventQueue {
  if (!Array.isArray(value)) return false;
  
  for (let i = 0; i < value.length; i++) {
    if (!isCommand(value[i])) {
      return false;
    }
  }
  
  return true;
}

function isDrawsDTO(value: unknown): value is IDrawsDTO {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<IDrawsDTO>;
  if (typeof candidate.tabName !== 'string') return false;
  if (!isEventQueue(candidate.eventQueue)) return false;
  if (!isEventQueue(candidate.undoStack)) return false;

  return true;
}

export function isDrawsDTOArray(value: unknown): value is IDrawsDTO[] {
  if (!Array.isArray(value)) return false;
  
  for (const item of value) {
    if (!isDrawsDTO(item)) {
      return false;
    }
  }
  
  return true;
}
