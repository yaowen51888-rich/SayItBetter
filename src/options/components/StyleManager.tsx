import { useState, useEffect } from 'react'
import type { UserStyle } from '../../shared/types'

interface Props {
  styles: UserStyle[]
  onSave: (styles: UserStyle[]) => void
}

export function StyleManager({ styles, onSave }: Props) {
  const [items, setItems] = useState<UserStyle[]>([])
  const [editing, setEditing] = useState<UserStyle | null>(null)

  useEffect(() => {
    setItems(styles)
  }, [styles])

  const handleAdd = () => {
    setEditing({
      id: `style_${Date.now()}`,
      name: '',
      prompt: '',
    })
  }

  const handleEdit = (style: UserStyle) => {
    setEditing({ ...style })
  }

  const handleDelete = async (id: string) => {
    const updated = items.filter(s => s.id !== id)
    setItems(updated)
    await onSave(updated)
  }

  const handleSave = async () => {
    if (!editing) return

    if (!editing.name.trim() || !editing.prompt.trim()) {
      alert('名称和 Prompt 描述不能为空')
      return
    }

    let updated: UserStyle[]
    if (items.find(s => s.id === editing.id)) {
      updated = items.map(s => s.id === editing.id ? editing : s)
    } else {
      updated = [...items, editing]
    }

    setItems(updated)
    setEditing(null)
    await onSave(updated)
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>风格模板</h2>
        <button className="btn-secondary" onClick={handleAdd}>
          + 添加
        </button>
      </div>

      <div className="style-list">
        {items.map((style) => (
          <div key={style.id} className="style-item">
            <div className="style-info">
              <span className="style-name">{style.name}</span>
              <span className="style-prompt">{style.prompt}</span>
            </div>
            <div className="style-actions">
              <button onClick={() => handleEdit(style)}>编辑</button>
              <button onClick={() => handleDelete(style.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{items.find(s => s.id === editing.id) ? '编辑风格' : '添加风格'}</h3>

            <div className="form-group">
              <label>名称</label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="例如：幽默风趣"
              />
            </div>

            <div className="form-group">
              <label>Prompt 描述</label>
              <textarea
                value={editing.prompt}
                onChange={(e) => setEditing({ ...editing, prompt: e.target.value })}
                placeholder="用幽默的语气，适当使用网络热词"
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditing(null)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleSave}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .section {
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          color: #0A0A0A;
        }

        .style-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .style-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          background: #FFFFFF;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .style-item:hover {
          border-color: #D4D4D4;
        }

        .style-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .style-name {
          font-weight: 500;
          font-size: 14px;
          color: #0A0A0A;
        }

        .style-prompt {
          font-size: 13px;
          color: #737373;
        }

        .style-actions {
          display: flex;
          gap: 8px;
        }

        .style-actions button {
          padding: 6px 12px;
          border: 1px solid #E5E5E5;
          border-radius: 4px;
          background: #FFFFFF;
          cursor: pointer;
          font-size: 13px;
          color: #0A0A0A;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .style-actions button:hover {
          background: #FAFAFA;
          border-color: #D4D4D4;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 10, 10, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 150ms cubic-bezier(0, 0, 0.2, 1);
        }

        .modal {
          background: #FFFFFF;
          padding: 24px;
          border-radius: 12px;
          width: 100%;
          max-width: 400px;
          animation: scaleIn 150ms cubic-bezier(0, 0, 0.2, 1);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .modal h3 {
          margin-bottom: 20px;
          font-size: 18px;
          font-weight: 600;
          color: #0A0A0A;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 14px;
          color: #0A0A0A;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          font-size: 14px;
          color: #0A0A0A;
          background: #FFFFFF;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #0A0A0A;
          box-shadow: 0 0 0 2px rgba(10, 10, 10, 0.05);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-primary {
          background: #0A0A0A;
          color: #FFFFFF;
        }

        .btn-primary:hover {
          background: #262626;
        }

        .btn-secondary {
          background: #FFFFFF;
          color: #0A0A0A;
          border: 1px solid #E5E5E5;
        }

        .btn-secondary:hover {
          background: #FAFAFA;
          border-color: #D4D4D4;
        }
      `}</style>
    </div>
  )
}
