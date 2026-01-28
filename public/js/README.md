# Frontend Module Documentation

The original `app.js` (1300+ lines) has been split into the following modules:

## Module Structure

```
js/
├── utils.js    - Utility functions (font size, hide sensitive info)
├── ui.js       - UI components (Toast, Modal, Loading, Tab switching)
├── auth.js     - Authentication (Login, Logout, OAuth)
├── tokens.js   - Token management (CRUD, Enable/Disable, Inline edit)
├── quota.js    - Quota management (View, Refresh, Cache, Inline display)
├── config.js   - Configuration management (Load, Save, Rotation strategy)
└── main.js     - Main entry point (Initialization, Event binding)
```

## Loading Order

Modules are loaded in dependency order (in `index.html`):

1. **utils.js** - Basic utility functions
2. **ui.js** - UI components (depends on utils)
3. **auth.js** - Authentication module (depends on ui)
4. **quota.js** - Quota module (depends on auth)
5. **tokens.js** - Token module (depends on auth, quota, ui)
6. **config.js** - Configuration module (depends on auth, ui)
7. **main.js** - Main entry point (depends on all modules)

## Module Responsibilities

### utils.js
- Font size setting and persistence
- Sensitive information show/hide toggle
- localStorage management

### ui.js
- Toast notifications
- Confirm dialogs
- Loading overlay
- Tab page switching

### auth.js
- User Login/Logout
- OAuth authorization flow
- authFetch wrapper (auto handle 401)
- Token authentication state management

### tokens.js
- Token list loading and rendering
- Token CRUD operations
- Inline field editing (projectId, email)
- Token detail modal

### quota.js
- Quota data caching (5 min TTL)
- Inline quota summary display
- Quota detail expand/collapse
- Quota modal (Multi-account switching)
- Force refresh quota

### config.js
- Config loading (.env + config.json)
- Config saving (Separate sensitive/non-sensitive)
- Rotation strategy management
- Rotation status display

### main.js
- Page initialization
- Login form event binding
- Config form event binding
- Auto login detection

## Global Variables

Global variables shared across modules:

- `authToken` - Authentication token (auth.js)
- `cachedTokens` - Token list cache (tokens.js)
- `currentQuotaToken` - Currently viewed quota Token (quota.js)
- `quotaCache` - Quota data cache object (quota.js)
- `sensitiveInfoHidden` - Sensitive info hidden state (utils.js)

## Advantages

1. **Maintainability** - Single responsibility per module, easy to locate and modify.
2. **Readability** - Reasonable file size (200-400 lines), clear code structure.
3. **Extensibility** - New features only need modifications in corresponding modules.
4. **Testability** - Independent modules, easier for unit testing.
5. **Collaboration Friendly** - Reduced conflicts during multi-person development.

## Notes

1. Modules communicate via global variables and functions.
2. Keep loading order to avoid dependency issues.
3. Be careful with cross-module function calls when modifying.