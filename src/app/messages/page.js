import MessengerPage from '@/components/chat/MessengerPage';

export const metadata = { title: 'Chats — Buddy Script' };

export default function MessagesRoute() {
  return (
    <>
      {/* Template stylesheets, same set as the feed page */}
      <link rel="stylesheet" href="/assets/css/bootstrap.min.css" precedence="feed-1" />
      <link rel="stylesheet" href="/assets/css/common.css" precedence="feed-2" />
      <link rel="stylesheet" href="/assets/css/main.css" precedence="feed-3" />
      <link rel="stylesheet" href="/assets/css/responsive.css" precedence="feed-4" />
      <link rel="stylesheet" href="/assets/css/chat-dock.css" precedence="feed-5" />
      <MessengerPage />
    </>
  );
}
