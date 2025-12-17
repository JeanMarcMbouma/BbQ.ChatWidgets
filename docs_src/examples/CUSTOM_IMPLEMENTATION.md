# Custom Implementation Example

Illustrates combining streaming endpoints and server-pushed widget updates:

- `POST /api/chat/stream/message` (SSE stream of chat turns)
- `GET|POST /api/chat/widgets/streams/{streamId}/events` (widget SSE subscribe/publish)
