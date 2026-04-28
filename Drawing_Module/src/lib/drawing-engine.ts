/**
 * SHARED BRIDGE GEOMETRY ENGINE
 * ─────────────────────────────
 * Centralized logic for coordinate mapping and structural geometry.
 * Used by both SVG (Interactive) and DXF (Professional Export) generators.
 * Matches logic from Bridge_GAD_Yogendra_Borse-main/BridgeCanvas/bridge_processor.py
 */

export interface DrawingCoords {
  x: number;
  y: number;
}

export interface DrawingScale {
  h: number; // Pixels/Units per metre (Horizontal)
  v: number; // Pixels/Units per metre (Vertical)
  originX: number;
  originY: number;
  datumRL: number;
}

/**
 * Coordinate Mapper
 */
export class BridgeMapper {
  constructor(private scale: DrawingScale) {}

  ex(ch: number): number {
    return this.scale.originX + ch * this.scale.h;
  }

  ey(rl: number): number {
    return this.scale.originY + (this.scale.datumRL - rl) * this.scale.v;
  }
}

/**
 * DXF GENERATOR (Minimal Implementation)
 * Produces a basic AutoCAD-compatible DXF file.
 */
export class DXFWriter {
  private entities: string[] = [];

  addLine(x1: number, y1: number, x2: number, y2: number, layer = "0") {
    this.entities.push(`0\nLINE\n8\n${layer}\n10\n${x1}\n20\n${y1}\n11\n${x2}\n21\n${y2}`);
  }

  addRect(x: number, y: number, w: number, h: number, layer = "0") {
    this.addLine(x, y, x + w, y, layer);
    this.addLine(x + w, y, x + w, y - h, layer);
    this.addLine(x + w, y - h, x, y - h, layer);
    this.addLine(x, y - h, x, y, layer);
  }

  addText(x: number, y: number, text: string, height: number, layer = "0") {
    this.entities.push(`0\nTEXT\n8\n${layer}\n10\n${x}\n20\n${y}\n40\n${height}\n1\n${text}`);
  }

  toString(): string {
    return `0\nSECTION\n2\nENTITIES\n${this.entities.join("\n")}\n0\nENDSEC\n0\nEOF`;
  }
}
