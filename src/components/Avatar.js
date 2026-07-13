export default function Avatar({ user, size = 'h-10 w-10', textSize = 'text-sm' }) {
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.firstName}
        referrerPolicy="no-referrer"
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    );
  }
  if (!user) {
    return <span className={`${size} shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-dhover`} />;
  }
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` || '?';
  return (
    <span
      className={`${size} ${textSize} flex shrink-0 items-center justify-center rounded-full bg-brand font-semibold uppercase text-white`}
    >
      {initials}
    </span>
  );
}
