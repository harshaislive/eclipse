# Product Requirements Document (PRD): Protocol ECLIPSE

**Version:** 1.0
**Status:** Approved for Development
**Theme:** Cyber-Noir / High-Stakes Heist
**Platform:** Mobile-First Web App (Next.js PWA)

---

## 1. Executive Summary

**Protocol: ECLIPSE** is a 4-player social deduction game set in a gritty, neon-noir cyberpunk universe. Players are elite hackers ("The Crew") attempting to extract data from a corporate server. One player is a corporate mole ("The Ghost") programmed to sabotage the extraction and terminate the crew.

**The differentiator:** Unlike cartoonish alternatives (Among Us), ECLIPSE uses a high-fidelity, text-terminal aesthetic, atmospheric audio, and tension-based mini-games to create a premium, mature experience.

---

## 2. User Experience & Flow

### 2.1 The Visual Language (The "Premium Noir" Look)

* **Palette:** Deep Void Black (`#050505`), Electric Cyan (`#00f3ff` for Crew), Blood Warning Red (`#ff003c` for Ghosts), Slate Grey (`#1f2937`).
* **Typography:** Monospace fonts (e.g., *JetBrains Mono* or *Share Tech Mono*) for data; Serif (e.g., *Playfair Display*) for narrative elements.
* **UI Effects:** Scanlines, CRT flicker on damage, glassmorphism for modal overlays, kinetic typography for alerts.

### 2.2 The Game Loop

**Phase 1: The Safehouse (Lobby)**

* Host creates a room; generates a 4-digit "Encryption Key" (Room Code).
* Players join. Their avatars are distinct noir silhouettes (The Fixer, The Cipher, The Muscle, The Face).
* **Mood:** Lo-fi synth rain sounds play in the background.

**Phase 2: The Infiltration (Active Gameplay)**

* **Crew Objective:** Fill the "Data Extraction Bar" (0-100%) by completing tasks.
* **Ghost Objective:** Deplete the "System Integrity" bar or kill all Crew.
* **Mechanic:** Players switch between a **Dashboard** (Status of other players) and **Terminal** (Mini-games).

**Phase 3: The Glitch (Sabotage)**

* The Ghost can trigger "System Failures" (e.g., *Firewall Breach*).
* **Effect:** All Crew screens turn red/noisy. They cannot perform tasks until two players simultaneously hold a "Patch" button.

**Phase 4: The Flatline (Kill)**

* The Ghost selects a target via the Dashboard.
* **Effect:** The victim's screen instantly cuts to black with the text: **"CONNECTION TERMINATED."**
* The body is left as a "Corrupted File." Any player clicking it triggers a meeting.

**Phase 5: The Tribunal (Voting)**

* Voice chat is disabled. Text chat is enabled in a dedicated "Encrypted Channel."
* Players vote to "Purge" a user from the network.
* **Animation:** The voted player is shown being disconnected from the server matrix.

---

## 3. Game Logic & Mechanics

### 3.1 Crew Tasks (Mini-Games)

Instead of generic buttons, use satisfying, tactile inputs:

1. **Decrypt:** Match a scrolling hex code pattern.
2. **Bypass:** A timing-based slider (stop the bar in the green zone).
3. **Wiring:** Drag-and-drop nodes to connect circuits (SVG lines).

### 3.2 The Ghost (Imposter Tools)

* **Kill Cooldown:** 25 seconds.
* **Sabotage Menu:**
* *Blind:* Shuts off player vision (CSS blur filter) for 10s.
* *Scramble:* Shuffles the task list of all crew members.



---

## 4. Technical Architecture

### 4.1 Tech Stack

* **Frontend:** Next.js 14 (App Router) + Framer Motion (Animations).
* **Styling:** Tailwind CSS + Shadcn UI (customized for Dark Mode).
* **Backend:** Supabase (PostgreSQL).
* **State/Cache:** Upstash Redis (Serverless).
* **Realtime:** Supabase Realtime (WebSockets).

### 4.2 Database Schema (Supabase)

**Table: `matches**`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `status` | text | 'lobby', 'active', 'voting', 'ended' |
| `extraction_progress` | int | 0-100 (Redis synced) |
| `meeting_cooldown` | timestamp | |

**Table: `players**`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `match_id` | uuid | FK |
| `role` | text | **Protected by RLS** (Only visible to self) |
| `is_alive` | bool | Default: true |
| `skin_id` | text | Avatar selection |
| `last_heartbeat` | timestamp | For disconnect detection |

**Table: `chat_logs**`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `match_id` | uuid | FK |
| `sender_id` | uuid | |
| `message` | text | |
| `phase` | text | Only visible during 'voting' phase |

### 4.3 The "Secret Sauce": Edge Functions & RLS

**Security Rule #1: Role Secrecy**
Do not send the full player list with roles to the client.

* *Bad:* `SELECT * FROM players` (Frontend sees who the imposter is).
* *Good:* Use a Postgres Policy (RLS):
```sql
CREATE POLICY "Can see own role" ON players
FOR SELECT USING (auth.uid() = user_id);

```



**Edge Function: `assign_roles.ts**`
Triggered when the host clicks "Start".

1. Fetches all 4 User IDs.
2. Uses `Math.random()` to pick 1 Ghost.
3. Updates the DB transactionally.
4. Broadcasts `event: 'game_start'` via Supabase Realtime.

**Edge Function: `resolve_vote.ts**`
Triggered when voting ends.

1. Counts votes.
2. If tie: No ejection.
3. If ejection: Update `players.is_alive = false`.
4. Check Win Condition (Ghost count == Crew count OR Ghost is dead).
5. Broadcast result.

---

## 5. Development Roadmap

### Phase 1: The Skeleton (Week 1)

* Setup Next.js + Supabase.
* Implement Authentication (Anonymous Login ok).
* Build Lobby Logic (Create/Join/Start).

### Phase 2: The Core (Week 2)

* Implement Realtime listener (Player A moves -> Player B sees update).
* Build the "Role Assignment" Edge Function.
* Create 1 Task (The Hex Decryptor) to test interaction.

### Phase 3: The Loop (Week 3)

* Implement Voting System.
* Implement "Kill" logic and "Dead State" UI.
* Connect Redis for "Global Progress Bar" syncing (needs low latency).

### Phase 4: The Polish (Week 4)

* Apply the "Noir" CSS theme.
* Add Sound Effects (Howler.js).
* Add animations (Framer Motion) for page transitions.

---

## 6. Next Step for You

To start building this, we need the **Database Setup** first.
