export type Point = [number, number]; // [x, y];

export type Rectangle = {
  x: number,
  y: number,
  width: number,
  height: number
}

export interface IDrawCommand {
  type: "DRAW";
  sequence: Point[];
  style: {
    drawLineWidth: number;
    drawColor: string;
  };
}

export interface ILineCommand {
  type: "LINE";
  line: {
    start: Point;
    end: Point;
  };
  style: {
    lineWidth: number;
    lineColor: string;
  };
}

export interface IWriteCommand {
  type: "WRITE";
  position: Point;
  style: {
    textColor: string;
    fontSize: number;
    fontFamily: string;
    innerText: string;
  }
}

export interface IEraseCommand {
  type: "ERASE";
  sequence: Point[];
  eraserSize: number;
}


export interface IRectangleCommand {
  type: "RECT";
  rect: Rectangle;
  style: {
    rectLineWidth: number;
    rectOutlineColor: string;
    rectFillColor: string;
    rectFilled: boolean;
    rectStroked: boolean;
  };
}

export interface IEllipseCommand {
  type: "ELLIPSE";
  ellipse: {
    x: number,
    y: number,
    radiusWidth: number,
    radiusHeight: number
  };
  style: {
    ellipseLineWidth: number;
    ellipseOutlineColor: string;
    ellipseFillColor: string;
    ellipseFilled: boolean;
    ellipseStroked: boolean;
  }
}

export interface ICropAndMoveCommand {
  type: "CROP-AND-MOVE";
  firstSelection: Rectangle;
  dataPosition: Point | [];
  firstEventOfTheChain: boolean;
  style: {
    rotationDegree: number;
  };
}

export type Command = IDrawCommand
  | IWriteCommand | ILineCommand | IEraseCommand
  | IRectangleCommand | IEllipseCommand | ICropAndMoveCommand;

export type EventQueue = Omit<Command, 'type'>[];

export type UndoStack = EventQueue;

export interface IDrawsDTO {
  tabName: string;
  eventQueue: EventQueue;
  undoStack: UndoStack;
}
export interface ITabsDTO {
  activeIndex: number;
  draws: IDrawsDTO[]
  timestamp: number;
}

export interface IOperationResult {
  success: boolean;
  count?: number;
}

export interface IUpdateResult extends IOperationResult {
  modifiedCount: number;
  matchedCount: number;
}

export interface IDeleteResult extends IOperationResult {
  deletedCount: number;
}

export interface IDrawDocument {
  id: string;
  data: ITabsDTO;
}
