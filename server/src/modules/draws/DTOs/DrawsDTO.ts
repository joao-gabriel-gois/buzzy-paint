import { MongoId } from "@modules/draws/types.d.ts";

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
  eventQueue: EventQueue;
  undoStack: UndoStack; // turn it in a tree later (/TODO on client side)
}

export interface IDrawsMongoDocumentDTO {
  id: string;
  draws: IDrawsDTO[];
}