export function EditorSkeleton() {
  return (
    <div className='flex w-full flex-1 bg-chalk' aria-busy>
      <div className='mx-auto flex w-full max-w-6xl animate-pulse flex-col gap-5 px-4 pt-4 lg:px-8 lg:pt-6'>
        <div className='h-8 w-36 rounded-lg bg-chalk-200' />
        <div className='h-10 w-64 rounded-lg bg-chalk-200' />
        <div className='h-13 w-full rounded-xl bg-chalk-200 lg:w-80' />
        <div className='grid gap-8 lg:grid-cols-[20rem_1fr]'>
          <div className='aspect-square rounded-full bg-chalk-200' />
          <div className='flex flex-col gap-4'>
            <div className='h-56 rounded-2xl bg-chalk-200' />
            <div className='h-56 rounded-2xl bg-chalk-200' />
          </div>
        </div>
      </div>
    </div>
  )
}
