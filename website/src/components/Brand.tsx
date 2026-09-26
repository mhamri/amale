import { asset } from '../lib/paths';

export default function Brand() {
  return (
    <a href={asset('')} class="flex items-center gap-2.5 rounded-field" aria-label="Amaleh home">
      <img
        src={asset('brand/amaleh-mark.png')}
        srcset={`${asset('brand/amaleh-mark@2x.png')} 2x`}
        sizes="30px"
        width="30"
        height="30"
        alt=""
        class="size-[30px]"
      />
      <span class="font-display text-xl font-semibold tracking-tight">amaleh</span>
    </a>
  );
}