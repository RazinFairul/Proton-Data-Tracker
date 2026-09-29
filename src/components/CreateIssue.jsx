import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';

const DRAFT_STORAGE_KEY = 'draft_create_new_issue';

export default function CreateIssue({ userProfile, onBackToDashboard, onIssueCreated }) {
  const [whatIssue, setWhatIssue] = useState('');
  const [description, setDescription] = useState('');
  const [groupName, setGroupName] = useState('');
  const [pic, setPic] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [classification, setClassification] = useState('');
  const [estimatedClosing, setEstimatedClosing] = useState('');
  const [file, setFile] = useState(null);

  // Multi-Link States
  const [linkList, setLinkList] = useState([]);
  const [tempLinkInput, setTempLinkInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  const fileInputRef = useRef(null);

  // 1. Pulihkan draf daripada localStorage semasa komponen dimuatkan
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.whatIssue) setWhatIssue(parsed.whatIssue);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.groupName) setGroupName(parsed.groupName);
        if (parsed.pic) setPic(parsed.pic);
        if (parsed.dateTime) setDateTime(parsed.dateTime);
        if (parsed.classification) setClassification(parsed.classification);
        if (parsed.estimatedClosing) setEstimatedClosing(parsed.estimatedClosing);
        if (Array.isArray(parsed.linkList)) setLinkList(parsed.linkList);
        setHasRestoredDraft(true);
      } catch (err) {
        console.error('Failed to parse saved draft:', err);
      }
    }
  }, []);

  // 2. Simpan draf ke localStorage setiap kali ada input berubah
  useEffect(() => {
    const draftPayload = {
      whatIssue,
      description,
      groupName,
      pic,
      dateTime,
      classification,
      estimatedClosing,
      linkList,
    };

    const hasAnyContent = Boolean(
      whatIssue ||
      description ||
      groupName ||
      pic ||
      dateTime ||
      classification ||
      estimatedClosing ||
      linkList.length > 0
    );

    if (hasAnyContent) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
    }
  }, [
    whatIssue,
    description,
    groupName,
    pic,
    dateTime,
    classification,
    estimatedClosing,
    linkList,
  ]);

  // Fungsi mengosongkan draf secara manual
  const handleClearDraft = () => {
    const confirmClear = window.confirm('Are you sure you want to clear this draft and reset all fields?');
    if (!confirmClear) return;

    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setWhatIssue('');
    setDescription('');
    setGroupName('');
    setPic('');
    setDateTime('');
    setClassification('');
    setEstimatedClosing('');
    setLinkList([]);
    setTempLinkInput('');
    handleRemoveFile();
    setHasRestoredDraft(false);
  };

  // Multi-Link Handlers
  const handleAddLink = () => {
    const trimmed = tempLinkInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch (_) {
      alert('Please enter a valid URL (e.g. https://...)');
      return;
    }
    setLinkList((prev) => [...prev, trimmed]);
    setTempLinkInput('');
  };

  const handleRemoveLink = (idxToRemove) => {
    setLinkList((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  // Remove selected file attachment
  const handleRemoveFile = () => {
    setFile(null);
    setCompressing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file selection and automatic image compression
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.type.startsWith('image/')) {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };

      try {
        setCompressing(true);
        const compressedBlob = await imageCompression(selectedFile, options);
        const compressedFile = new File([compressedBlob], selectedFile.name, {
          type: selectedFile.type,
          lastModified: Date.now(),
        });
        setFile(compressedFile);
      } catch (error) {
        console.error('Image compression failed, using original file:', error);
        setFile(selectedFile);
      } finally {
        setCompressing(false);
      }
    } else {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (compressing) {
      alert('Please wait, image is still being compressed...');
      return;
    }

    setLoading(true);

    try {
      const autoStaffName = 'Proton';
      const staffEmail = 'staff@proton.com';
      const staffIdVal = 'Proton ID';
      let fileUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('issue-attachments')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error('File upload failed: ' + uploadError.message);
        }

        const { data: urlData } = supabase.storage
          .from('issue-attachments')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
      }

      // Progress matrix (1/4 dan 4/4)
      const initialProgressMatrix = {
        root_cause: '',
        countermeasure: '',
        '1/4': {
          progress: '',
          remark: '',
          links: linkList
        },
        '4/4': { progress: '', remark: '', links: [] }
      };

      const { error: insertError } = await supabase.from('issues').insert([
        {
          what_issue: whatIssue,
          description: description,
          group_name: groupName,
          location: null,
          engine_variant: null,
          pic: pic,
          pic_name: pic,
          pic_email: staffEmail,
          date_time: dateTime || null,
          classification: classification,
          estimated_closing: estimatedClosing,
          staff_name: autoStaffName,
          staff_id: staffIdVal,
          file_url: fileUrl,
          onedrive_link: linkList.length > 0 ? linkList[0] : null,
          progress_matrix: initialProgressMatrix,
          user_id: null,
          user_email: staffEmail,
          status: 'In Progress (1/4)',
        },
      ]);

      if (insertError) {
        throw insertError;
      }

      // Padam draf setelah rekod berjaya dihantar
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      alert('Issue submitted successfully!');

      if (onIssueCreated) {
        onIssueCreated();
      } else if (onBackToDashboard) {
        onBackToDashboard();
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '10px 20px 30px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#0d3b66', margin: 0 }}>Open Issue</h2>
        {hasRestoredDraft && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
              📝 Draft Loaded
            </span>
            <button
              type="button"
              onClick={handleClearDraft}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                textDecoration: 'underline'
              }}
            >
              Clear Draft
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* What the Issue */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>What the Issue:</label>
          <input 
            type="text" 
            value={whatIssue} 
            onChange={(e) => setWhatIssue(e.target.value)} 
            required
            placeholder="Enter the Issue"
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Description:</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows="4" 
            required
            placeholder="Enter a Description" 
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        {/* Group Dropdown */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Group:</label>
          <select
            required
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
              backgroundColor: '#fff',
              cursor: 'pointer',
              color: groupName ? '#000' : '#888',
              fontSize: '16px'
            }}
          >
            <option value="" disabled hidden>Choose Group</option>
            <option value="Safety" style={{ color: '#000' }}>Safety</option>
            <option value="Cost" style={{ color: '#000' }}>Cost</option>
            <option value="Quality" style={{ color: '#000' }}>Quality</option>
            <option value="Time" style={{ color: '#000' }}>Time</option>
            <option value="Management" style={{ color: '#000' }}>Management</option>
            <option value="Others" style={{ color: '#000' }}>Others</option>
          </select>
        </div>

        {/* Person in Charge (PIC) Dropdown */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Person in Charge (PIC):</label>
          <select
            required
            value={pic}
            onChange={(e) => setPic(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
              backgroundColor: '#fff',
              cursor: 'pointer',
              color: pic ? '#000' : '#888',
              fontSize: '16px'
            }}
          >
            <option value="" disabled hidden>Choose Person in Charge</option>
            <option value="SHE" style={{ color: '#000' }}>SHE</option>
            <option value="GTP" style={{ color: '#000' }}>GTP</option>
            <option value="Quality" style={{ color: '#000' }}>Quality</option>
            <option value="Top Management" style={{ color: '#000' }}>Top Management</option>
            <option value="Others" style={{ color: '#000' }}>Others</option>
          </select>
        </div>

        {/* Time and Date */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Time and Date:</label>
          <input 
            type="datetime-local" 
            value={dateTime} 
            onChange={(e) => setDateTime(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px' }}
          />
        </div>

        {/* Issue Classification Dropdown */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Issue Classification:</label>
          <select 
            required
            value={classification} 
            onChange={(e) => setClassification(e.target.value)} 
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '5px', 
              border: '1px solid #ccc', 
              boxSizing: 'border-box', 
              backgroundColor: '#fff', 
              cursor: 'pointer', 
              color: classification ? '#000' : '#888', 
              fontSize: '16px' 
            }}
          >
            <option value="" disabled hidden>Choose Issue Classification</option>
            <option value="A" style={{ color: '#000' }}>Class A - Issues without Temporary Countermeasures</option>
            <option value="B" style={{ color: '#000' }}>Class B - Issues with Temporary Countermeasures</option>
            <option value="C" style={{ color: '#000' }}>Class C - Minor Issues</option>
          </select>
        </div>

        {/* Estimated Time of Closing */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Estimated Time of Closing Issue:</label>
          <input 
            type="date" 
            value={estimatedClosing} 
            onChange={(e) => setEstimatedClosing(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px' }}
          />
        </div>

        {/* File Uploads */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>File Uploads:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileChange} 
              style={{ 
                flex: 1, 
                padding: '8px', 
                borderRadius: '5px', 
                border: '1px solid #ccc', 
                boxSizing: 'border-box', 
                backgroundColor: '#fff' 
              }}
            />
            {file && (
              <button
                type="button"
                onClick={handleRemoveFile}
                title="Cancel and remove selected file"
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  borderRadius: '5px',
                  padding: '8px 12px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                ✕ Cancel
              </button>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', flexWrap: 'wrap', gap: '4px' }}>
            <small style={{ color: '#666' }}>Max: 50 MB (Images will be automatically compressed)</small>
            {compressing && <span style={{ color: '#0284c7', fontWeight: 'bold' }}>⏳ Compressing image...</span>}
            {!compressing && file && file.type.startsWith('image/') && (
              <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ {(file.size / 1024).toFixed(0)} KB ready</span>
            )}
          </div>
        </div>

        {/* Multi-Link Attachment Section */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', backgroundColor: '#f8fafc' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#1e293b' }}>
            🔗 Attachment Links:
          </label>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input 
              type="url" 
              value={tempLinkInput} 
              onChange={(e) => setTempLinkInput(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLink();
                }
              }}
              placeholder="Paste Link" 
              style={{ flex: 1, padding: '9px 12px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px', backgroundColor: '#fff' }}
            />
            <button
              type="button"
              onClick={handleAddLink}
              style={{
                padding: '9px 16px',
                backgroundColor: '#0d3b66',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              + Add Link
            </button>
          </div>

          <small style={{ color: '#64748b', display: 'block', marginBottom: '8px' }}>
            *Recommended for large files or videos exceeding standard storage limits.
          </small>

          {/* List of Added Links */}
          {linkList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {linkList.map((lnk, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#fff',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  <a
                    href={lnk}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}
                  >
                    🔗 Link {idx + 1}: {lnk}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(idx)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    title="Remove link"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading || compressing}
          style={{ 
            padding: '12px', 
            backgroundColor: loading || compressing ? '#94a3b8' : '#0d3b66', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '5px', 
            fontWeight: 'bold', 
            fontSize: '16px', 
            cursor: loading || compressing ? 'not-allowed' : 'pointer', 
            marginTop: '10px' 
          }}
        >
          {loading ? 'Submitting...' : compressing ? 'Optimizing Image...' : 'Submit Issue'}
        </button>
      </form>
    </div>
  );
}