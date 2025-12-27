# 🌟 git.3asy.app

> Transform your GitHub contributions into a cinematic visual experience with generative music.

![git.3asy.app](https://img.shields.io/badge/GitHub-Visualizer-brightgreen?style=for-the-badge&logo=github)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-R3F-black?style=for-the-badge&logo=three.js)

## ✨ Features

### 🎬 5 Cinematic Visualizations
- **🌌 Galaxy** - Your commits as stars in an infinite universe
- **🏔️ Mountain** - Contribution peaks form majestic terrain
- **🌀 Tunnel** - Journey through your coding timeline
- **🏙️ City** - A neon cyberpunk skyline of your work
- **💓 Heartbeat** - The pulse of your open source life

### 🎵 Generative Audio System
Each visualization comes with its own procedural music genre:
- **Galaxy** → Ambient / Space Synth
- **Mountain** → Cinematic / Epic Orchestral
- **Tunnel** → Techno / Trance
- **City** → Synthwave / Cyberpunk
- **Heartbeat** → Drum & Bass / Industrial

### 🎚️ Dynamic Music Based on Contributions
The music adapts to your contribution level:

| Contributions | Energy Level | BPM | Musical Character |
|--------------|--------------|-----|-------------------|
| 0-100 | 😌 Chill | 128 | Dreamy, minimal |
| 100-300 | 🎵 Relaxed | 130 | Peaceful, flowing |
| 300-600 | 🎸 Moderate | 135 | Groovy, engaging |
| 600-800 | ⚡ Active | 138 | Driving, energetic |
| 800-1000 | 🔥 Energetic | 140 | Powerful, intense |
| 1000-2000 | 💥 Intense | 145 | Dark, aggressive |
| 2000-3000 | 🚀 Extreme | 150 | Dramatic, complex |
| 3000+ | 👑 Legendary | 155 | Epic, triumphant |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/3ASY-GITHUB-GRAPH.git
cd 3ASY-GITHUB-GRAPH

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage

1. Open the app in your browser
2. Enter any GitHub username to visualize their contributions
3. Use ← → arrow keys or click arrows to switch visualizations
4. Press **M** or click the sound icon to enable generative music
5. Share your unique visualization!

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ← | Previous visualization |
| → | Next visualization |
| M | Toggle music |

## 🛠️ Tech Stack

- **React 18** - UI Framework
- **TypeScript 5** - Type Safety
- **Vite 5** - Build Tool
- **React Three Fiber** - 3D Graphics
- **Three.js** - WebGL Engine
- **Framer Motion** - Animations
- **TailwindCSS** - Styling
- **Shadcn/UI** - Component Library
- **Web Audio API** - Procedural Music Generation

## 📦 Project Structure

```
src/
├── components/
│   ├── ui/              # Shadcn UI components
│   └── visualizations/  # 5 visualization modes
├── lib/
│   ├── audioEngine.ts   # Generative music system
│   ├── githubService.ts # GitHub API integration
│   └── mockData.ts      # Demo data
├── types/               # TypeScript definitions
├── App.tsx              # Main application
└── main.tsx             # Entry point
```

## 🎨 Customization

### Adding New Visualizations

1. Create a new component in `src/components/visualizations/`
2. Export it from the index
3. Add the mode to `VISUALIZATION_MODES` in `types/github.ts`
4. Map a music genre in `audioEngine.ts`

### Creating New Music Genres

Add a new generator method in `audioEngine.ts`:

```typescript
private generateMyGenre(bpm: number, duration: number): void {
  // Use the energy config for dynamic music
  const energy = this.getEnergyConfig();
  // Your procedural music logic here
}
```

## 🌐 Deployment

### GitHub Pages

The project includes automatic deployment via GitHub Actions:

1. Push to `main` branch
2. GitHub Actions builds the project
3. Deploys to GitHub Pages automatically

### Manual Build

```bash
npm run build
# Output in ./dist folder
```

## 📄 License

MIT License - feel free to use this for your own projects!

## 🙏 Credits

- Visualization inspiration: GitHub's contribution graph
- Music system: Web Audio API procedural synthesis
- UI components: Shadcn/UI

---

<p align="center">
  Made with 💚 for the open source community
  <br>
  <a href="https://github.com/YOUR_USERNAME/3ASY-GITHUB-GRAPH">Star this repo</a> if you found it useful!
</p>
