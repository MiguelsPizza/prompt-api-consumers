import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';
import { renderMarkdown } from '../../utils/renderMarkdown'; // Move renderMarkdown to a utils file

interface MessageCardProps {
  role: 'user' | 'assistant';
  content: string;
  className?: string;
}

export function MessageCard({
  role,
  content,
  className = '',
}: MessageCardProps) {
  const isUser = role === 'user';

  return (
    <Card
      className={`mb-4 ${
        isUser ? 'ml-auto mr-4' : 'ml-4 mr-auto'
      } max-w-[80%] ${className}`}
    >
      <CardContent
        className={`p-4 flex ${isUser ? 'bg-blue-50' : 'bg-green-50'}`}
      >
        <Avatar className="mr-4">
          <AvatarFallback className={isUser ? 'bg-blue-100' : 'bg-green-100'}>
            {isUser ? (
              <User className="h-5 w-5 text-blue-500" />
            ) : (
              <Bot className="h-5 w-5 text-green-500" />
            )}
          </AvatarFallback>
          {!isUser && <AvatarImage src="/ai-avatar.png" />}
        </Avatar>
        <div>
          <p className="font-semibold">{isUser ? 'You' : 'Assistant'}</p>
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        </div>
      </CardContent>
    </Card>
  );
}
