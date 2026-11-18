import ChatPanel from '@/components/ChatPanel';
import { type DashboardData, SectionLabel } from './shared';

export default function ChatTab({ token, group }: DashboardData) {
  return (
    <div className="flex flex-col gap-4 max-w-[760px]">
      <div className="flex flex-col gap-1">
        <SectionLabel>Group chat</SectionLabel>
        <p className="font-inter text-sm text-warm">
          Everyone in {group.name ?? 'your group'} can read and reply here. Your messages are marked Host. You can remove any message.
        </p>
      </div>
      <ChatPanel
        groupId={group.id}
        token={token}
        as="host"
        outsideChatLink={group.chat_link}
        prompts={[
          `Hi everyone! So glad you’re praying for ${group.countryName} with us.`,
          'What can we pray for you about this month?',
          'Quick update from the field:',
        ]}
      />
    </div>
  );
}
