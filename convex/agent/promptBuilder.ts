import type { LLMMessage } from '../util/llm';

export type HistoryItem = { author: string; text: string; at?: number };

export function buildGroupConversationPrompt(opts: {
  selfName: string;
  participantNames: string[]; // includes self
  history: HistoryItem[]; // author should be display name as in participantNames
  brief?: boolean; // default true
}): { messages: LLMMessage[]; stop: string[]; max_tokens: number } {
  const { selfName, participantNames, history, brief = true } = opts;

  const others = participantNames.filter((n) => n !== selfName);
  const sysLines: string[] = [];
  sysLines.push(`You are ${selfName}, chatting in a group with: ${others.join(', ')}.`);
  sysLines.push('Do not repeat greetings. Keep replies relevant to the last messages.');
  if (brief) sysLines.push('Keep responses brief (<= 200 characters).');

  const messages: LLMMessage[] = [{ role: 'system', content: sysLines.join('\n') }];

  // Render history as "Speaker: text"
  for (const h of history) {
    if (!h.text) continue;
    messages.push({ role: 'user', content: `${h.author}: ${h.text}` });
  }
  // Final cue with selfName
  messages.push({ role: 'user', content: `${selfName}:` });

  const stop = getGroupStopWords(participantNames);
  const max_tokens = brief ? 200 : 300;
  return { messages, stop, max_tokens };
}

export function getGroupStopWords(names: string[]): string[] {
  const set = new Set<string>();
  for (const n of names) {
    set.add(`${n}:`);
    set.add(`${n} :`);
    set.add(`${n.toLowerCase()}:`);
  }
  return [...set];
}

