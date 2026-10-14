export const MODEL_ID = 'onnx-community/gemma-4-E2B-it-ONNX';
export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export type WorkerRequest = { type: 'load' } | { type: 'generate'; messages: ChatMessage[] };
export type WorkerResponse =
  | { type: 'file'; file: string; percent: number | null; done: boolean }
  | { type: 'ready' }
  | { type: 'token'; text: string }
  | { type: 'done' }
  | { type: 'error'; error: string };
