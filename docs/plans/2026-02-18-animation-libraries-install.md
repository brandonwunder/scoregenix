# Animation Libraries Installation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Install all missing animation libraries and document the purpose/use-case for each library in the Scoregenix animation toolkit.

**Architecture:** Scoregenix is a Next.js 16 + React 19 app using Tailwind CSS 4 and shadcn/ui. Framer Motion is the current primary animation library (used in 20+ files). We're building a comprehensive animation toolkit so designers can reach for the right tool for each effect. All libraries will be available project-wide via standard imports.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, npm

---

## Current State Audit

| Library | Package | Status | Used? |
|---------|---------|--------|-------|
| GSAP | `gsap`, `@gsap/react` | Installed | No |
| Anime.js | `animejs` | Installed | No |
| Framer Motion | `framer-motion` | Installed | **Yes — 20+ files** |
| Three.js | `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` | Installed | No |
| Typed.js | `typed.js` | Installed | No |
| Lottie React | `lottie-react` | Installed | No |
| Motion One | `@motionone/dom` | **NOT installed** | — |
| AutoAnimate | `@formkit/auto-animate` | **NOT installed** | — |
| AOS | `aos` | **NOT installed** | — |
| React Spring | `@react-spring/web` | **NOT installed** | — |
| Lottie Web | `lottie-web` | **NOT installed** | — |

> **Note on `motion` vs `framer-motion`:** The npm package `motion` is just the rebranded name of `framer-motion`. Since `framer-motion@12.34.1` is already installed and actively used, we do NOT install `motion` separately — they are the same library and would conflict. No action needed.

---

## Task 1: Install Missing Animation Libraries

**Files:**
- Modify: `package.json` (npm will update this automatically)
- Modify: `package-lock.json` (npm will update this automatically)

**Step 1: Install all 5 missing packages in one command**

```bash
npm i @motionone/dom @formkit/auto-animate aos lottie-web @react-spring/web
```

**Step 2: Install type definitions for AOS**

```bash
npm i -D @types/aos
```

**Step 3: Verify all packages installed**

Run: `npm ls @motionone/dom @formkit/auto-animate aos lottie-web @react-spring/web @types/aos`

Expected: All 6 packages listed with their versions, no `MISSING` errors.

**Step 4: Verify the build still works**

Run: `npm run build`

Expected: Build succeeds with no errors. (Unused packages won't break anything — tree-shaking removes them from the bundle.)

**Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add animation toolkit libraries (motion-one, auto-animate, aos, lottie-web, react-spring)"
```

---

## Animation Library Reference Guide

Below is the purpose, use-case, and quick-start for **every** library in the toolkit — both pre-existing and newly installed.

---

### 1. Framer Motion (`framer-motion`) — PRIMARY LIBRARY

**Purpose:** Declarative React animations with gesture support, layout animations, and shared element transitions.

**When to use:**
- Page/route transitions
- Component mount/unmount animations (`AnimatePresence`)
- Scroll-triggered reveals (`useInView`)
- Drag, tap, hover gesture animations
- Layout animations (auto-animating position/size changes)
- Shared layout animations between routes

**Quick start:**
```tsx
"use client";
import { motion, AnimatePresence, useInView } from "framer-motion";

// Fade-in on mount
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
  Content
</motion.div>

// Scroll-triggered
const ref = useRef(null);
const inView = useInView(ref, { once: true });
<motion.div ref={ref} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }} />
```

**Already used in:** Landing pages, dashboard, admin pages, modals, navbar.

---

### 2. GSAP (`gsap` + `@gsap/react`) — TIMELINE & SCROLL ANIMATIONS

**Purpose:** Industry-standard, high-performance timeline-based animations. Best for complex sequenced animations, scroll-driven effects (ScrollTrigger), and morphing.

**When to use:**
- Complex multi-step animation timelines
- Scroll-driven animations (parallax, pinning, scrubbing)
- SVG morphing and path animations
- Stagger animations on many elements
- Performance-critical animations (GSAP is faster than CSS for complex sequences)

**Quick start:**
```tsx
"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

