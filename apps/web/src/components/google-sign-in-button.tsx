"use client";

type GoogleSignInButtonProps = {
  href: string;
  disabled?: boolean;
  reason?: string | null;
};

export function GoogleSignInButton({
  href,
  disabled = false,
  reason
}: GoogleSignInButtonProps) {
  if (disabled) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-3 rounded-full border border-[#ded4c8] bg-[#f3eee8] px-5 py-3 text-sm font-medium text-[#9a8a7b] opacity-80"
        >
          <GoogleMark />
          Continue with Google
        </button>
        {reason ? (
          <p className="text-sm leading-6 text-[#7d6c5e]">{reason}</p>
        ) : null}
      </div>
    );
  }

  return (
    <a
      href={href}
      className="flex w-full items-center justify-center gap-3 rounded-full bg-[#2c221b] px-5 py-3 text-sm font-medium text-[#f7efe5] transition hover:bg-[#413127]"
    >
      <GoogleMark />
      Continue with Google
    </a>
  );
}

function GoogleMark() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-[#2c221b]">
      G
    </span>
  );
}
