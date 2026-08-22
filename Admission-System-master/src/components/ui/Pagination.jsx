import React from "react";
import Button from "./Button";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 20, 50],
  showPageSizeSelector = true,
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let startPage = Math.max(
        1,
        currentPage - Math.floor(maxVisiblePages / 2)
      );
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      // Adjust if we're near the end
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  // Don't render pagination if there are no items
  if (totalItems === 0) {
    return null;
  }

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-4 py-3 border-t border-gray-200">
      {/* Items info */}
      <div className="text-sm text-gray-700">
        {totalPages === 1
          ? `Showing all ${totalItems} results`
          : `Showing ${startItem} to ${endItem} of ${totalItems} results`}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Page size selector */}
        {showPageSizeSelector && (
          <div className="flex items-center gap-2 mr-4">
            <label className="text-sm text-gray-700">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Previous button - only show if more than 1 page */}
        {totalPages > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm"
          >
            Previous
          </Button>
        )}

        {/* Page numbers - only show if more than 1 page */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {pageNumbers.map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 text-sm min-w-[40px] ${
                  page === currentPage
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "border-gray-300 hover:border-red-500 hover:text-red-600"
                }`}
              >
                {page}
              </Button>
            ))}
          </div>
        )}

        {/* Next button - only show if more than 1 page */}
        {totalPages > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default Pagination;
