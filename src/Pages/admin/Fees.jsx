import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { exportFeeStatuses, fetchAdminStudents, importFeeStatuses, updateStudentFeeStatus } from '../../services/api'

const REQUIRED_COLUMNS = ['student_id', 'fee_status']

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function parseRows(file) {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const values = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false })
    const headers = (values[0] || []).map((value) => String(value).trim().toLowerCase().replace(/^\uFEFF/, ''))
    const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column))
    if (missingColumns.length) throw new Error(`Missing required column${missingColumns.length > 1 ? 's' : ''}: ${missingColumns.join(', ')}`)
    const studentIndex = headers.indexOf('student_id')
    const statusIndex = headers.indexOf('fee_status')
    return values.slice(1).map((valuesRow, index) => ({
      rowNumber: index + 2,
      studentId: String(valuesRow[studentIndex] ?? '').trim(),
      feeStatus: String(valuesRow[statusIndex] ?? '').trim(),
    }))
  })
}

function buildPreview(rows, students) {
  const studentMap = new Map(students.map((student) => [student.studentId, student]))
  const seen = new Set()
  return rows.map((row) => {
    const reasons = []
    const student = studentMap.get(row.studentId)
    if (!row.studentId) reasons.push('Student ID is required')
    if (!['CLEAR', 'UNCLEAR'].includes(row.feeStatus)) reasons.push('Fee status must be CLEAR or UNCLEAR')
    if (row.studentId && seen.has(row.studentId)) reasons.push('Duplicate student ID in upload')
    if (row.studentId) seen.add(row.studentId)
    if (!student && row.studentId) reasons.push('Student ID was not found')
    return { ...row, studentName: student?.name || 'Not found', currentFeeStatus: student?.feeStatus || 'N/A', reasons, valid: reasons.length === 0 }
  })
}

function Fees() {
  const [students, setStudents] = useState([])
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  const loadStudents = () => fetchAdminStudents().then(setStudents).catch(() => setError('Unable to load fee statuses.'))
  useEffect(() => { loadStudents() }, [])

  const changeStatus = async (studentId, status) => {
    const previous = students.find((student) => student.id === studentId)?.feeStatus
    setStudents((current) => current.map((student) => student.id === studentId ? { ...student, feeStatus: status } : student))
    try { await updateStudentFeeStatus(studentId, status) } catch { setStudents((current) => current.map((student) => student.id === studentId ? { ...student, feeStatus: previous } : student)); setError('Unable to update fee status.') }
  }

  const selectFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setMessage('')
    try {
      const rows = await parseRows(file)
      if (!rows.length) throw new Error('The selected file contains no records.')
      setPreview({ fileName: file.name, rows: buildPreview(rows, students) })
    } catch (parseError) {
      setPreview(null)
      setError(parseError.message || 'Unable to parse the selected file.')
    }
  }

  const cancelImport = () => { setPreview(null); setError('') }

  const confirmImport = async () => {
    if (!preview || validCount === 0) return
    setImporting(true)
    setError('')
    try {
      const result = await importFeeStatuses(preview.rows.map(({ rowNumber, studentId, feeStatus }) => ({ rowNumber, studentId, feeStatus })))
      await loadStudents()
      setMessage(`Import complete: ${result.summary.updated} updated, ${result.summary.invalid} invalid, ${result.summary.notFound} students not found.`)
      setPreview(null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to import fee statuses.')
    } finally { setImporting(false) }
  }

  const exportCurrentStatus = async () => {
    try { downloadBlob(await exportFeeStatuses(), 'fee-status.csv') } catch { setError('Unable to export current fee statuses.') }
  }

  const validCount = preview?.rows.filter((row) => row.valid).length || 0
  const invalidCount = preview?.rows.length - validCount || 0
  return <main className="admin-management-page">
    <div className="admin-page-heading fee-page-heading"><div><p className="section-label">ADMIN PORTAL</p><h1>Fee Status</h1><p>Fee status controls examination access and QR issuance.</p></div><div className="fee-actions"><button className="admin-secondary-button" type="button" onClick={exportCurrentStatus}>Export Current Status</button><button className="admin-primary-button" type="button" onClick={() => fileInputRef.current?.click()}>Upload Fee Status</button><input ref={fileInputRef} hidden type="file" accept=".csv,.xlsx" onChange={selectFile} /></div></div>
    {error && <p className="admin-table-error">{error}</p>}
    {message && <p className="admin-success-message">{message}</p>}
    {preview && <section className="fee-import-panel"><div className="fee-import-heading"><div><h2>Import Preview</h2><p>{preview.fileName} · Invalid rows will be skipped; valid rows can still be imported.</p></div><div className="fee-import-actions"><button className="admin-secondary-button" type="button" onClick={cancelImport}>Cancel</button><button className="admin-primary-button" type="button" disabled={importing || validCount === 0} onClick={confirmImport}>{importing ? 'Importing...' : 'Confirm Import'}</button></div></div><div className="fee-import-summary"><span><b>{preview.rows.length}</b>Total records</span><span className="valid"><b>{validCount}</b>Valid records</span><span className="invalid"><b>{invalidCount}</b>Invalid records</span></div><div className="fee-preview-table-wrap"><table className="fee-preview-table"><thead><tr><th>Row</th><th>Student ID</th><th>Student name</th><th>Current status</th><th>New status</th><th>Result</th></tr></thead><tbody>{preview.rows.map((row) => <tr key={`${row.rowNumber}-${row.studentId}`}><td>{row.rowNumber}</td><td>{row.studentId || '—'}</td><td>{row.studentName}</td><td>{row.currentFeeStatus}</td><td>{row.feeStatus || '—'}</td><td className={row.valid ? 'preview-valid' : 'preview-invalid'}>{row.valid ? 'Valid' : row.reasons.join('; ')}</td></tr>)}</tbody></table></div></section>}
    <div className="fee-list">{students.map((student) => <div className="fee-row" key={student.id}><div><strong>{student.name}</strong><span>{student.studentId} · {student.email}</span></div><select value={student.feeStatus} onChange={(event) => changeStatus(student.id, event.target.value)} aria-label={`Fee status for ${student.name}`}><option value="CLEAR">CLEAR</option><option value="UNCLEAR">UNCLEAR</option></select></div>)}</div>
  </main>
}

export default Fees
