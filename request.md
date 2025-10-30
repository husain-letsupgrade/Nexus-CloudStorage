### POST /register

{
  "email": "user@example.com",
  "password": "yourPassword123",
  "name": "Full Name",
  "mobile": "+1234567890"  
}

---

### POST /login

{
  "email": "user@example.com",
  "password": "yourPassword123"
}

---

### GET / (auth check)

No request body (GET)

---

### POST /admin/orgs  (admin only)

{
  "name": "My Organization",
  "description": "Optional description",
  "logo": "/assets/my-org.png"  # optional; if omitted, the default `/assets/group.png` will be used
}

---

### GET /orgs

No request body (GET) — returns only organizations the authenticated user belongs to

---

### POST /admin/orgs/:orgId/users  (admin only)

{
  "userId": "<userId to add>"
}

---

### GET /users/org/:orgId

No request body (GET)

---

### POST /files/org/:orgId/upload

Content-Type: multipart/form-data

Fields:
- file: (file to upload)
- description: "Optional description"
- tags: "tag1, tag2"

You can optionally upload into a folder by adding:
- folderId: "<folderId>" (this must be the folder's `folderId` string — not a MongoDB ObjectId)

When a file is created the stored document will include:
- `parentId` — the parent folder's `folderId` string (or null for root)
- `creatorId` — the ObjectId of the user who uploaded the file
---

### GET /files/search?q=<query>

No request body (GET)

Note: regular users can search only within their organizations using this endpoint. Admins must use the admin endpoint below to search a specific org.

---

### POST /folders/org/:orgId

{
  "name": "Folder Name",
  "parentId": "<optionalParentFolderId>"  # optional: use the parent's `folderId` string (not a MongoDB ObjectId)
}

---

### GET /folders/org/:orgId

No request body (GET)


---

### GET /folders/root?orgId=<orgId>

No request body (GET) — returns root folders and root files for the provided organization (requires Authorization)

---

### GET /folders/:folderId/contents

No request body (GET) — returns folder, subfolders, and files for the folder

Note: `:folderId` is the folder's `folderId` string (a UUID). Folder documents include:
- `folderId` (string) — unique folder identifier returned on create
- `parentId` (string|null) — parent's `folderId` or null for root
- `creatorId` (ObjectId|null) — id of the user who created the folder

---

### PATCH /folders/:folderId

{
  "name": "New Folder Name",
  "parentId": "<optionalNewParentId or null>"  # set to null to move to root
}

---

### DELETE /folders/:folderId

No request body (DELETE)

---

### GET /files/:fileId

No request body (GET)

---

### PATCH /files/:fileId

{
  "name": "New File Name",
  "description": "New description",
  "tags": "tag1, tag2"
}

---

### DELETE /files/:fileId

No request body (DELETE)

---

### GET /files/:fileId/download

No request body (GET) — streams file as attachment

Note: file documents include `parentId` (folder's `folderId` string) and `creatorId` (uploader's ObjectId)

---

### GET /admin/orgs/:orgId

No request body (GET) — admin only

---

### PATCH /admin/orgs/:orgId

{
  "name": "Updated Org Name",
  "description": "Updated description"
}

---

### DELETE /admin/orgs/:orgId

No request body (DELETE) — admin only

---

### GET /admin/users/:userId

No request body (GET) — admin only

---

### PATCH /admin/users/:userId

{
  "name": "Updated Name",
  "role": "admin"
}

---

### DELETE /admin/users/:userId

No request body (DELETE) — admin only


### GET /admin/orgs

No request body (GET) — requires Authorization: Bearer <admin-token>

---

### GET /admin/users

No request body (GET) — requires Authorization: Bearer <admin-token>

---

### GET /admin/users/search?orgId=<orgId>&q=<query>

No request body (GET) — requires Authorization: Bearer <admin-token>

---

### GET /admin/orgs/:orgId/files/search?q=<query>

No request body (GET) — admin only; searches files inside the specified organization

