# Turfmapp Portfolio Refactoring Plan

**Goal:** Refactor codebase to keep all files under 500 lines while creating reusable utilities and maintaining backward compatibility for production users.

**Timeline:** 1-2 months (comprehensive)

**Current Issues:**
- Monolithic files: index.html (1,851 lines), editor.html (1,667 lines), dashboard.html (934 lines)
- Code duplication: YouTube utils, HTML escaping, validation in 3-5+ locations each
- Security: Hardcoded session secret and default admin password
- Database: Dual format (tooltip vs legacy) with fragile detection logic
- No separation of concerns: CSS/JS embedded in HTML

---

## Phase 1: Security & Configuration (Week 1)
**Priority: CRITICAL - 2 days**

### Goals
- Eliminate hardcoded secrets
- Secure admin authentication
- Enable environment-based configuration

### Files to Create
- `server/config/environment.js` (~80 lines) - Central config manager
- `.env.example` (~15 lines) - Environment template
- Update `.gitignore` - Add `.env`

### Files to Modify
- `server/app.js` - Replace hardcoded secret with `process.env.SESSION_SECRET`
- `server/models/database.js` - Remove hardcoded default password, enforce change on first login

### Key Changes
```javascript
// environment.js
module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || generateRandomSecret(),
  dbPath: process.env.DB_PATH || path.join(__dirname, '../../data/projects.db'),
  nodeEnv: process.env.NODE_ENV || 'development'
};

// app.js
const config = require('./config/environment');
app.use(session({
  secret: config.sessionSecret,
  // ...
}));
```

### Testing
- Verify app starts without .env file (uses generated secret)
- Verify app uses .env values when present
- Test admin password change enforcement

---

## Phase 2: Backend Utilities & Validation (Week 1-2)
**Priority: HIGH - 5 days**

### Goals
- Extract duplicate validation into reusable modules
- Create shared utility functions
- Reduce route file complexity

### Files to Create

**Validators** (~200 lines total):
- `server/validators/coordinateValidator.js` (~50 lines) - Validate x,y,w,h ranges
- `server/validators/projectValidator.js` (~80 lines) - Project schema validation
- `server/validators/tooltipValidator.js` (~70 lines) - Tooltip schema validation

**Utilities** (~150 lines total):
- `server/utils/errors.js` (~80 lines) - Custom error classes (ValidationError, NotFoundError, etc.)
- `server/utils/sanitization.js` (~40 lines) - HTML escaping, input sanitization
- `server/utils/response.js` (~30 lines) - Standard response formatters

**Example:**
```javascript
// coordinateValidator.js (~50 lines)
function validateCoordinates(coordinates) {
  if (!coordinates) return null;
  const { x, y, w, h } = coordinates;

  if (!isValidRange(x) || !isValidRange(y) || !isValidRange(w) || !isValidRange(h)) {
    throw new ValidationError('Coordinates must be between 0 and 1');
  }

  return { x, y, w, h };
}

function isValidRange(val) {
  return typeof val === 'number' && val >= 0 && val <= 1;
}
```

### Files to Modify
- `server/routes/projects.js` - Use validators instead of inline checks (reduce from 426 to ~300 lines)
- `server/routes/uploads.js` - Add file validation (stays ~385 lines but cleaner)
- `server/routes/auth.js` - Use error classes (reduce from 154 to ~120 lines)

### Testing
- Unit test each validator with edge cases
- Test error responses are consistent
- Verify backward compatibility with existing API calls

---

## Phase 3: Database Refactoring (Week 2-3)
**Priority: HIGH - 7 days**

### Goals
- Eliminate dual-format detection logic
- Normalize schema with proper relationships
- Implement connection pooling

### Files to Create

**Database Layer** (~400 lines total):
- `server/db/connection.js` (~120 lines) - SQLite connection pool
- `server/db/migrations/001_normalize_schema.js` (~150 lines) - Migration script
- `server/models/Tooltip.js` (~80 lines) - Tooltip model with validation
- `server/models/Media.js` (~50 lines) - Media model

