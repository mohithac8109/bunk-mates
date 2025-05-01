// ContextMenu.js
import React from 'react';

const ContextMenu = ({ x, y, options, onClose }) => {
  return (
    <ul
      style={{
        position: 'absolute',
        top: y,
        left: x,
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        listStyle: 'none',
        padding: '10px',
        zIndex: 1000,
      }}
      onMouseLeave={onClose}
    >
      {options.map((option, index) => (
        <li
          key={index}
          onClick={() => {
            option.onClick();
            onClose();
          }}
          style={{ padding: '5px 10px', cursor: 'pointer' }}
        >
          {option.label}
        </li>
      ))}
    </ul>
  );
};

export default ContextMenu;
