import { useState, useRef, useEffect } from 'react'
import Button from '../ui/Button'
import AudioWave from './AudioWave'

/**
 * AudioRecorder — shared component for Survivor and Witness pages
 * Supports: record, stop, audio upload
 * Props:
 *   waveSize: 'sm' | 'lg'
 *   onAudioReady: (blob) => void  (optional callback)
 */
export default function AudioRecorder({ waveSize = 'sm', onAudioReady }) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [recordingTime, setRecordingTime] = useState('00:00')
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const updateRecordingTime = () => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0')
    const seconds = (elapsed % 60).toString().padStart(2, '0')
    setRecordingTime(`${minutes}:${seconds}`)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        if (onAudioReady) onAudioReady(blob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(updateRecordingTime, 1000)
    } catch {
      alert('Microphone access denied. Please enable microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop())
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
      if (onAudioReady) onAudioReady(file)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {!isRecording ? (
          <Button variant="secondary" onClick={startRecording}>
            <i className="fas fa-microphone mr-2" aria-hidden="true" />
            Record Audio
          </Button>
        ) : (
          <Button variant="secondary" onClick={stopRecording}>
            <i className="fas fa-stop mr-2" aria-hidden="true" />
            Stop
          </Button>
        )}

        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isRecording}
        >
          <i className="fas fa-upload mr-2" aria-hidden="true" />
          Upload Audio
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
          aria-label="Upload audio file"
        />
      </div>

      {/* Recording status */}
      {isRecording && (
        <div className="mb-3">
          <AudioWave count={5} size={waveSize} />
          <p className="text-sm mt-2 font-mono-code text-[#9AB17A] text-center" role="timer" aria-live="polite">
            Recording... {recordingTime}
          </p>
        </div>
      )}

      {/* Audio preview */}
      {audioUrl && (
        <div className="mt-3">
          <audio controls src={audioUrl} className="w-full" aria-label="Recorded audio preview" />
        </div>
      )}
    </div>
  )
}
