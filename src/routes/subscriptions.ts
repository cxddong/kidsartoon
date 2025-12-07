import { Router } from 'express';

export const router = Router();

type Usage = { 
  pictureBooks: number; 
  animations: number; 
  audioStories: number;
  lastResetDate: string; // ISO date string
};

type Membership = 'free' | 'gold';

const dailyUsage = new Map<string, Usage>();

// Get today's date string (YYYY-MM-DD)
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Reset daily usage if it's a new day
function resetIfNewDay(userId: string, usage: Usage): Usage {
  const today = getTodayDateString();
  if (usage.lastResetDate !== today) {
    return {
      pictureBooks: 0,
      animations: 0,
      audioStories: 0,
      lastResetDate: today,
    };
  }
  return usage;
}

// Get or initialize usage for user
function getUserUsage(userId: string): Usage {
  let usage = dailyUsage.get(userId);
  if (!usage) {
    usage = {
      pictureBooks: 0,
      animations: 0,
      audioStories: 0,
      lastResetDate: getTodayDateString(),
    };
    dailyUsage.set(userId, usage);
  } else {
    usage = resetIfNewDay(userId, usage);
    dailyUsage.set(userId, usage);
  }
  return usage;
}

// Get subscription plans
router.get('/plans', (_req, res) => {
  res.json({
    free: {
      name: 'Free Member',
      perks: [
        'Daily: 1 audio story',
        'Daily: 1 picture book (4 pages)',
        'Daily: 1 short animation',
        'With watermark',
        'Can purchase additional points'
      ],
      watermark: true,
      limits: {
        audioStories: 1,
        pictureBooks: 1,
        animations: 1,
      },
    },
    gold: {
      name: 'Gold Member',
      perks: [
        'All free member features',
        'Daily: 1 picture book (4 pages)',
        'Daily: 5 animations',
        'Unlimited audio stories*',
        'No watermark',
        'Can purchase additional points'
      ],
      watermark: false,
      limits: {
        audioStories: -1, // -1 means unlimited
        pictureBooks: 1,
        animations: 5,
      },
    },
  });
});

// Get user's daily usage
router.get('/:userId/usage', (req, res) => {
  const usage = getUserUsage(req.params.userId);
  const { lastResetDate, ...usageData } = usage;
  res.json({
    ...usageData,
    lastResetDate,
    isNewDay: lastResetDate === getTodayDateString(),
  });
});

// Check if user can consume a quota item
router.post('/:userId/check-quota', (req, res) => {
  const userId = req.params.userId;
  const type: keyof Omit<Usage, 'lastResetDate'> = req.body.type;
  const membership: Membership = req.body.membership ?? 'free';
  
  const usage = getUserUsage(userId);
  const plans = {
    free: { audioStories: 1, pictureBooks: 1, animations: 1 },
    gold: { audioStories: -1, pictureBooks: 1, animations: 5 },
  };
  
  const limit = plans[membership][type];
  const current = usage[type];
  
  const canConsume = limit === -1 || current < limit;
  
  res.json({
    canConsume,
    current,
    limit: limit === -1 ? 'unlimited' : limit,
    remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - current),
    membership,
  });
});

// Consume a quota item
router.post('/:userId/consume', (req, res) => {
  const userId = req.params.userId;
  const type: keyof Omit<Usage, 'lastResetDate'> = req.body.type;
  const membership: Membership = req.body.membership ?? 'free';
  
  const usage = getUserUsage(userId);
  const plans = {
    free: { audioStories: 1, pictureBooks: 1, animations: 1 },
    gold: { audioStories: -1, pictureBooks: 1, animations: 5 },
  };
  
  const limit = plans[membership][type];
  const current = usage[type];
  
  // Check if user can consume
  if (limit !== -1 && current >= limit) {
    return res.status(403).json({ 
      error: 'Daily quota exceeded',
      type,
      current,
      limit,
      membership,
      message: 'You have reached your daily limit. Please upgrade or purchase points.',
    });
  }
  
  // Consume quota
  usage[type] = current + 1;
  dailyUsage.set(userId, usage);
  
  res.json({
    success: true,
    usage: {
      pictureBooks: usage.pictureBooks,
      animations: usage.animations,
      audioStories: usage.audioStories,
    },
    remaining: {
      pictureBooks: plans[membership].pictureBooks === -1 ? 'unlimited' : Math.max(0, plans[membership].pictureBooks - usage.pictureBooks),
      animations: plans[membership].animations === -1 ? 'unlimited' : Math.max(0, plans[membership].animations - usage.animations),
      audioStories: plans[membership].audioStories === -1 ? 'unlimited' : Math.max(0, plans[membership].audioStories - usage.audioStories),
    },
  });
});

// Reset usage (for testing or admin purposes)
router.post('/:userId/reset', (req, res) => {
  const userId = req.params.userId;
  const usage: Usage = {
    pictureBooks: 0,
    animations: 0,
    audioStories: 0,
    lastResetDate: getTodayDateString(),
  };
  dailyUsage.set(userId, usage);
  res.json({ message: 'Usage reset', usage });
});


