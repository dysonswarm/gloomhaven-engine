# 🎲 Gloomhaven Digital Game Engine

![Tests](https://img.shields.io/badge/tests-55%20unit%20%2B%20144%20e2e-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.1%20AA-brightgreen)
![Performance](https://img.shields.io/badge/performance-optimized-brightgreen)
![Security](https://img.shields.io/badge/security-no%20vulnerabilities-brightgreen)
![Node.js](https://img.shields.io/badge/node.js-18%20%7C%2020%20%7C%2021-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

A comprehensive implementation of the Gloomhaven board game with **5-player support modification**. Built with modern web technologies and comprehensive testing to deliver an authentic digital Gloomhaven experience.

## 🚀 Features

### ✅ Phase 1 - Core Foundation (Complete)
- **Core Type System** - Complete TypeScript interfaces for all game entities
- **Hex Grid System** - Axial coordinate system with pathfinding and line-of-sight
- **Game State Management** - Zustand store with Immer for immutable updates  
- **Basic Game Board** - Interactive SVG-based hex grid with character positioning
- **5-Player Support** - Modified difficulty scaling and reward systems

### ⚠️ Upcoming Phases
- **Phase 2** - Combat System (Attack resolution, conditions, elements)
- **Phase 3** - Character System (Cards, abilities, progression)
- **Phase 4** - Monster AI (Focus algorithms, decision making)
- **Phase 5** - Campaign Management (Scenarios, events, unlocks)

## 🛠️ Technology Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript 5 with strict type checking
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand with Immer middleware
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Accessibility:** axe-core integration, WCAG 2.1 AA compliant
- **CI/CD:** GitHub Actions with comprehensive testing pipeline

## 🏁 Quick Start

### Prerequisites
- Node.js 18+ (tested on 18, 20, 21)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/gloomhaven-engine.git
cd gloomhaven-engine

# Install dependencies
npm ci

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run unit tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e     # Run E2E tests
npm run test:e2e:ui  # Run E2E tests with UI

# Code Quality
npm run lint         # Run ESLint
```

## 🧪 Testing

### Comprehensive Test Suite
- **55 unit tests** with 100% pass rate
- **144 E2E tests** across multiple browsers
- **WCAG 2.1 AA accessibility** compliance
- **Performance testing** with Core Web Vitals
- **Cross-browser compatibility** (Chrome, Firefox, Safari)

### Test Categories

#### Unit Tests (Vitest)
- Core type definitions and constants
- Hex coordinate system and algorithms
- Game state management logic
- React component functionality

#### E2E Tests (Playwright)
- **UI Validation** (39 tests) - Component rendering and layout
- **User Experience** (27 tests) - Complete user journeys  
- **Accessibility** (45 tests) - Screen reader, keyboard navigation
- **Performance** (33 tests) - Load times, Core Web Vitals

### Running Tests

```bash
# Run all tests
npm run test && npm run test:e2e

# Run specific test suites
npm run test:e2e -- tests/accessibility.spec.ts
npm run test:e2e -- tests/performance.spec.ts

# Generate coverage report
npm run test:coverage
```

## 🚀 CI/CD Pipeline

Automated testing and deployment pipeline with GitHub Actions:

### 🔄 Continuous Integration
- **Code Quality:** ESLint, TypeScript checking
- **Unit Testing:** Vitest with coverage reporting
- **E2E Testing:** Playwright across Chromium, Firefox, WebKit
- **Security:** npm audit, dependency scanning
- **Accessibility:** axe-core automated testing
- **Performance:** Core Web Vitals monitoring

### 📦 Deployment
- **Staging:** Automatic deployment on main branch
- **Production:** Tagged releases with GitHub Releases
- **Artifacts:** Build artifacts and test reports
- **Health Checks:** Post-deployment validation

### 🔐 Security & Maintenance
- **Weekly Security Scans:** Vulnerability detection
- **Dependency Updates:** Automated outdated package detection
- **License Compliance:** License compatibility checking
- **CodeQL Analysis:** Static security analysis

See [CI/CD Documentation](.github/README.md) for detailed pipeline information.

## 🎮 Game Implementation

### Current Features
- ✅ **Demo Scenario** - Single-room scenario with character movement
- ✅ **Character Creation** - Basic Brute character implementation
- ✅ **Hex Grid Navigation** - Click-to-move with range validation
- ✅ **Visual Feedback** - Hover effects, selection states
- ✅ **Responsive Design** - Works on desktop, tablet, mobile

### 5-Player Modifications
- **Difficulty Scaling:** +2 to scenario level
- **Reward Adjustment:** -2 gold/XP per player
- **Monster Scaling:** Uses 4-player monster counts
- **Additional Deck:** 5th attack modifier deck

### Game Rules Implementation
- **Hex Movement:** Axial coordinate system with distance calculations
- **Line of Sight:** Corner-to-corner visibility checking
- **Turn Management:** Initiative-based turn order
- **State Persistence:** Immutable state updates with history

## 📚 Documentation

- [Technical Specification](docs/TECHNICAL_SPEC.md) - Detailed implementation guide
- [Testing Summary](TESTING_SUMMARY.md) - Comprehensive test documentation
- [CI/CD Guide](.github/README.md) - Pipeline and deployment info
- [Game Rules](docs/GAME_RULES.md) - Core Gloomhaven rules summary
- [Development Guide](docs/AGILE_BREAKDOWN.md) - Feature breakdown and roadmap

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── game/           # Game board, hex tiles
│   ├── character/      # Character sheets, cards
│   └── ui/             # Shared UI components
├── engine/             # Game logic
│   ├── core/           # Types, hex math, constants
│   ├── combat/         # Attack resolution, conditions
│   ├── character/      # Character management
│   └── campaign/       # Scenario, party management
├── store/              # Zustand state management
├── data/               # Game data (scenarios, characters)
└── utils/              # Helper functions
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm run test && npm run test:e2e`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📊 Performance

### Benchmarks
- **Page Load:** < 5 seconds
- **First Contentful Paint:** < 3 seconds
- **Cumulative Layout Shift:** < 0.1
- **SVG Interactions:** < 5 seconds response time

### Optimization
- **Bundle Splitting:** Dynamic imports for large components
- **Image Optimization:** Next.js automatic optimization
- **Caching:** Efficient state management and memoization
- **Performance Monitoring:** Automated Core Web Vitals testing

## 🛡️ Security

- **Dependency Scanning:** Weekly automated vulnerability checks
- **Code Analysis:** CodeQL static analysis
- **Input Validation:** Comprehensive game state validation
- **Access Control:** Type-safe APIs and state management

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

- **Gloomhaven** - Created by Isaac Childres
- **Board Game Community** - For rules clarifications and edge cases
- **Open Source Libraries** - Next.js, React, TypeScript, and testing frameworks

## 📞 Support

- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/your-org/gloomhaven-engine/issues)
- 💡 **Feature Requests:** [GitHub Discussions](https://github.com/your-org/gloomhaven-engine/discussions)
- 📧 **Contact:** [your-email@example.com](mailto:your-email@example.com)

---

**⚠️ Note:** This is an unofficial digital implementation. Gloomhaven is a trademark of Cephalofair Games. This project is for educational and personal use only.

**🎯 Current Status:** Phase 1 Complete - Core foundation with comprehensive testing infrastructure ready for Phase 2 development.