function Component() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".box", {
      y: 100,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: "power3.out",
    });
  }, { scope: container });

  return <div ref={container}>...</div>;
}
```

**ScrollTrigger (register plugin first):**
```tsx
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
```

---

### 3. Anime.js (`animejs`) — LIGHTWEIGHT GENERAL-PURPOSE

**Purpose:** Lightweight, versatile animation engine. Good for CSS properties, SVG, DOM attributes, and JavaScript object animations.

**When to use:**
- SVG line drawing / stroke animations
- Animating CSS custom properties (variables)
- Simple standalone animations that don't need React integration
- Animating non-React DOM elements
- Quick prototyping of animation ideas

**Quick start:**
```tsx
"use client";
import anime from "animejs";
import { useEffect, useRef } from "react";

function Component() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    anime({
      targets: el.current,
      translateY: [-20, 0],
      opacity: [0, 1],
      duration: 800,
      easing: "easeOutExpo",
    });
  }, []);

  return <div ref={el}>Animated</div>;
}
```

---

### 4. Motion One (`@motionone/dom`) — WAAPI-POWERED, TINY

**Purpose:** Ultra-small (~3.8KB) animation library built on the Web Animations API (WAAPI). Hardware-accelerated by default.

**When to use:**
- When bundle size is critical (3.8KB vs 16KB+ for alternatives)
- Simple CSS property animations that need to be performant
- Animations in utility/shared components where you don't want heavy deps
- Server-rendered pages where minimal JS is important
- Spring physics animations with tiny footprint

**Quick start:**
```tsx
"use client";
import { animate, stagger } from "@motionone/dom";
import { useEffect, useRef } from "react";

function Component() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (el.current) {
      animate(el.current, { opacity: [0, 1], y: [20, 0] }, { duration: 0.5 });
    }
  }, []);

  return <div ref={el}>Content</div>;
}
```

---

### 5. AutoAnimate (`@formkit/auto-animate`) — ZERO-CONFIG LIST/UI TRANSITIONS

**Purpose:** Drop-in animation for adding/removing/reordering DOM elements. Zero configuration needed.

**When to use:**
- Lists that add/remove items (bet lists, game cards, admin tables)
- Accordion/expandable sections
- Tab content transitions
- Any dynamic UI where elements appear/disappear
- When you want "it just works" animation without writing variants

**Quick start:**
```tsx
"use client";
import { useAutoAnimate } from "@formkit/auto-animate/react";

function GameList({ games }) {
  const [parent] = useAutoAnimate(); // That's it!

  return (
    <div ref={parent}>
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
```

---

### 6. AOS (`aos`) — ANIMATE ON SCROLL (CSS-BASED)

**Purpose:** CSS-class-based scroll animations. Add a data attribute, elements animate when scrolled into view.

**When to use:**
- Landing page sections that reveal on scroll
- Marketing/content pages with lots of scroll reveals
- When you want scroll animation without writing JavaScript
- Quick prototyping of scroll-reveal effects
- Static content that just needs entrance animations

**Quick start (requires initialization):**
```tsx
// In a layout or provider component:
"use client";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

function AOSProvider({ children }) {
  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 100 });
  }, []);
  return <>{children}</>;
}

// Then in any component:
<div data-aos="fade-up">I animate on scroll!</div>
<div data-aos="fade-left" data-aos-delay="200">Me too, with delay!</div>
```

**Available animations:** `fade-up`, `fade-down`, `fade-left`, `fade-right`, `zoom-in`, `zoom-out`, `flip-up`, `slide-up`, etc.

---

### 7. Lottie (`lottie-web` + `lottie-react`) — AFTER EFFECTS ANIMATIONS

**Purpose:** Render Adobe After Effects animations exported as JSON (via Bodymovin plugin). Perfect for complex illustrated animations.

**When to use:**
- Animated icons and micro-interactions designed in After Effects
- Loading spinners / progress indicators with rich animation
- Illustrated onboarding flows
- Marketing animations (hero sections, feature illustrations)
- Any animation too complex to code by hand

**Quick start with lottie-react (recommended for React):**
```tsx
"use client";
import Lottie from "lottie-react";
import animationData from "@/assets/animations/loading.json";

function LoadingSpinner() {
  return <Lottie animationData={animationData} loop autoplay style={{ width: 200 }} />;
}
```

**Quick start with lottie-web (vanilla, for non-React or more control):**
```tsx
"use client";
import lottie from "lottie-web";
import { useEffect, useRef } from "react";

