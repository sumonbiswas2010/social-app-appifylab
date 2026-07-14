export function AuthShapes() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0">
        <img src="/assets/images/shape1.svg" alt="" className="dark:hidden" />
        <img src="/assets/images/dark_shape.svg" alt="" className="hidden dark:block" />
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0">
        <img src="/assets/images/shape2.svg" alt="" className="dark:hidden" />
        <img src="/assets/images/dark_shape1.svg" alt="" className="hidden opacity-40 dark:block" />
      </div>
      <div className="pointer-events-none absolute bottom-0 right-0">
        <img src="/assets/images/shape3.svg" alt="" className="dark:hidden" />
        <img src="/assets/images/dark_shape2.svg" alt="" className="hidden opacity-40 dark:block" />
      </div>
    </>
  );
}

export function GoogleButton({ label }) {
  return (
    <button
      type="button"
      onClick={() => (window.location.href = '/api/auth/google')}
      className="cursor-pointer mb-8 flex w-full items-center justify-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-muted shadow-sm transition hover:shadow dark:border-dhover dark:bg-dcard dark:text-gray-300"
    >
      <img src="/assets/images/google.svg" alt="" className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="mb-8 flex items-center gap-4">
      <span className="h-px flex-1 bg-gray-200 dark:bg-dhover" />
      <span className="text-sm text-muted dark:text-gray-400">Or</span>
      <span className="h-px flex-1 bg-gray-200 dark:bg-dhover" />
    </div>
  );
}

export function AuthInput({ label, ...props }) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm text-muted dark:text-gray-300">{label}</label>
      <input
        {...props}
        className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-dhover dark:bg-dpage dark:text-white"
      />
    </div>
  );
}
