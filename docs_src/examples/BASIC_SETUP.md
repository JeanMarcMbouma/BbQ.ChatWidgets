# Basic Setup Example

- Register `BbQ.ChatWidgets` services
- Call the `/api/chat/message` endpoint
- Render buttons or cards from the JavaScript client

Request shape (matches `UserMessageDto`):

```json
{ "message": "Hello", "threadId": "optional-thread-id" }
```
