import React from 'react';
import { motion } from 'framer-motion';

interface SelectionBarProps {
    selectedCount: number;
    onDelete: () => void;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({ selectedCount, onDelete }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-5 py-3 bg-red-950/20 border-b border-red-900/40 flex items-center justify-between"
        >
            <span className="data-label text-white">
                {selectedCount} SELECTED
            </span>
            <button
                onClick={onDelete}
                disabled={selectedCount === 0}
                className="px-5 py-2 bg-red-600 text-white data-label disabled:opacity-50 shadow-[3px_3px_0px_0px_#991b1b] cursor-pointer"
            >
                Delete
            </button>
        </motion.div>
    );
};
