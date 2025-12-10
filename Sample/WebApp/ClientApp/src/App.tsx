import { useChat } from './hooks/useChat';
import { ChatWindow } from './components/ChatWindow';
import './styles/App.css';

function App() {
  const chat = useChat('/api/chat');

  return (
    <div className="app">
      <ChatWindow {...chat} />
    </div>
  );
}

export default App;
