import { PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface CreateConversationCardProps {
  onNewConversation: () => void;
}

export function CreateConversationCard({ onNewConversation }: CreateConversationCardProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Create a New Conversation</CardTitle>
          <CardDescription>Start a new chat by clicking the button below</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={onNewConversation} className="flex gap-2">
            <PlusCircle className="h-5 w-5" />
            New Conversation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}