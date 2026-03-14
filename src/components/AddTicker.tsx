import { useState } from 'react';
import './AddTicker.css';

interface AddTickerProps {
  onAdd: (symbol: string) => void;
  placeholder?: string;
}

export function AddTicker({ onAdd, placeholder = 'Add ticker...' }: AddTickerProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue('');
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button className="addTickerBtn" onClick={() => setOpen(true)}>
        + add
      </button>
    );
  }

  return (
    <div className="addTickerRow">
      <input
        className="addTickerInput"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') { setOpen(false); setValue(''); }
        }}
        placeholder={placeholder}
        autoFocus
        maxLength={10}
      />
      <button className="addTickerGo" onClick={handleSubmit}>+</button>
      <button className="addTickerCancel" onClick={() => { setOpen(false); setValue(''); }}>✕</button>
    </div>
  );
}
