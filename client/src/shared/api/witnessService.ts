export async function submitWitnessTestimony({
  case_id,
  witness_name,
  text,
  audioFile
}: {
  case_id?: string
  witness_name?: string
  text?: string
  audioFile?: File | Blob
}) {
  const formData = new FormData()
  
  if (audioFile) {
    formData.append('file', audioFile)
    formData.append('demo_mode', 'true')
    formData.append('fast_preview', 'false')
  } else {
    formData.append('text', text || '')
    formData.append('demo_mode', 'true')
    formData.append('fast_preview', 'false')
  }

  // The prompt asked: Mode must be: "survivor"
  formData.append('mode', 'survivor')
  
  if (case_id) {
    formData.append('case_id', case_id)
  }
  if (witness_name) {
    formData.append('witness_name', witness_name)
  }

  const response = await fetch('http://127.0.0.1:8000/api/v1/demo/run', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer test'
    },
    body: formData
  })

  if (!response.ok) {
    throw new Error('Something went wrong. Please try again.')
  }

  return await response.json()
}
