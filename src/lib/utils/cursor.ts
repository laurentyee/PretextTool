import type { Tool } from '../sceneEngine'

export const SELECT_CURSOR = 'move'
export const SELECT_HANDLE_CURSOR = 'nwse-resize'
export const STICKER_CURSOR = 'crosshair'

export function cursorForTool(tool: Tool, brushCursor: string): string {
  if (tool === 'brush') return brushCursor
  if (tool === 'sticker') return STICKER_CURSOR
  if (tool === 'select') return SELECT_CURSOR
  return ''
}
