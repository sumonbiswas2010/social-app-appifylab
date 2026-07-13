function Bone({ className }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-dhover ${className}`} />;
}

export function PostSkeleton() {
  return (
    <div className="mb-4 rounded-md bg-white p-6 dark:bg-dcard">
      <div className="mb-4 flex items-center gap-3">
        <Bone className="h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <Bone className="h-3 w-2/5" />
          <Bone className="h-3 w-1/4" />
        </div>
      </div>
      <Bone className="mb-2 h-3 w-11/12" />
      <Bone className="mb-4 h-3 w-3/4" />
      <Bone className="h-56 w-full" />
    </div>
  );
}

export function FeedSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <PostSkeleton key={i} />
      ))}
    </>
  );
}

export function CommentSkeleton() {
  return (
    <div className="mt-3 flex items-start gap-3">
      <Bone className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Bone className="h-3 w-1/3" />
        <Bone className="h-3 w-4/5" />
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="rounded-md bg-white p-6 dark:bg-dcard">
      <Bone className="mb-4 h-4 w-1/2" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="mb-4 flex items-center gap-3">
          <Bone className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bone className="h-3 w-3/5" />
            <Bone className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
