import type { ComponentChildren } from 'preact';

export type SlideshowRole = 'controller' | 'receiver';
export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

export interface SlideNotesBullet {
  type: 'say' | 'cue' | 'note';
  text: string;
}

export interface SlideNotes {
  anchor: string;         // one-line opener for this slide
  bullets: SlideNotesBullet[];
  pace?: string;          // e.g. 'Brief · ~3 min'
  cumulative?: number;    // total minutes elapsed by end of slide
}

export interface SlideData {
  id: number;             // 1-based
  title: string;          // short title for controller display
  content: ComponentChildren;
  notes?: SlideNotes;
}

/**
 * Serializable subset of SlideData — safe to pass as island props.
 * Strips the JSX `content` field which cannot be serialized.
 */
export interface SlideControllerInfo {
  id: number;
  title: string;
  notes?: SlideNotes;
}

export interface SlideshowMeta {
  slug: string;           // e.g. 'tumbarumba-june-2026'
  title: string;
  eventSlug?: string;     // links to events system if applicable
  slideCount: number;
  description?: string;
  loadSlides: () => Promise<SlideData[]>;
}

export interface SlideshowState {
  slide: number;          // 0-based current slide index
  ts: number;             // Date.now()
}

export interface WsGotoMessage  { action: 'goto';  slide: number; }
export interface WsSyncMessage  { action: 'sync';  slide: number; }
export interface WsHelloMessage { action: 'hello'; role: SlideshowRole; }
export interface WsPingMessage  { action: 'ping'; }
export interface WsPongMessage  { action: 'pong'; }

export type WsMessage =
  | WsGotoMessage
  | WsSyncMessage
  | WsHelloMessage
  | WsPingMessage
  | WsPongMessage;
