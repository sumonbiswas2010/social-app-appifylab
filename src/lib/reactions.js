// Facebook-style reactions, shared by API validation and UI rendering.
// Order matters: it's the order shown in the picker and the stacked icons.
export const REACTIONS = {
  like: { emoji: '👍', label: 'Like', color: '#377DFF' },
  love: { emoji: '❤️', label: 'Love', color: '#F33E58' },
  haha: { emoji: '😆', label: 'Haha', color: '#F7B125' },
  wow: { emoji: '😮', label: 'Wow', color: '#F7B125' },
  sad: { emoji: '😢', label: 'Sad', color: '#F7B125' },
  angry: { emoji: '😡', label: 'Angry', color: '#E9710F' },
};

export const REACTION_TYPES = Object.keys(REACTIONS);

export function isReaction(type) {
  return REACTION_TYPES.includes(type);
}
