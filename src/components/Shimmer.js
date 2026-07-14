function Bone({ className, style }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-dhover ${className}`} style={style} />;
}

export function PostSkeleton() {
  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
      {/* header + body — mirrors _feed_inner_timeline_content */}
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div className="flex items-center gap-3">
            <Bone className="h-11 w-11 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Bone className="h-3 w-32" />
              <Bone className="h-2.5 w-20" />
            </div>
          </div>
        </div>
        <Bone className="mb-2 h-3 w-11/12" />
        <Bone className="mb-4 h-3 w-3/4" />
        <Bone className="h-64 w-full rounded-md" />
      </div>

      {/* counts row — mirrors _feed_inner_timeline_total_reacts */}
      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26 mt-4">
        <Bone className="h-4 w-24" />
        <Bone className="h-4 w-20" />
      </div>

      {/* action bar — mirrors _feed_inner_timeline_reaction */}
      <div className="_feed_inner_timeline_reaction">
        <Bone className="mx-1 h-9 flex-1" />
        <Bone className="mx-1 h-9 flex-1" />
        <Bone className="mx-1 h-9 flex-1" />
      </div>
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
    <div className="_comment_main" style={{ marginBottom: 20 }}>
      <Bone className="h-10 w-10 shrink-0 rounded-full" />
      <div className="_comment_area">
        {/* bubble — mirrors _comment_details */}
        <div className="space-y-2 rounded-2xl bg-gray-100 p-3 dark:bg-dcard" style={{ maxWidth: 340 }}>
          <Bone className="h-3 w-28" />
          <Bone className="h-3 w-52" />
        </div>
        {/* meta row — mirrors _comment_reply */}
        <div className="mt-2 flex gap-4 pl-3">
          <Bone className="h-2.5 w-8" />
          <Bone className="h-2.5 w-10" />
          <Bone className="h-2.5 w-12" />
        </div>
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