**New Schema:**
```sql
-- Separate concerns into proper tables
CREATE TABLE tooltips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  coordinates TEXT NOT NULL,
  created_at DATETIME,
  updated_at DATETIME
);

CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tooltip_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  under TEXT DEFAULT 'Turfmapp',
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME,
  FOREIGN KEY (tooltip_id) REFERENCES tooltips(id) ON DELETE CASCADE
);

CREATE TABLE media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'image', 'video', 'youtube'
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  url TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### Files to Modify
- `server/models/database.js` - Refactor to use new schema (from 405 to ~250 lines)
- `server/routes/projects.js` - Update CRUD operations (maintain backward-compatible API responses)

### Migration Strategy
1. **Backup:** Create automatic backup before migration
2. **Dual-read:** New API reads from both old and new schema during transition
3. **Migrate:** Convert all existing data to new schema
4. **Verify:** Test that all projects/tooltips display correctly
5. **Cleanup:** Remove old schema after 2-week verification period

### Testing
- Test migration with sample data
- Verify all existing tooltips/projects migrate correctly
- Test backward compatibility - old API responses still work
- Performance test connection pooling vs old approach

---

## Phase 4: Frontend Utilities (Week 3)
**Priority: HIGH - 5 days**

### Goals
- Extract duplicate frontend utilities
- Create reusable helper functions
- Reduce code duplication across pages

### Files to Create

**Shared Utilities** (~350 lines total):
- `public/js/utils/dom.js` (~100 lines)
  - `escapeHtml(text)` - Currently duplicated in 3+ files
  - `createElement(tag, className, content)`
  - `show(element)`, `hide(element)`
  - `toggleClass(element, className)`

- `public/js/utils/youtube.js` (~80 lines)
  - `getYouTubeVideoId(url)` - Currently duplicated in 2 files
  - `getYouTubeThumbnail(url)`
  - `createYouTubeEmbed(videoId, options)`

- `public/js/utils/media.js` (~120 lines)
  - `renderMedia(mediaItem, options)` - Consolidate media rendering logic
  - `detectMediaType(url)`
  - `createImageElement(url, alt)`
  - `createVideoElement(url)`

- `public/js/utils/api.js` (~50 lines)
  - `fetchProjects()`
  - `fetchProject(id)`
  - `saveProject(data)`
  - `uploadMedia(files)`
  - Centralize error handling

**Example:**
```javascript
// dom.js (~100 lines)
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function createElement(tag, className = '', content = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content) element.textContent = content;
  return element;
}

export function show(element) {
  element.classList.add('visible');
}

export function hide(element) {
  element.classList.remove('visible');
}
```

### Files to Modify
- `index.html` - Import and use shared utilities
- `admin/editor.html` - Replace duplicated functions
- `admin/dashboard.html` - Replace duplicated functions

### Testing
- Verify all pages work with shared utilities
- Test that no functionality breaks
- Check browser console for errors

---

## Phase 5: Extract Portfolio Frontend (Week 4)
**Priority: HIGH - 5 days**

### Goals
- Break index.html (1,851 lines) into manageable modules
- Each module under 500 lines
- Maintain all functionality

### Files to Create

**CSS Extraction** (~650 lines total):
- `public/css/base.css` (~150 lines) - Reset, typography, common styles
- `public/css/portfolio.css` (~500 lines) - Portfolio-specific styles

**JavaScript Modules** (~1,100 lines total):
- `public/js/lib/CameraSystem.js` (~350 lines)
  - Extract camera movement, dragging, bounds calculation
  - Pan controls, edge detection, smooth interpolation

- `public/js/lib/TooltipManager.js` (~400 lines)
  - Extract tooltip display, positioning, connection lines
  - Break down 220-line `showRegionTooltip()` into smaller methods:
    - `show(project, hotspot)`
    - `buildContent(project)`
    - `positionTooltip(hotspot)`
    - `showConnectionLine(hotspot)`

- `public/js/lib/HotspotRenderer.js` (~150 lines)
  - Extract hotspot creation and positioning logic

- `public/js/portfolio.js` (~200 lines)
  - Main initialization and orchestration
  - Load projects and setup components

**Structure:**
```javascript
// portfolio.js (~200 lines)
import { CameraSystem } from './lib/CameraSystem.js';
import { TooltipManager } from './lib/TooltipManager.js';
import { HotspotRenderer } from './lib/HotspotRenderer.js';
import { fetchProjects } from './utils/api.js';

class Portfolio {
  async init() {
    this.projects = await fetchProjects();
    this.camera = new CameraSystem(scene, worldLayer);
    this.tooltip = new TooltipManager(this.camera);
    this.hotspots = new HotspotRenderer(this.projects);
    this.setupEventListeners();
  }
}

