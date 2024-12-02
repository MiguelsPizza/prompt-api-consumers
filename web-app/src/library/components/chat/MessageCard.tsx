import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

interface MessageCardProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export const MessageCard = ({ role, content, isStreaming }: MessageCardProps) => {
  const isUser = role === 'user';

  return (
    <Card
      className={`mb-4 ${isUser ? 'ml-auto mr-4' : 'ml-4 mr-auto'
        } max-w-[80%] ${isStreaming ? 'streaming' : ''} border-0 shadow-md overflow-hidden bg-transparent`}
    >
      <CardContent
        className={`p-4 flex ${isUser
            ? 'bg-gradient-to-br from-violet-600/20 to-violet-600/40 rounded-tr-none'
            : 'bg-transparent rounded-tl-none'
          }`}
      >
        <Avatar className={`mr-4 ${isUser ? 'ring-violet-600/20' : 'ring-primary/20'} ring-2`}>
          <AvatarFallback
            className={isUser
              ? 'bg-gradient-to-br from-violet-600/20 to-violet-600/40'
              : 'bg-gradient-to-br from-primary/10 to-primary/30'}
          >
            {isUser ? (
              <User className="h-5 w-5 text-violet-600" />
            ) : (
              <Bot className="h-5 w-5 text-primary" />
            )}
          </AvatarFallback>
          {!isUser && <AvatarImage src="/ai-avatar.png" />}
        </Avatar>
        <div>
          <p className={`font-semibold mb-1 ${isUser && 'text-violet-600'}`}>
            {isUser ? 'You' : 'Assistant'}
          </p>
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }
            }}
            className="prose prose-invert max-w-none"
          >
            {content}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};
