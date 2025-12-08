# QA Test Plan: TaskFlow

## Scope
Verify the functionality, usability, and stability of the TaskFlow application.

## Test Environment
- **OS**: Windows (Local)
- **Browser**: Chrome (via Antigravity Browser)
- **Backend Port**: 3001
- **Frontend Port**: 5174

## Test Cases

### 1. Backend Verification
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| BE-01 | Health Check | GET `http://localhost:3001/health` | Status 200, returns `{status: 'UP'}` |
| BE-02 | Create Task | POST `/api/tasks` with `{title: "Test"}` | Status 201, returns task object with ID |
| BE-03 | Get Tasks | GET `/api/tasks` | Status 200, returns array |

### 2. Frontend Functionality
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| FE-01 | Load App | Open `http://localhost:5174` | Shows "TaskFlow" header and empty/list state |
| FE-02 | Add Task | Type "Buy Milk", Press Enter | "Buy Milk" appears in list immediately |
| FE-03 | Toggle Task | Click circle icon | Icon turns green checkmark, text strikes through |
| FE-04 | Delete Task | Click trash icon | Task disappears from list |
| FE-05 | Persistence | Refresh page | Tasks remain in same state as before refresh |

### 3. Edge Cases
- **Empty Title**: Try to create task with empty string -> Should not create.
- **Network Error**: Stop backend -> Frontend should handle gracefully (log error or show message).

## Automated Verification Script (Suggestion)
Run a script to curl the backend endpoints to verify API health before launching frontend.