new Portfolio().init();
```

### Files to Modify
- `index.html` - Reduce from 1,851 to ~150 lines (HTML + script tags only)

**Before:** index.html = 1,851 lines (HTML + CSS + JS)
**After:**
- index.html = ~150 lines (HTML structure only)
- CSS files = ~650 lines
- JS modules = ~1,100 lines
- Total: Same functionality, better organization

### Testing
- Visual regression test (screenshot comparison)
- Test all interactions: drag, hotspot click, tooltip display
- Test on desktop and mobile
- Verify performance (animation frame rate)

---

## Phase 6: Extract Admin Frontend (Week 5)
**Priority: MEDIUM - 5 days**

### Goals
- Break editor.html (1,667 lines) and dashboard.html (934 lines) into modules
- Each module under 500 lines
- Shared component library for admin pages

### Files to Create

**Shared Admin CSS** (~400 lines total):
- `public/css/admin-base.css` (~150 lines) - Admin layout, navigation
- `public/css/components.css` (~250 lines) - Buttons, forms, alerts, modals
  - Consolidate duplicate styles from 4 pages

**Editor Modules** (~1,150 lines total):
- `public/css/editor.css` (~350 lines) - Editor-specific styles
- `public/js/admin/editor/EditorManager.js` (~350 lines) - Main editor orchestration
- `public/js/admin/editor/ProjectForm.js` (~300 lines) - Form state and validation
- `public/js/admin/editor/MediaUploader.js` (~200 lines) - File upload handling
- `public/js/admin/editor/CoordinatePicker.js` (~150 lines) - Coordinate selection
- `public/js/admin/editor.js` (~150 lines) - Entry point and initialization

**Dashboard Modules** (~550 lines total):
- `public/css/dashboard.css` (~200 lines) - Dashboard-specific styles
- `public/js/admin/dashboard/DashboardManager.js` (~200 lines) - Main dashboard logic
- `public/js/admin/dashboard/ProjectList.js` (~150 lines) - Project listing and filtering
- `public/js/admin/dashboard.js` (~200 lines) - Entry point

**Shared Components** (~200 lines total):
- `public/js/components/Modal.js` (~100 lines) - Reusable modal component
- `public/js/components/Notification.js` (~100 lines) - Toast notifications

### Files to Modify
- `admin/editor.html` - Reduce from 1,667 to ~200 lines
- `admin/dashboard.html` - Reduce from 934 to ~150 lines
- `admin/index.html` - Use shared CSS (~333 to ~250 lines)

### Testing
- Test all CRUD operations work
- Test file uploads
- Test coordinate picker
- Verify no visual regressions

---

## Phase 7: Error Handling & Polish (Week 6)
**Priority: MEDIUM - 5 days**

### Goals
- Add comprehensive error handling
- Improve user feedback
- Add loading states

### Files to Create
- `server/middleware/errorHandler.js` (~100 lines) - Central error middleware
- `public/js/utils/errorHandler.js` (~80 lines) - Frontend error handling
- `public/js/components/LoadingSpinner.js` (~50 lines) - Loading states

### Changes
- Wrap all API calls with error handling
- Show user-friendly error messages
- Add loading spinners during operations
- Log errors for debugging

### Testing
- Test error scenarios (network failure, validation errors)
- Verify error messages are user-friendly
- Test loading states display correctly

---

## Phase 8: Testing & Documentation (Week 7-8)
**Priority: MEDIUM - 7 days**

### Goals
- Add automated tests
- Document architecture
- Create deployment guide

### Files to Create
- `tests/unit/validators.test.js`
- `tests/integration/api.test.js`
- `tests/e2e/portfolio.test.js`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`
- `docs/DEPLOYMENT.md`
- Update `README.md`

### Testing Strategy
- Unit tests for validators and utilities (70%+ coverage)
- Integration tests for API endpoints
- E2E tests for critical user flows
- Visual regression tests for frontend

---

## Implementation Order

### Week 1: Foundation
- Day 1-2: Phase 1 (Security & Config)
- Day 3-5: Phase 2 (Backend Utilities)

### Week 2-3: Database
- Day 6-10: Phase 3 (Database Refactoring)
- Day 11-12: Phase 3 Testing & Verification

### Week 3-4: Frontend Foundation
- Day 13-15: Phase 4 (Frontend Utilities)
- Day 16-20: Phase 5 (Portfolio Frontend)

### Week 5-6: Admin & Polish
- Day 21-25: Phase 6 (Admin Frontend)
- Day 26-30: Phase 7 (Error Handling)

