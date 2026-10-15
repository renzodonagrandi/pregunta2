export function EditorSkeleton() {
  return (
    <div
      className='mx-auto flex w-full max-w-2xl flex-1 animate-pulse flex-col gap-4 px-4 pt-3'
      aria-busy
    >
      <div className='h-8 w-40 rounded-lg bg-zinc-200' />
      <div className='h-8 w-64 rounded-lg bg-zinc-200' />
      <div className='h-12 rounded-2xl bg-zinc-200' />
      <div className='h-11 rounded-xl bg-zinc-200' />
      <div className='h-40 rounded-2xl bg-zinc-200' />
      <div className='h-64 rounded-2xl bg-zinc-200' />
    </div>
  )
}
