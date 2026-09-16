# API Documentation

## GET /events

Retrieve a list of events. Supports filtering and search via query parameters.

### Query Parameters

| Parameter | Type | Description | Example |
| --- | --- | --- | --- |
| `tag` | string | Filter events by a specific tag | `?tag=music` |
| `location` | string | Filter events by exact location | `?location=NYC` |
| `date_from` | string | Return events on or after this date (ISO 8601) | `?date_from=2026-01-01T00:00:00Z` |
| `date_to` | string | Return events on or before this date (ISO 8601) | `?date_to=2026-12-31T23:59:59Z` |
| `is_free` | boolean | Return only free (`true`) or paid (`false`) events | `?is_free=true` |
| `q` | string | Basic text search on event title and description | `?q=festival` |

### Response

Returns a JSON object containing an array of event records.

```json
{
  "events": [
    {
      "id": "event-123",
      "title": "Summer Festival",
      "description": "A great outdoor music festival.",
      "location": "NYC",
      "date": "2026-07-15T12:00:00Z",
      "is_free": true,
      "tags": ["music", "outdoor"]
    }
  ]
}
```
