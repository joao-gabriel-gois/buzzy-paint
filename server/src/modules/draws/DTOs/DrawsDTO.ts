type Point = [number, number];
type Position = {
  position: Point
}

// By adjusting the frontend later, we can fix this typing
interface IDrawCommand {
  type: 'DRAW';
  sequence: Position[];
  style: {
    drawThickness: number;
    drawColor: string;
  }
}

interface ILineCommand {
  type: 'LINE';
  line: {
    start: Point;
    end: Point;
  }
  style: {
    lineThickness: number;
    lineColor: string;
  }
}

interface IWriteCommand {
  type: 'WRITE';
  position: Point;
  style: {
    textColor: string;
    fontSize: number;
    fontFamily: string;
    innerText: string;
  }
}

interface IEraseCommand {
  type: 'ERASE';
  sequence: Position[];
  eraserSize: number;
}

type Command = IDrawCommand | IWriteCommand  | ILineCommand | IEraseCommand;
type EventQueue = Command[];
type UndoStack = EventQueue;

export interface IDrawsDTO {
  tabName: string;
  eventQueue: EventQueue;
  undoStack: UndoStack; // turn it in a tree later (/TODO on client side)
}
export interface ITabsDTO {
  activeIndex: number;
  draws: IDrawsDTO[]
  timestamp: number;
}

export interface IDrawsMongoDocumentDTO {
  id: string;
  data: ITabsDTO;
}