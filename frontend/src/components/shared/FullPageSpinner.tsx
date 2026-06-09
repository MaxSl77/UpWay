export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center h-full w-full bg-bg">
      <div className="w-10 h-10 rounded-full border-2 border-surface3 border-t-accent animate-spin" />
    </div>
  )
}