### Week 7-8: Quality Assurance
- Day 31-35: Phase 8 (Testing)
- Day 36-40: Phase 8 (Documentation)
- Day 41-45: Buffer for fixes and refinements

---

## File Size Targets (All Under 500 Lines)

### Backend
- ✅ `server/config/environment.js` - 80 lines
- ✅ `server/validators/*.js` - 50-80 lines each
- ✅ `server/utils/*.js` - 30-80 lines each
- ✅ `server/models/*.js` - 80-250 lines each
- ✅ `server/routes/projects.js` - 300 lines (down from 426)
- ✅ `server/routes/auth.js` - 120 lines (down from 154)
- ✅ `server/middleware/errorHandler.js` - 100 lines

### Frontend - Portfolio
- ✅ `index.html` - 150 lines (down from 1,851)
- ✅ `public/css/portfolio.css` - 500 lines
- ✅ `public/js/lib/CameraSystem.js` - 350 lines
- ✅ `public/js/lib/TooltipManager.js` - 400 lines
- ✅ `public/js/lib/HotspotRenderer.js` - 150 lines
- ✅ `public/js/portfolio.js` - 200 lines

### Frontend - Admin
- ✅ `admin/editor.html` - 200 lines (down from 1,667)
- ✅ `admin/dashboard.html` - 150 lines (down from 934)
- ✅ `public/css/admin-base.css` - 150 lines
- ✅ `public/css/components.css` - 250 lines
- ✅ `public/js/admin/editor/*.js` - 150-350 lines each
- ✅ `public/js/admin/dashboard/*.js` - 150-200 lines each

### Utilities (All Under 150 Lines)
- ✅ `public/js/utils/dom.js` - 100 lines
- ✅ `public/js/utils/youtube.js` - 80 lines
- ✅ `public/js/utils/media.js` - 120 lines
- ✅ `public/js/utils/api.js` - 50 lines
- ✅ `public/js/utils/errorHandler.js` - 80 lines

---

## Backward Compatibility Strategy

### For Production Users:

1. **API Compatibility:** Maintain same API response format during transition
2. **Gradual Migration:** Database changes use dual-read period
3. **Feature Flags:** Use environment variables to enable new features gradually
4. **Rollback Plan:** Keep old code commented for 2 weeks after deployment
5. **Monitoring:** Log all API calls to detect issues early

### Deployment Steps:
1. Deploy Phase 1 (config) - No user impact
2. Deploy Phase 2 (validators) - No user impact
3. Deploy Phase 3 (database) with dual-read - Monitor for 1 week
4. Deploy Phase 4-5 (frontend) - A/B test with 10% of users
5. Deploy Phase 6 (admin) - Internal testing first
6. Deploy Phase 7-8 (polish) - Full rollout

---

## Success Metrics

- ✅ **No file over 500 lines**
- ✅ **Zero duplicated utility functions** (YouTube, escapeHtml, validation)
- ✅ **All API responses maintain backward compatibility**
- ✅ **No production errors** during rollout
- ✅ **70%+ test coverage** on backend critical paths
- ✅ **All security vulnerabilities fixed** (hardcoded secrets, XSS)
- ✅ **Improved maintainability:** New features don't require touching 5+ files

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking production during database migration | HIGH | Dual-read period, comprehensive backups, rollback plan |
| CSS/JS extraction causes visual regressions | MEDIUM | Screenshot comparison tests, gradual rollout |
| Performance degradation from module loading | LOW | Bundle in production, measure before/after |
| New bugs from refactoring | MEDIUM | Comprehensive testing, staged deployment |
| Timeline overrun | LOW | Buffer built into schedule, prioritize phases |

---

## Verification Plan

### After Each Phase:
1. Run automated tests
2. Manual testing of affected features
3. Check file sizes (must be under 500 lines)
4. Git commit with descriptive message
5. Tag release: `refactor-phase-{N}`

### End-to-End Verification:
1. Create new tooltip with multiple projects
2. Upload images/videos
3. Add YouTube URL
4. Set coordinates
5. View on portfolio page
6. Edit existing tooltip
7. Delete project
8. Verify all media loads
9. Test on mobile device
10. Check browser console for errors

---

## Next Steps

1. **Review this plan** and confirm approach
2. **Set up git branch:** `refactor/phase-1-security`
3. **Create backup:** Full database and code backup
4. **Start Phase 1:** Environment configuration
5. **Daily standups:** Track progress and blockers
