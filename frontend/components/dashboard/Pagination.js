import React from 'react'

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = []

    for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
    }

    return (
        <div className="flex justify-center mt-4 space-x-2">
            {pages.map((p) => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`px-3 py-1 rounded ${p === currentPage ? 'bg-primary text-white' : 'bg-gray-200'
                        }`}
                >
                    {p}
                </button>
            ))}
        </div>
    )
}

export default Pagination
