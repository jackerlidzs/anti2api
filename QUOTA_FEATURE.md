# Model Quota Management Feature

## Feature Description

Added a model quota viewing function, allowing users to check the remaining quota and reset time for each Token in the frontend management interface.

## Implementation Scheme

### Data Storage
- **accounts.json**: Kept concise, storing only core authentication information.
- **data/quotas.json**: New file, specifically for storing quota information (lightweight persistence).
- **Memory Cache**: 5-minute cache to avoid frequent API requests.
- **Auto Cleanup**: Hourly cleanup of data not updated for more than 1 hour.

### Core Files

1. **src/api/client.js**
   - Added `getModelsWithQuotas(token)` function.
   - Extracts `quotaInfo` field from API response.
   - Returns a simplified quota data structure.

2. **src/auth/quota_manager.js** (New)
   - Quota cache management.
   - File persistence.
   - UTC time to Beijing time conversion.
   - Automatic cleanup of expired data.

3. **src/routes/admin.js**
   - Added `GET /admin/tokens/:refreshToken/quotas` endpoint.
   - Supports on-demand retrieval of quota info for specific Tokens.

4. **public/app.js** (and modularized js files)
   - Added `toggleQuota()` function: Expand/collapse quota panel.
   - Added `loadQuota()` function: Load quota data from API.
   - Added `renderQuota()` function: Render progress bar and quota info.

5. **public/style.css**
   - Added quota display related styles.
   - Progress bar styles (Supports color gradient: Green > 50%, Yellow 20-50%, Red < 20%).

## Usage

### Frontend Operations

1. Login to the management interface.
2. Click the **"📊 View Quota"** button in the Token card.
3. The system will automatically load all model quota information for that Token.
4. Displayed as a progress bar:
   - Model name
   - Remaining quota percentage (with color indication)
   - Quota reset time (Beijing Time)

### Data Format

#### API Response Example
```json
{
  "success": true,
  "data": {
    "lastUpdated": 1765109350660,
    "models": {
      "gemini-2.0-flash-exp": {
        "remaining": 0.972,
        "resetTime": "01-07 15:27",
        "resetTimeRaw": "2025-01-07T07:27:44Z"
      },
      "gemini-1.5-pro": {
        "remaining": 0.85,
        "resetTime": "01-07 16:15",
        "resetTimeRaw": "2025-01-07T08:15:30Z"
      }
    }
  }
}
```

#### quotas.json Storage Format
```json
{
  "meta": {
    "lastCleanup": 1765109350660,
    "ttl": 3600000
  },
  "quotas": {
    "1//0eDtvmkC_KgZv": {
      "lastUpdated": 1765109350660,
      "models": {
        "gemini-2.0-flash-exp": {
          "r": 0.972,
          "t": "2025-01-07T07:27:44Z"
        }
      }
    }
  }
}
```

## Features

✅ **On-demand Loading**: Fetch quota info only when user clicks.  
✅ **Smart Cache**: Use cache for repeated views within 5 minutes, reducing API requests.  
✅ **Auto Cleanup**: Periodically clean up expired data to keep file lightweight.  
✅ **Visual Display**: Progress bars intuitively show remaining quota.  
✅ **Color Indication**: Green (>50%), Yellow (20-50%), Red (<20%).  
✅ **Time Conversion**: Auto convert UTC time to Beijing time (or local time).  
✅ **Lightweight Storage**: Use field abbreviations, store only changed models.  

## Notes

1. First time viewing quota requires calling Google API, which may take a few seconds.
2. Quota info is cached for 5 minutes. For latest data, please wait for cache expiry or force refresh.
3. `quotas.json` file is automatically created, no manual configuration needed.
4. If Token is expired or invalid, an error message will be displayed.

## Testing

After starting the service:
```bash
npm start
```

Visit the management interface and click the "View Quota" button on any Token to test the function.
