/**
 * Simple pseudo-random mnemonic generator with persistence
 * Used to generate unique wallet mnemonics for each user session
 */

// Simple word list for generating mnemonics (BIP39-like but simpler)
const WORD_LIST = [
  'abandon', 'ability', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd',
  'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic',
  'acquire', 'across', 'action', 'actor', 'actual', 'adapt', 'add', 'addict',
  'address', 'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic', 'affair',
  'afford', 'afraid', 'again', 'agent', 'agree', 'ahead', 'aim', 'air',
  'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien', 'all',
  'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter',
  'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor',
  'ancient', 'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual',
  'another', 'answer', 'antenna', 'antique', 'anxiety', 'any', 'apart', 'apology',
  'appear', 'apple', 'approve', 'april', 'arcade', 'arch', 'arctic', 'area',
  'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange',
  'arrest', 'arrive', 'arrow', 'art', 'article', 'artist', 'artwork', 'ask',
  'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom',
  'attack', 'attend', 'attitude', 'attract', 'auction', 'audit', 'august', 'aunt',
  'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware',
  'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon',
  'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner',
  'bar', 'barely', 'bargain', 'barrel', 'base', 'basic', 'basket', 'battle',
  'beach', 'bean', 'beauty', 'because', 'become', 'beef', 'before', 'begin',
  'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit', 'best',
  'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind',
  'biology', 'bird', 'birth', 'bitter', 'black', 'blade', 'blame', 'blanket',
  'blast', 'bleak', 'bless', 'blind', 'blood', 'blossom', 'blow', 'blue',
  'blur', 'blush', 'board', 'boat', 'body', 'boil', 'bomb', 'bone',
  'bonus', 'book', 'boost', 'border', 'boring', 'borrow', 'boss', 'bottom',
  'bounce', 'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave',
  'bread', 'breeze', 'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk',
  'broccoli', 'broken', 'bronze', 'broom', 'brother', 'brown', 'brush', 'bubble',
  'buddy', 'budget', 'buffalo', 'build', 'bulb', 'bulk', 'bullet', 'bundle',
  'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy', 'butter',
  'buyer', 'buzz', 'cabbage', 'cabin', 'cable', 'cactus', 'cage', 'cake',
  'call', 'calm', 'camera', 'camp', 'can', 'canal', 'cancel', 'candy',
  'cannon', 'canoe', 'canvas', 'canyon', 'capable', 'capital', 'captain', 'car',
  'carbon', 'card', 'care', 'career', 'careful', 'careless', 'cargo', 'carpet',
  'carry', 'cart', 'case', 'cash', 'casino', 'cast', 'casual', 'cat',
  'catalog', 'catch', 'category', 'cattle', 'caught', 'cause', 'caution', 'cave'
];

// Simple pseudo-random number generator (Linear Congruential Generator)
class SimpleRandom {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed || Date.now();
  }

  next(): number {
    // LCG formula: (a * seed + c) % m
    this.seed = (this.seed * 1103515245 + 12345) % Math.pow(2, 31);
    return this.seed / Math.pow(2, 31);
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}


export function generatePseudoRandomMnemonic(wordCount: number = 12, userSeed?: string): string {
  let seed = Date.now();
  
  // If user seed is provided, create a deterministic seed from it
  if (userSeed) {
    seed = 0;
    for (let i = 0; i < userSeed.length; i++) {
      seed = (seed * 31 + userSeed.charCodeAt(i)) % Math.pow(2, 31);
    }
  }

  const random = new SimpleRandom(seed);
  const words: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    const wordIndex = random.nextInt(WORD_LIST.length);
    words.push(WORD_LIST[wordIndex]);
  }

  return words.join(' ');
}

// Simple in-memory storage for persistence during session
const mnemonicStorage = new Map<string, string>();

export function getPersistentMnemonic(userId?: string): string {
  const storageKey = userId ? `user_mnemonic_${userId}` : 'user_mnemonic';
  
  // Try to get existing mnemonic from memory storage
  const existingMnemonic = mnemonicStorage.get(storageKey);
  
  if (existingMnemonic) {
    console.log('📱 Retrieved existing mnemonic from session storage');
    return existingMnemonic;
  }

  // Generate new mnemonic
  const userSeed = userId || `user_${Date.now()}_${Math.random()}`;
  const newMnemonic = generatePseudoRandomMnemonic(12, userSeed);
  
  // Save to memory storage for session persistence
  mnemonicStorage.set(storageKey, newMnemonic);
  
  console.log('💾 Created new session-persistent mnemonic');
  return newMnemonic;
}

export function clearStoredMnemonic(userId?: string): void {
  const storageKey = userId ? `user_mnemonic_${userId}` : 'user_mnemonic';
  
  // Remove from memory storage
  mnemonicStorage.delete(storageKey);
  console.log('🗑️ Cleared stored mnemonic from session');
}


export function generateUserSeed(): string {
  const components = [
    'dcl_user', // Decentraland prefix
    Date.now().toString(),
    Math.random().toString().slice(2, 10),
    Math.floor(Math.random() * 10000).toString()
  ];
  
  return components.join('_');
}
