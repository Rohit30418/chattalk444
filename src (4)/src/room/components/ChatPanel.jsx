import { lazy, memo, Suspense } from 'react';
const Chat = lazy(() => import('../../components/chat/Chat'));

const ChatPanel = memo(({ isOpen, uId }) => (
  <aside
    className={`fixed bottom-0 left-0 right-0 z-[58] overflow-hidden border-t border-white/10 bg-white shadow-2xl transition-all duration-300 ease-out dark:bg-[#0b1120] md:static md:z-auto md:h-full md:border-l md:border-t-0 ${
      isOpen
        ? 'h-[min(76dvh,720px)] max-h-[calc(100dvh-4rem)] translate-y-0 rounded-t-[2rem] md:h-full md:max-h-none md:w-[min(400px,34vw)] md:min-w-[330px] md:rounded-none'
        : 'h-0 translate-y-full md:h-full md:w-0 md:min-w-0 md:translate-y-0'
    }`}
    aria-hidden={!isOpen}
  >
    <Suspense
      fallback={(
        <div className="flex h-full items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-blue-500 border-t-transparent" />
        </div>
      )}
    >
      <Chat uId={uId} />
    </Suspense>
  </aside>
));

export default ChatPanel;
