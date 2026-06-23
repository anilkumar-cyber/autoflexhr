import { useRef, useEffect } from 'react';
import { FiBold, FiItalic, FiUnderline, FiList } from 'react-icons/fi';

const COLORS = ['#111827', '#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed'];

export default function RichTextEditor({ value, onChange, placeholder }) {
  const ref = useRef(null);
  const lastValue = useRef(value);

  useEffect(() => {
    if (ref.current && value !== lastValue.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = value || '';
      lastValue.current = value;
    }
  }, [value]);

  const exec = (cmd, arg) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    handleInput();
  };

  const handleInput = () => {
    const html = ref.current?.innerHTML || '';
    lastValue.current = html;
    onChange(html);
  };

  return (
    <div className="border border-surface-border dark:border-surface-border-dark rounded-xl overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 dark:bg-white/5 border-b border-surface-border dark:border-surface-border-dark">
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('bold')}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300" title="Bold">
          <FiBold className="w-3.5 h-3.5" />
        </button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('italic')}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300" title="Italic">
          <FiItalic className="w-3.5 h-3.5" />
        </button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('underline')}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300" title="Underline">
          <FiUnderline className="w-3.5 h-3.5" />
        </button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('insertUnorderedList')}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300" title="Bullet list">
          <FiList className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-surface-border dark:bg-surface-border-dark mx-1" />
        {COLORS.map(c => (
          <button key={c} type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('foreColor', c)}
            className="w-4 h-4 rounded-full ring-1 ring-black/10 hover:scale-110 transition-transform" style={{ background: c }} title={c} />
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="rich-text-area w-full px-3 py-2.5 text-sm bg-white dark:bg-surface-dark text-gray-900 dark:text-white focus:outline-none min-h-[90px] max-h-60 overflow-y-auto"
        suppressContentEditableWarning
      />
    </div>
  );
}
