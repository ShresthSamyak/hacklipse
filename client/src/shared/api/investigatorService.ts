export async function runInvestigation({
  testimonies,
  mode = "investigator"
}: {
  testimonies: Array<{ witness_id: string; text: string }>
  mode?: string
}) {
  const response = await fetch('http://127.0.0.1:8000/api/v1/demo/run-multi', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test'
    },
    body: JSON.stringify({
      mode,
      testimonies
    })
  })

  if (!response.ok) {
    throw new Error('Analysis failed. Please retry.')
  }

  return await response.json()
}
