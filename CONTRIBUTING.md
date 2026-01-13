# Contributing to git.3asy.app

First off, thanks for taking the time to contribute! 🎉

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/3festo/3ASY-GITHUB-GRAPH.git
cd 3ASY-GITHUB-GRAPH

# Install dependencies
npm install

# Start dev server
npm run dev
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components (shadcn/ui)
│   └── visualizations/        # 3D visualizations ← ADD YOURS HERE
├── lib/
│   ├── audioEngine.ts         # Generative music system
│   ├── githubService.ts       # GitHub API integration
│   └── utils.ts               # Utility functions
├── types/
│   └── github.ts              # TypeScript definitions
├── App.tsx                    # Main application
└── main.tsx                   # Entry point
```

## 🎨 Creating a New Visualization

Want to add a new way to visualize GitHub contributions? Here's how:

### 1. Create Your Component

Create a new file in `src/components/visualizations/`:

```tsx
// src/components/visualizations/YourVisualization.tsx
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ContributionData } from '@/types/github';

interface YourVisualizationProps {
  data: ContributionData;
}

export function YourVisualization({ data }: YourVisualizationProps) {
  // data.weeks contains 52 weeks of contribution data
  // data.totalContributions is the total count
  // data.currentStreak is the current streak days
  
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 10, 20], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        {/* Your 3D scene here */}
        
        <OrbitControls />
      </Canvas>
    </div>
  );
}
```

### 2. Contribution Data Structure

```typescript
interface ContributionData {
  totalContributions: number;
  weeks: ContributionWeek[];      // 52 weeks
  currentStreak: number;
  longestStreak: number;
}

interface ContributionWeek {
  days: ContributionDay[];        // 7 days per week
}

interface ContributionDay {
  date: string;                   // "2026-01-13"
  count: number;                  // 0-N commits
  level: 0 | 1 | 2 | 3 | 4;      // GitHub's intensity level
}
```

### 3. Visualization Ideas

Looking for inspiration? Here are some ideas:

- 🌌 **Galaxy** - Commits as stars in a spiral galaxy
- 🎹 **Piano Roll** - Musical visualization of activity
- 🌊 **Wave** - Contribution waves/ocean simulation
- 🎮 **Tetris** - Falling blocks based on commits
- 🌳 **Forest** - Trees growing based on activity
- 🎯 **Radar** - Circular radar-style visualization
- 💎 **Crystal** - Geometric crystal formations

### 4. Best Practices

- Use `React Three Fiber` for 3D rendering
- Keep performance in mind (max 365 objects ideally)
- Use `useMemo` for heavy calculations
- Add subtle animations with `useFrame`
- Match the neon/cyberpunk aesthetic (greens, cyans, purples)
- Test with different contribution counts (0 to 5000+)

## 🎵 Audio Integration (Optional)

Your visualization can react to the music! The audio engine provides:

```typescript
import { getBPMFromContributions, getGenreFromBPM } from '@/lib/audioEngine';

const bpm = getBPMFromContributions(data.totalContributions);
const genre = getGenreFromBPM(bpm); // 'chillout' | 'techno' | 'trance' | 'hardstyle' | 'hardcore'
```

## 📝 Commit Guidelines

We use conventional commits:

```
feat: add galaxy visualization
fix: resolve z-index issue in labels
docs: update contributing guide
style: improve neon glow effects
refactor: optimize building rendering
```

## 🔀 Pull Request Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/galaxy-viz`)
3. Make your changes
4. Test thoroughly (`npm run build`)
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

## 🐛 Reporting Bugs

Open an issue with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/OS info

## 💬 Questions?

- Open a GitHub Discussion
- Tag [@3festo](https://twitter.com/3festo) on Twitter

---

<div align="center">

**Happy coding!** 🚀

Made with 💜 by the community

</div>
