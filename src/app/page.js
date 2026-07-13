import Feed from '@/components/Feed';

export default function HomePage() {
  return (
    <>
      {/* Template stylesheets, scoped to the feed page (auth pages stay on Tailwind) */}
      <link rel="stylesheet" href="/assets/css/bootstrap.min.css" precedence="feed-1" />
      <link rel="stylesheet" href="/assets/css/common.css" precedence="feed-2" />
      <link rel="stylesheet" href="/assets/css/main.css" precedence="feed-3" />
      <link rel="stylesheet" href="/assets/css/responsive.css" precedence="feed-4" />
      <Feed />
    </>
  );
}
