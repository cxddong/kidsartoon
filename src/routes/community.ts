import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

type Work = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  type: 'audio' | 'picture' | 'animation';
  title: string;
  description?: string;
  likeCount: number;
  likedBy: string[]; // userIds who liked this work
  canCoCreate: boolean;
  mediaUrl: string; // imageUrl, videoUrl, or audioUrl
  thumbnailUrl?: string;
  createdAt: string;
  shareCount: number;
};

const works: Work[] = [];
const likedWorks = new Map<string, Set<string>>(); // userId -> Set of workIds

export const router = Router();

// Get all works, optionally filtered by type
router.get('/works', (req, res) => {
  const type = req.query.type as string | undefined;
  const authorId = req.query.authorId as string | undefined;
  
  let filtered = works;
  if (type) {
    filtered = filtered.filter(w => w.type === type);
  }
  if (authorId) {
    filtered = filtered.filter(w => w.authorId === authorId);
  }
  
  // Sort by creation date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  res.json(filtered);
});

// Get a single work by ID
router.get('/works/:id', (req, res) => {
  const work = works.find(w => w.id === req.params.id);
  if (!work) return res.status(404).json({ error: 'Work not found' });
  res.json(work);
});

// Publish a work to community
router.post('/works', (req, res) => {
  const work: Work = {
    id: uuidv4(),
    authorId: req.body.authorId,
    authorName: req.body.authorName ?? 'Anonymous Artist',
    authorAvatar: req.body.authorAvatar,
    type: req.body.type,
    title: req.body.title ?? 'Untitled',
    description: req.body.description,
    likeCount: 0,
    likedBy: [],
    canCoCreate: Boolean(req.body.canCoCreate ?? true),
    mediaUrl: req.body.mediaUrl,
    thumbnailUrl: req.body.thumbnailUrl,
    createdAt: new Date().toISOString(),
    shareCount: 0,
  };
  works.push(work);
  res.status(201).json(work);
});

// Like a work (with reward points for author)
router.post('/works/:id/like', (req, res) => {
  const work = works.find(w => w.id === req.params.id);
  if (!work) return res.status(404).json({ error: 'Work not found' });
  
  const userId = req.body.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  // Check if user already liked
  if (work.likedBy.includes(userId)) {
    return res.json({ 
      id: work.id, 
      likeCount: work.likeCount, 
      alreadyLiked: true 
    });
  }
  
  // Add like
  work.likedBy.push(userId);
  work.likeCount += 1;
  
  // Track user's liked works
  if (!likedWorks.has(userId)) {
    likedWorks.set(userId, new Set());
  }
  likedWorks.get(userId)!.add(work.id);
  
  // Author gets 1 point reward for each like (can be claimed via users API)
  // This will be handled by the users route when author checks their points
  
  res.json({ 
    id: work.id, 
    likeCount: work.likeCount,
    authorReward: 1 // Author gets 1 point for this like
  });
});

// Unlike a work
router.post('/works/:id/unlike', (req, res) => {
  const work = works.find(w => w.id === req.params.id);
  if (!work) return res.status(404).json({ error: 'Work not found' });
  
  const userId = req.body.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  const index = work.likedBy.indexOf(userId);
  if (index > -1) {
    work.likedBy.splice(index, 1);
    work.likeCount = Math.max(0, work.likeCount - 1);
    likedWorks.get(userId)?.delete(work.id);
  }
  
  res.json({ id: work.id, likeCount: work.likeCount });
});

// Check if user liked a work
router.get('/works/:id/liked', (req, res) => {
  const work = works.find(w => w.id === req.params.id);
  if (!work) return res.status(404).json({ error: 'Work not found' });
  
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  res.json({ liked: work.likedBy.includes(userId) });
});

// Share a work
router.post('/works/:id/share', (req, res) => {
  const work = works.find(w => w.id === req.params.id);
  if (!work) return res.status(404).json({ error: 'Work not found' });
  
  work.shareCount += 1;
  
  res.json({ 
    id: work.id, 
    shareCount: work.shareCount,
    shareUrl: `${req.protocol}://${req.get('host')}/works/${work.id}`
  });
});

// Co-create from a work
router.post('/works/:id/cocreate', (req, res) => {
  const base = works.find(w => w.id === req.params.id);
  if (!base) return res.status(404).json({ error: 'Work not found' });
  if (!base.canCoCreate) return res.status(403).json({ error: 'Co-create disabled' });
  
  const newWork: Work = {
    id: uuidv4(),
    authorId: req.body.authorId,
    authorName: req.body.authorName ?? 'Anonymous Artist',
    authorAvatar: req.body.authorAvatar,
    type: base.type,
    title: (req.body.title ?? base.title) + ' (Remix)',
    description: req.body.description,
    likeCount: 0,
    likedBy: [],
    canCoCreate: true,
    mediaUrl: req.body.mediaUrl ?? base.mediaUrl,
    thumbnailUrl: req.body.thumbnailUrl,
    createdAt: new Date().toISOString(),
    shareCount: 0,
  };
  works.push(newWork);
  res.status(201).json(newWork);
});

// Get user's liked works
router.get('/users/:userId/liked', (req, res) => {
  const userId = req.params.userId;
  const likedWorkIds = Array.from(likedWorks.get(userId) || []);
  const userLikedWorks = works.filter(w => likedWorkIds.includes(w.id));
  res.json(userLikedWorks);
});

// Get author's reward points from likes (to be called when author checks points)
router.get('/users/:userId/like-rewards', (req, res) => {
  const userId = req.params.userId;
  const userWorks = works.filter(w => w.authorId === userId);
  const totalRewards = userWorks.reduce((sum, work) => sum + work.likeCount, 0);
  res.json({ 
    userId, 
    totalLikes: totalRewards,
    worksCount: userWorks.length 
  });
});


