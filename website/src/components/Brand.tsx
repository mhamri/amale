import { asset } from '../lib/paths';
import { LOCKUP_MARK, LOCKUP_MARK_2X } from '../lib/brand';

export default function Brand() {
  return (
    <a href={asset('')} class="flex items-center gap-2.5 rounded-field" aria-label="Amaleh home">
      <img
        src={asset(LOCKUP_MARK.publicPath)}
        srcset={`${asset(LOCKUP_MARK_2X.publicPath)} 2x`}
        width={LOCKUP_MARK.size}
        height={LOCKUP_MARK.size}
        alt=""
        class="size-[30px]"
      />
      <span class="font-display text-xl font-semibold tracking-tight">amaleh</span>
    </a>
  );
}
