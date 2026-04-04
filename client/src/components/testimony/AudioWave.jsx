/**
 * AudioWave — animated equalizer bars shown during recording
 * Props:
 *   count: number of bars (default 5)
 *   size: 'sm' | 'lg'
 */
export default function AudioWave({ count = 5, size = 'sm' }) {
  const barClass = size === 'lg' ? 'audio-wave-bar-lg' : 'audio-wave-bar'
  const containerHeight = size === 'lg' ? 'h-16' : 'h-10'

  return (
    <div className={`flex items-center justify-center gap-1 ${containerHeight}`} aria-label="Recording in progress" role="status">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={barClass}
          style={{ animationDelay: `${i * 0.1}s` }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
