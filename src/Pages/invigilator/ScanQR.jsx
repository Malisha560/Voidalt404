import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { scanQrToken } from '../../services/api'

function ScanQR() {
  const navigate = useNavigate()
  const scannerRef = useRef(null)
  const scanInFlightRef = useRef(false)
  const [manualToken, setManualToken] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleToken = async (token) => {
    const cleanToken = token.trim()
    if (!cleanToken || submitting || scanInFlightRef.current) return
    scanInFlightRef.current = true
    setSubmitting(true)
    setError('')
    await stopScanner()
    try {
      const scanResult = await scanQrToken(cleanToken)
      navigate(`/invigilator/verification/${scanResult.student.id}?examId=${scanResult.exam.id}&source=qr`)
      setManualToken('')
    } catch (requestError) {
      setResult(null)
      const status = requestError.response?.status
      setError(status === 410 ? 'This QR code has expired. Ask the student to open a newly issued admit card QR code.' : requestError.response?.data?.message || 'Unable to verify this QR code.')
    } finally {
      setSubmitting(false)
      scanInFlightRef.current = false
    }
  }

  const startScanner = async () => {
    if (scannerRef.current || scanning) return
    setError('')
    setResult(null)
    scanInFlightRef.current = false
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner
    setScanning(true)
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (decodedText) => handleToken(decodedText),
        () => {},
      )
    } catch {
      scannerRef.current = null
      setScanning(false)
      setError('Camera access was unavailable. Use the manual token field instead.')
    }
  }

  const stopScanner = async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    setScanning(false)
    if (scanner?.isScanning) {
      await scanner.stop().catch(() => {})
      scanner.clear()
    }
  }

  useEffect(() => () => { stopScanner() }, [])

  return <main className="portal-main role-page scan-page">
    <div className="scan-page-heading"><div><p className="section-label">EXAMINATION ENTRY</p><h1>Scan QR Code</h1><p>Scan a student&apos;s digital admit card to verify their examination entry.</p></div><span className="scan-status">{result ? 'VERIFIED' : scanning ? 'SCANNER ACTIVE' : 'READY TO SCAN'}</span></div>
    <div className="scan-layout">
      <section className="scanner-panel">
        <div id="qr-reader" className="qr-reader" />
        {!scanning && !result && <div className="scanner-placeholder"><span>▣</span><strong>Camera scanner</strong><p>Start the scanner and position the student&apos;s QR code inside the frame.</p></div>}
        <div className="scanner-actions"><button className="scan-primary-button" type="button" onClick={scanning ? stopScanner : startScanner}>{scanning ? 'Stop Scanner' : 'Start Scanner'}</button>{(result || error) && <button className="scan-secondary-button" type="button" onClick={() => { setResult(null); setError(''); startScanner() }}>Scan Another</button>}</div>
        <form className="manual-scan-form" onSubmit={(event) => { event.preventDefault(); handleToken(manualToken) }}><label htmlFor="manual-qr-token">Manual QR token</label><div><input id="manual-qr-token" value={manualToken} onChange={(event) => setManualToken(event.target.value)} placeholder="Paste opaque token" /><button type="submit" disabled={!manualToken.trim() || submitting}>Verify</button></div></form>
        {error && <p className="scan-error" role="alert">{error}</p>}
      </section>
      <section className="verification-panel"><div className="verification-empty"><span>✓</span><h2>Verification details</h2><p>Student and examination information will appear here after a valid QR code is scanned.</p></div></section>
    </div>
  </main>
}

export default ScanQR