function Animation() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container: container.current!,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/animations/hero.json", // from public/ folder
    });
    return () => anim.destroy();
  }, []);

  return <div ref={container} />;
}
```

---

### 8. Typed.js (`typed.js`) — TYPEWRITER EFFECT

**Purpose:** Animated typing effect — text appears as if being typed in real-time.

**When to use:**
- Hero headlines with rotating phrases
- Terminal/code-like typing effects
- Onboarding flows with conversational feel
- Feature highlights that cycle through benefits

**Quick start:**
```tsx
"use client";
import Typed from "typed.js";
import { useEffect, useRef } from "react";

function TypewriterHero() {
  const el = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const typed = new Typed(el.current!, {
      strings: ["Smarter Bets", "Better Odds", "Real Insights"],
      typeSpeed: 60,
      backSpeed: 40,
      loop: true,
    });
    return () => typed.destroy();
  }, []);

  return <h1>Make <span ref={el} /></h1>;
}
```

---

### 9. React Spring (`@react-spring/web`) — PHYSICS-BASED REACT ANIMATIONS

**Purpose:** Spring-physics animations for React. Animations feel natural because they're driven by spring dynamics, not duration/easing curves.

**When to use:**
- Drag-and-drop interfaces with springy feedback
- Number/value counters that spring to their target
- Interactive elements that respond to user input with physics
- Parallax effects
- When animations should feel "physical" and responsive
- Trail animations (staggered springs)

**Quick start:**
```tsx
"use client";
import { useSpring, animated } from "@react-spring/web";

function SpringCard() {
  const [springs, api] = useSpring(() => ({
    from: { opacity: 0, y: 50 },
    to: { opacity: 1, y: 0 },
  }));

  return (
    <animated.div style={springs}>
      Content springs in!
    </animated.div>
  );
}
```

**Hover spring:**
```tsx
const [springs, api] = useSpring(() => ({ scale: 1 }));

<animated.div
  style={springs}
  onMouseEnter={() => api.start({ scale: 1.05 })}
  onMouseLeave={() => api.start({ scale: 1 })}
/>
```

---

### 10. Three.js (`three` + `@react-three/fiber` + `@react-three/drei`) — 3D / WEBGL

**Purpose:** 3D rendering and WebGL animations in the browser. React Three Fiber makes it declarative for React.

**When to use:**
- 3D backgrounds or hero scenes
- Interactive 3D product/data visualizations
- Particle systems and generative art
- 3D text effects
- Globe/map visualizations
- Immersive scrolling experiences

**Quick start:**
```tsx
"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial } from "@react-three/drei";

function Scene() {
  return (
    <Canvas style={{ height: "400px" }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 5]} />
      <Sphere args={[1, 64, 64]}>
        <MeshDistortMaterial color="#6366f1" distort={0.4} speed={2} />
      </Sphere>
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}
```

> **Important:** Three.js/R3F components are heavy. Always lazy-load them:
> ```tsx
> const Scene = dynamic(() => import("@/components/3d/scene"), { ssr: false });
> ```

---

## Decision Guide: Which Library to Use?

| Need | Best Choice | Runner-up |
|------|-------------|-----------|
| React component animations | **Framer Motion** | React Spring |
| Page/route transitions | **Framer Motion** | — |
| Scroll-triggered reveals | **Framer Motion** (`useInView`) | AOS (simpler) |
| Complex timelines/sequences | **GSAP** | Anime.js |
| Scroll-driven (parallax, pinning) | **GSAP** (ScrollTrigger) | — |
| List add/remove animations | **AutoAnimate** | Framer Motion |
| Typewriter text effect | **Typed.js** | — |
| After Effects animations | **Lottie** (lottie-react) | — |
| Physics-based / springy feel | **React Spring** | Framer Motion |
| Tiny bundle, simple animation | **Motion One** | — |
| SVG path/stroke animations | **Anime.js** | GSAP |
| 3D / WebGL scenes | **Three.js** (R3F) | — |
| Zero-config UI transitions | **AutoAnimate** | — |
| Data attribute scroll animations | **AOS** | — |

---

## Post-Install Verification Checklist

After Task 1 is complete, verify the full toolkit:

```bash
npm ls gsap @gsap/react animejs framer-motion three @react-three/fiber @react-three/drei typed.js lottie-react lottie-web @motionone/dom @formkit/auto-animate aos @react-spring/web
```

All 14 packages should resolve without errors.
