type Point = [number, number];

interface IDrawCommand {
  type: 'DRAW';
  sequence: Point[];
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
  sequence: Point[];
  eraserSize: number;
}


interface IRectangleCommand {
  type: 'RECT';
  rect: {
    x: number,
    y: number,
    width: number,
    height: number
  },
  style: {
    rectThickness: number;
    rectOutlineColor: string;
    rectFillColor: string;
    filled: boolean;
    stroked: boolean;
  }
}

interface IEllipseCommand {
  type: 'ELLIPSE';
  ellipse: {
    x: number,
    y: number,
    radiusWidth: number,
    radiusHeight: number
  },
  style: {
    ellipseThickness: number;
    ellipseOutlineColor: string;
    ellipseFillColor: string;
    filled: boolean;
    stroked: boolean;
  }
}

type Command = IDrawCommand
  | IWriteCommand | ILineCommand | IEraseCommand
  | IRectangleCommand | IEllipseCommand;
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
