import { 
  Point,
  IDrawCommand,
  ILineCommand,
  IWriteCommand,
  IEraseCommand,
  IRectangleCommand,
  IEllipseCommand,
  Command,
  IDrawsDTO,
  EventQueue,
  ICropAndMoveCommand,
  Rectangle,
} from "./DrawsDTO.ts";


function isPoint(value: unknown): value is Point {
  return Array.isArray(value) && 
         value.length === 2 && 
         typeof value[0] === "number" && 
         typeof value[1] === "number";
}

function isRectangle(value: unknown): value is Rectangle {
  if (!value || typeof value !== "object") return false;
  
  const rectangleCandidate = value as Partial<Rectangle>;
  
  if (typeof rectangleCandidate.x !== "number" || 
      typeof rectangleCandidate.y !== "number" || 
      typeof rectangleCandidate.width !== "number" || 
      typeof rectangleCandidate.height !== "number") {
    return false;
  }
  return true;
}

function isDrawCommand(value: unknown): value is IDrawCommand {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<IDrawCommand>;
  const { sequence, style, type } = candidate;

  if (type !== "DRAW") return false;
  if (!Array.isArray(sequence)) return false;
  for (const pos of sequence) {
    if (!isPoint(pos)) return false;
  }
  if (!style || typeof style !== "object") return false;

  const {
    drawThickness,
    drawColor
  } = style as Partial<IDrawCommand["style"]>;
  
  return typeof drawThickness === "number" && 
         typeof drawColor === "string";
}

function isLineCommand(value: unknown): value is ILineCommand {
  if (!value || typeof value !== "object") return false;
  
  const candidate = value as Partial<ILineCommand>;
  const { line, style, type } = candidate;

  if (type !== "LINE") return false;
  if (!line || typeof line !== "object") return false;
  const lineObj = line as Partial<ILineCommand["line"]>;
  if (!isPoint(lineObj.start) || !isPoint(lineObj.end)) return false;
  if (!style || typeof style !== "object") return false;

  const {
    lineThickness,
    lineColor
  } = style as Partial<ILineCommand["style"]>;

  return typeof lineThickness === "number" && 
         typeof lineColor === "string";
}

function isWriteCommand(value: unknown): value is IWriteCommand {
  if (!value || typeof value !== "object") return false;
  
  const candidate = value as Partial<IWriteCommand>;
  const { position, style, type } = candidate;

  if (type !== "WRITE") return false;
  if (!isPoint(position)) return false;
  if (!style || typeof style !== "object") return false;

  const styleObj = style as Partial<IWriteCommand["style"]>;

  return typeof styleObj.textColor === "string" && 
         typeof styleObj.fontSize === "number" &&
         typeof styleObj.fontFamily === "string" &&
         typeof styleObj.innerText === "string";
}

function isEraseCommand(value: unknown): value is IEraseCommand {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<IEraseCommand>;
  const { sequence, eraserSize, type } = candidate;

  if (type !== "ERASE") return false;
  if (!Array.isArray(sequence)) return false;
  for (const pos of sequence) {
    if (!isPoint(pos)) return false;
  }
  
  return typeof eraserSize === "number";
}

function isRectangleCommand(value: unknown): value is IRectangleCommand {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<IRectangleCommand>;
  const { rect, style, type } = candidate;

  if (type !== "RECT") return false;
  if (!isRectangle(rect)) return false;
  if (!style || typeof style !== "object") return false;
  
  return typeof style.rectThickness === "number" && 
         typeof style.rectOutlineColor === "string" &&
         typeof style.rectFillColor === "string" &&  // This was rectFillColor in your interface
         typeof style.rectFilled === "boolean" &&
         typeof style.rectStroked === "boolean";
}

function isEllipseCommand(value: unknown): value is IEllipseCommand {
  if (!value || typeof value !== "object") return false;
  
  const candidate = value as Partial<IEllipseCommand>;
  const { ellipse, style, type } = candidate;
  
  if (type !== "ELLIPSE") return false;  
  if (!ellipse || typeof ellipse !== "object") return false;
  if (typeof ellipse.x !== "number" || 
      typeof ellipse.y !== "number" || 
      typeof ellipse.radiusWidth !== "number" || 
      typeof ellipse.radiusHeight !== "number") {
    return false;
  }  
  if (!style || typeof style !== "object") return false;
  
  return typeof style.ellipseThickness === "number" && 
         typeof style.ellipseOutlineColor === "string" &&
         typeof style.ellipseFillColor === "string" &&
         typeof style.ellipseFilled === "boolean" &&
         typeof style.ellipseStroked === "boolean";
}

function isCropAndMoveCommand(value: unknown): value is ICropAndMoveCommand {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<ICropAndMoveCommand>;  
  const {
    type,
    firstSelection,
    dataPosition,
    firstEventOfTheChain,
    style
  } = candidate;
  
  if (type !== "CROP-AND-MOVE") return false;
  else if (!isRectangle(firstSelection)) return false;
  else if (!Array.isArray(dataPosition)) return false;
  // dataPoisiton type is `Point | []`
  else if (dataPosition.length !== 0 && !isPoint(dataPosition)) return false;
  else if (typeof firstEventOfTheChain !== "boolean") return false;
  else if (!style || typeof style !== "object") return false;

  return typeof style.rotationDegree === "number";
}

function isCommand(value: unknown): value is Command {
  if (!value || typeof value !== "object") return false;

  const candidate = value as { type?: string };
  if (!candidate.type) return false;
  
  switch (candidate.type) {
    case "DRAW":
      return isDrawCommand(value);
    case "LINE":
      return isLineCommand(value);
    case "WRITE":
      return isWriteCommand(value);
    case "ERASE":
      return isEraseCommand(value);
    case "RECT":
      return isRectangleCommand(value);
    case "ELLIPSE":
      return isEllipseCommand(value);
    case "CROP-AND-MOVE":
      return isCropAndMoveCommand(value);
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
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<IDrawsDTO>;

  if (typeof candidate.tabName !== "string") return false;
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
